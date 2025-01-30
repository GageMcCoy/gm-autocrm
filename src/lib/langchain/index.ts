import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Client } from 'langsmith';

// Validate environment variables
function validateEnvVariables() {
  const required = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY,
    LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT,
    LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
  };

  console.log('Environment variables loaded:', {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
    LANGCHAIN_API_KEY: !!process.env.LANGCHAIN_API_KEY ? 'Present' : 'Missing',
    LANGCHAIN_ENDPOINT: !!process.env.LANGCHAIN_ENDPOINT ? 'Present' : 'Missing',
    LANGCHAIN_PROJECT: !!process.env.LANGCHAIN_PROJECT ? 'Present' : 'Missing',
    LANGCHAIN_TRACING_V2: !!process.env.LANGCHAIN_TRACING_V2 ? 'Present' : 'Missing',
  });

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate environment before initializing
validateEnvVariables();

// Initialize LangSmith client
const client = new Client({
  apiUrl: process.env.LANGCHAIN_ENDPOINT!,
  apiKey: process.env.LANGCHAIN_API_KEY!,
});

// Initialize ChatOpenAI model
const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: 0.3,
  maxRetries: 2,
  timeout: 30000,
  openAIApiKey: process.env.OPENAI_API_KEY, // Explicitly set the API key
});

// Types
export interface InitialResponse {
  message: string;
  requiresMoreInfo: boolean;
  suggestedQuestions: string[];
}

export interface PriorityAnalysis {
  priority: 'Low' | 'Medium' | 'High';
  reason: string;
}

// Create reusable prompt templates
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

const priorityAnalysisPrompt = PromptTemplate.fromTemplate(`
Analyze the priority of this support ticket.
Title: {title}
Description: {description}

Respond in JSON format with 'priority' (High, Medium, or Low) and 'reason'.
`);

// Create chains
const initialResponseChain = RunnableSequence.from([
  initialResponsePrompt,
  model,
  new StringOutputParser(),
]);

const priorityChain = RunnableSequence.from([
  priorityAnalysisPrompt,
  model,
  new StringOutputParser(),
]);

// Utility functions
export async function generateInitialResponse(
  title: string,
  description: string,
  similarArticles?: Array<{ title: string; content: string; }>
): Promise<InitialResponse> {
  try {
    // Validate environment again before making API calls
    validateEnvVariables();

    const articleContext = similarArticles?.length
      ? `\nRelevant knowledge base articles:\n${similarArticles.map(a =>
          `Article: ${a.title}\n${a.content}`
        ).join('\n\n')}`
      : '';

    console.log('Generating initial response with:', {
      title,
      descriptionLength: description.length,
      numArticles: similarArticles?.length || 0,
      hasArticleContext: !!articleContext
    });

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
    
    const suggestedQuestions = result.match(/\?[^\?]*(?=\n|$)/g)?.map(q => q.trim()) || [];

    return {
      message: result,
      requiresMoreInfo,
      suggestedQuestions
    };
  } catch (error) {
    console.error('Error generating initial response:', error);
    if (error instanceof Error && error.message.includes('Missing required environment variables')) {
      throw new Error('Server configuration error: Missing API keys');
    }
    throw error;
  }
}

export async function analyzePriority(
  title: string,
  description: string
): Promise<PriorityAnalysis> {
  try {
    // Validate environment before making API calls
    validateEnvVariables();

    const result = await priorityChain.invoke(
      {
        title,
        description,
      },
      {
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
      }
    );

    return JSON.parse(result);
  } catch (error) {
    console.error('Error analyzing priority:', error);
    if (error instanceof Error && error.message.includes('Missing required environment variables')) {
      return { priority: 'Medium', reason: 'Server configuration error: Missing API keys' };
    }
    return { priority: 'Medium', reason: 'Default priority due to analysis error' };
  }
} 