'use server';

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Only initialize LangChain when the function is called
async function getModel() {
  return new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
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

    // Parse the JSON response
    const parsedResponse = JSON.parse(result);
    return {
      message: parsedResponse.message,
      resolution: parsedResponse.resolution
    };
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
        
        Respond in JSON format with 'priority' (High, Medium, or Low) and 'reason'.
      `),
      model,
      new StringOutputParser(),
    ]);

    const result = await priorityChain.invoke({
      title,
      description,
    });

    return JSON.parse(result);
  } catch (error) {
    console.error('Priority Analysis Error:', error);
    return { 
      priority: 'Medium',
      reason: 'Default priority due to analysis error'
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
      PromptTemplate.fromTemplate(`
        You are a helpful customer support AI assistant. Your task is to continue the conversation about a support ticket.
        You should evaluate if the issue appears to be resolved or needs escalation.

        Ticket Information:
        Title: {title}
        Status: {ticketStatus}
        ID: {ticketId}

        Knowledge Base Context:
        {context}

        Previous Conversation:
        {conversationHistory}

        Latest User Message:
        {userMessage}

        Instructions:
        1. Maintain context from the previous conversation
        2. Use knowledge base articles when relevant
        3. If you can fully resolve the issue:
           - Provide the solution clearly
           - Mark as potentially resolved
           - Ask for confirmation
        4. If you need more information:
           - Ask specific questions
           - Keep the conversation focused
        5. If escalation is needed:
           - Explain why
           - Recommend human support
        6. Keep responses professional but friendly
        7. Be concise but thorough

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

    // Parse the JSON response
    const parsedResponse = JSON.parse(result);
    return {
      message: parsedResponse.message,
      resolution: parsedResponse.resolution
    };
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