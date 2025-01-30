import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Client } from 'langsmith';

// Initialize LangSmith client
const client = new Client({
  apiUrl: process.env.LANGSMITH_ENDPOINT,
  apiKey: process.env.LANGSMITH_API_KEY,
});

// Models from environment variables
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const COMPLETION_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

// Initialize ChatOpenAI model
const model = new ChatOpenAI({
  modelName: COMPLETION_MODEL,
  temperature: 0.3,
  maxRetries: 2,
  timeout: 30000,
});

// Types for AI responses
interface PriorityAnalysis {
  priority: 'Low' | 'Medium' | 'High';
  reason: string;
}

interface ArticleQualityAnalysis {
  suggestions: string[];
  score: number;
}

interface InitialResponse {
  message: string;
  requiresMoreInfo: boolean;
  suggestedQuestions: string[];
}

interface TicketPattern {
  text: string;
  value: number;
}

// Create reusable prompt templates
const priorityAnalysisPrompt = PromptTemplate.fromTemplate(`
Analyze the priority of this support ticket.
Title: {title}
Description: {description}

Respond in JSON format with 'priority' (High, Medium, or Low) and 'reason'.
`);

const ticketPatternsPrompt = PromptTemplate.fromTemplate(`
Analyze these support tickets and identify common patterns or issues.
Tickets: {tickets}

Extract key themes and patterns. For each pattern:
1. Describe the issue concisely
2. Assign a relative frequency value (1-10)

Respond in JSON format as an array of objects with 'text' and 'value' properties.
Limit to the top 20 most significant patterns.
`);

const initialResponsePrompt = PromptTemplate.fromTemplate(`
You are a helpful customer support assistant with access to relevant knowledge base articles. Your goal is to provide accurate, helpful responses based on the available information.

When knowledge base articles are provided:
- Use their content as your primary source of information
- Incorporate specific details and solutions from the articles
- Reference the articles naturally in your response (e.g., "Based on our documentation...")
- Adapt the information to the specific user's context

You should:
- Start with a friendly but concise greeting
- Acknowledge the customer's issue clearly
- Keep the response under 3-4 short paragraphs
- Use simple formatting (just paragraphs, no fancy headers or signatures)
- Focus on immediate next steps or solutions
- End with a simple reassurance

Do not include:
- Subject lines or email headers
- Formal letter formatting
- Lengthy signatures
- Placeholder text

Ticket Title: {title}
Description: {description}
{articleContext}

Respond with a helpful, concise message that incorporates the knowledge base information when available:
`);

// Create chains
const priorityChain = RunnableSequence.from([
  priorityAnalysisPrompt,
  model,
  new StringOutputParser(),
]);

const patternsChain = RunnableSequence.from([
  ticketPatternsPrompt,
  model,
  new StringOutputParser(),
]);

const initialResponseChain = RunnableSequence.from([
  initialResponsePrompt,
  model,
  new StringOutputParser(),
]);

// Utility functions
async function analyzePriority(title: string, description: string): Promise<PriorityAnalysis> {
  try {
    const result = await priorityChain.invoke({
      title,
      description,
    }, {
      callbacks: [{
        handleLLMEnd: async (output) => {
          await client.createRun({
            name: "analyze_priority",
            run_type: "chain",
            inputs: { title, description },
            outputs: output,
          });
        },
      }],
    });
    return JSON.parse(result);
  } catch (error) {
    console.error('Error analyzing priority:', error);
    return { priority: 'Medium', reason: 'Default priority due to analysis error' };
  }
}

async function analyzeTicketPatterns(tickets: Array<{ title: string; description: string; messages: string[] }>): Promise<TicketPattern[]> {
  try {
    // Format tickets for analysis
    const formattedTickets = tickets.map(ticket => ({
      title: ticket.title,
      content: `${ticket.description}\n${ticket.messages.join('\n')}`,
    }));

    const result = await patternsChain.invoke({
      tickets: JSON.stringify(formattedTickets),
    }, {
      callbacks: [{
        handleLLMEnd: async (output) => {
          await client.createRun({
            name: "analyze_ticket_patterns",
            run_type: "chain",
            inputs: { tickets: formattedTickets },
            outputs: output,
          });
        },
      }],
    });

    return JSON.parse(result);
  } catch (error) {
    console.error('Error analyzing ticket patterns:', error);
    return [];
  }
}

async function generateInitialResponse(
  title: string, 
  description: string, 
  similarArticles?: Array<{ title: string; content: string; }>
): Promise<InitialResponse> {
  try {
    const articleContext = similarArticles?.length 
      ? `\nRelevant knowledge base articles:\n${similarArticles.map(a => 
          `Article: ${a.title}\n${a.content}`
        ).join('\n\n')}`
      : '';

    const result = await initialResponseChain.invoke(
      {
        title,
        description,
        articleContext
      },
      {
        callbacks: [{
          handleLLMEnd: async (output) => {
            await client.createRun({
              name: "generate_initial_response",
              run_type: "chain",
              inputs: { title, description, articleContext },
              outputs: output,
            });
          },
        }],
      }
    );

    const requiresMoreInfo = result.toLowerCase().includes('need more information') || 
                           result.toLowerCase().includes('could you please provide');
    
    // Extract suggested questions if the AI asked any
    const suggestedQuestions = result.match(/\?[^\?]*(?=\n|$)/g)?.map(q => q.trim()) || [];

    return {
      message: result,
      requiresMoreInfo,
      suggestedQuestions
    };
  } catch (error) {
    console.error('Error generating initial response:', error);
    return {
      message: 'I apologize, but I encountered an error while generating a response. A support agent will review your ticket as soon as possible.',
      requiresMoreInfo: false,
      suggestedQuestions: []
    };
  }
}

// Export all utility functions
export { 
  model, 
  client,
  analyzePriority,
  analyzeTicketPatterns,
  generateInitialResponse
}; 