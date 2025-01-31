'use server';

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Only initialize LangChain when the function is called
async function getModel() {
  return new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.3,
    maxRetries: 2,
    timeout: 30000,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateAIResponse(title: string, description: string, context: string = ''): Promise<AIResponse> {
  try {
    const model = await getModel();
    
    const responseChain = RunnableSequence.from([   
        
      PromptTemplate.fromTemplate(`
        You are a helpful customer support AI assistant. Your task is to help users with their questions using the information provided in the knowledge base articles.
        You should also evaluate if the issue can be resolved immediately or needs further assistance.

        User Question:
        Title: {title}
        Description: {description}

        Available Knowledge Base Articles:
        {context}

        Instructions:
        1. Use the information from the provided articles to help the user
        2. If you can fully resolve the issue with the information available:
           - Provide a clear solution
           - Mark the ticket as potentially resolved
           - Ask the user to confirm if their issue is resolved
        3. If you need more information or cannot help:
           - Acknowledge what you understand
           - Ask specific questions
           - Keep the ticket open
        4. If the issue is beyond your capabilities:
           - Explain why
           - Recommend escalation to a support agent
        5. Keep responses concise and focused
        6. If multiple articles are relevant, combine their information appropriately

        Respond in this exact JSON format (do not include backticks or any other formatting):
        {{
          "message": "Your response to the user",
          "resolution": {{
            "status": "continue | potential_resolution | escalate",
            "confidence": 0.0 to 1.0,
            "reason": "Brief explanation of your assessment"
          }}
        }}
      `),
      model,
      new StringOutputParser(),
    ]);

    const result = await responseChain.invoke({
      title,
      description,
      context
    });

    try {
      // First try to parse the entire response as JSON in case it's wrapped in an output field
      let parsedResult;
      try {
        const outerJson = JSON.parse(result);
        // If we have an output field, use that
        if (outerJson.output) {
          parsedResult = outerJson.output;
        } else {
          parsedResult = result;
        }
      } catch {
        parsedResult = result;
      }

      // Clean and normalize the response
      const cleanedResult = parsedResult
        .replace(/```json\s*/g, '')  // Remove ```json
        .replace(/```\s*/g, '')      // Remove ```
        .replace(/^\s*{\s*|\s*}\s*$/g, '')  // Remove outer curly braces with whitespace
        .trim();                     // Remove any extra whitespace

      // Reconstruct a valid JSON string
      const jsonStr = `{${cleanedResult}}`;
      const parsedResponse = JSON.parse(jsonStr);

      return {
        message: String(parsedResponse.message || '').trim(),
        resolution: parsedResponse.resolution
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw response:', result);
      return { 
        message: 'I apologize, but I encountered an error. A support agent will review your ticket shortly.',
        resolution: {
          status: 'escalate',
          confidence: 1.0,
          reason: 'Error in AI processing'
        }
      };
    }
  } catch (error) {
    console.error('AI Response Error:', error);
    return { 
      message: 'I apologize, but I encountered an error. A support agent will review your ticket shortly.',
      resolution: {
        status: 'escalate',
        confidence: 1.0,
        reason: 'Error in AI processing'
      }
    };
  }
}

export async function analyzePriority(title: string, description: string) {
  try {
    const model = await getModel();
    
    const priorityChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(`
        Analyze the priority of this support ticket.
        Title: {title}
        Description: {description}

        Priority Levels:
        - Low: Not time sensitive, can be solved without a live customer support worker. These are typically feature requests, minor UI issues, or documentation questions.
        - Medium: Mix of time sensitivity and potential need for customer support. These issues affect user experience but don't completely block functionality.
        - High: Critical importance, affects core app functionality, payment processing, or security. Must be solved immediately as it significantly impacts business operations.

        Consider:
        1. Time Sensitivity: How urgent is the issue?
        2. Business Impact: Does it affect revenue or core functionality?
        3. User Impact: How many users are affected?
        4. Support Need: Does it require immediate human intervention?
        
        Respond in JSON format with 'priority' (High, Medium, or Low) and 'reason'.
      `),
      model,
      new StringOutputParser(),
    ]);

    const result = await priorityChain.invoke({
      title,
      description,
    });

    try {
      // First try to parse the entire response as JSON in case it's wrapped in an output field
      let parsedResult;
      try {
        const outerJson = JSON.parse(result);
        // If we have an output field, use that
        if (outerJson.output) {
          parsedResult = outerJson.output;
        } else {
          parsedResult = result;
        }
      } catch {
        parsedResult = result;
      }

      // Clean and normalize the response
      const cleanedResult = parsedResult
        .replace(/```json\s*/g, '')  // Remove ```json
        .replace(/```\s*/g, '')      // Remove ```
        .replace(/^\s*{\s*|\s*}\s*$/g, '')  // Remove outer curly braces with whitespace
        .trim();                     // Remove any extra whitespace

      // Reconstruct a valid JSON string
      const jsonStr = `{${cleanedResult}}`;
      const parsedResponse = JSON.parse(jsonStr);
      
      // Validate and normalize the priority value
      const priority = String(parsedResponse.priority || '').trim();
      const normalizedPriority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
      
      if (!['High', 'Medium', 'Low'].includes(normalizedPriority)) {
        throw new Error(`Invalid priority value: ${priority}`);
      }

      return {
        priority: normalizedPriority,
        reason: String(parsedResponse.reason || '').trim() || 'No reason provided'
      };
    } catch (parseError) {
      console.error('Error parsing priority response:', parseError);
      console.log('Raw response:', result);
      
      // Fallback to a default response if parsing fails
      return { 
        priority: 'Medium',
        reason: 'Default priority set due to response parsing error'
      };
    }
  } catch (error) {
    console.error('Priority Analysis Error:', error);
    return { 
      priority: 'Medium',
      reason: 'Default priority set due to analysis error'
    };
  }
}

// Add new types for resolution status
type ResolutionStatus = {
  status: 'continue' | 'potential_resolution' | 'escalate';
  confidence: number;
  reason: string;
};

// Enhance the response interface
interface AIResponse {
  message: string;
  resolution?: ResolutionStatus;
}

export async function generateFollowUpResponse(
  ticketId: string,
  title: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  ticketStatus: string,
  context: string = ''
): Promise<AIResponse> {
  try {
    const model = await getModel();
    
    const responseChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        'You are a helpful customer support AI assistant. Your task is to continue the conversation about a support ticket.\n' +
        'You should evaluate if the issue appears to be resolved or needs escalation.\n\n' +
        'Ticket Information:\n' +
        'Title: {title}\n' +
        'Status: {ticketStatus}\n' +
        'ID: {ticketId}\n\n' +
        'Knowledge Base Context:\n' +
        '{context}\n\n' +
        'Previous Conversation:\n' +
        '{conversationHistory}\n\n' +
        'Latest User Message:\n' +
        '{userMessage}\n\n' +
        'Status and Priority Rules:\n' +
        '1. Status Options:\n' +
        '   - "Resolved": When user confirms issue is solved (confidence 1.0)\n' +
        '   - "Escalated": For refunds, complex issues, or policy exceptions (confidence 1.0)\n' +
        '   - "In Progress": For ongoing issues needing attention\n' +
        '   - "Open": Default for unresolved issues\n' +
        '2. Priority Levels (use exactly as shown):\n' +
        '   - High: For urgent issues, payment problems, or service outages\n' +
        '   - Medium: For important but non-critical issues\n' +
        '   - Low: For general inquiries and minor issues\n\n' +
        'Instructions:\n' +
        '1. Maintain context from the previous conversation\n' +
        '2. Use knowledge base articles when relevant\n' +
        '3. If resolution is detected, thank them and ask if they need anything else\n' +
        '4. If escalation is needed, explain why you need to involve a human agent\n' +
        '5. If you need more information, ask specific questions\n' +
        '6. Keep responses professional but friendly\n' +
        '7. Be concise but thorough\n\n' +
        'Return your response as a JSON object with these fields:\n' +
        '1. message: Your response to the user\n' +
        '2. resolution: An object containing:\n' +
        '   - status: "Resolved", "Escalated", "In Progress", or "Open"\n' +
        '   - priority: High, Medium, or Low (without quotes)\n' +
        '   - confidence: 0.0 to 1.0\n' +
        '   - reason: Brief explanation of status and priority\n\n' +
        'Format your entire response as a valid JSON object only.'
      ),
      model,
      new StringOutputParser(),
    ]);

    const formattedHistory = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const result = await responseChain.invoke({
      title,
      ticketId,
      ticketStatus,
      userMessage,
      conversationHistory: formattedHistory,
      context
    });

    try {
      // First try to parse the entire response as JSON in case it's wrapped in an output field
      let parsedResult;
      try {
        const outerJson = JSON.parse(result);
        // If we have an output field, use that
        if (outerJson.output) {
          parsedResult = outerJson.output;
        } else {
          parsedResult = result;
        }
      } catch {
        parsedResult = result;
      }

      // Clean and normalize the response
      const cleanedResult = parsedResult
        .replace(/```json\s*/g, '')  // Remove ```json
        .replace(/```\s*/g, '')      // Remove ```
        .replace(/^\s*{\s*|\s*}\s*$/g, '')  // Remove outer curly braces with whitespace
        .trim();                     // Remove any extra whitespace

      // Reconstruct a valid JSON string
      const jsonStr = `{${cleanedResult}}`;
      const parsedResponse = JSON.parse(jsonStr);

      return {
        message: String(parsedResponse.message || '').trim(),
        resolution: parsedResponse.resolution
      };
    } catch (parseError) {
      console.error('Error parsing follow-up response:', parseError);
      console.log('Raw response:', result);
      return { 
        message: 'I apologize, but I encountered an error. A support agent will review your message shortly.',
        resolution: {
          status: 'escalate',
          confidence: 1.0,
          reason: 'Error in AI processing'
        }
      };
    }
  } catch (error) {
    console.error('AI Response Error:', error);
    return { 
      message: 'I apologize, but I encountered an error. A support agent will review your message shortly.',
      resolution: {
        status: 'escalate',
        confidence: 1.0,
        reason: 'Error in AI processing'
      }
    };
  }
} 