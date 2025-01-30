import OpenAI from 'openai';

// Models from environment variables
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const COMPLETION_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

// Initialize OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  return new OpenAI({
    apiKey,
    timeout: 30000, // 30 second timeout
    maxRetries: 2,
  });
}

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

// Core function for making OpenAI chat completions
async function createChatCompletion(
  systemPrompt: string,
  userContent: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const { model = COMPLETION_MODEL, temperature = 0.3, maxTokens } = options;
  const openai = getOpenAIClient();

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature,
      ...(maxTokens && { max_tokens: maxTokens }),
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI chat completion:', error);
    throw error;
  }
}

// Specialized functions using the core completion function
export async function analyzePriority(title: string, description: string): Promise<PriorityAnalysis> {
  try {
    // In Node.js environment (CLI/tests), use OpenAI directly
    if (typeof window === 'undefined') {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: COMPLETION_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a customer support AI that analyzes support tickets to determine their priority level.
            Consider factors like:
            - Business impact
            - Number of affected users
            - System functionality
            - Data security/privacy concerns
            - Time sensitivity
            
            Return a JSON object with two fields:
            - priority: one of ["Low", "Medium", "High"]
            - reason: brief explanation of the priority assignment`
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nDescription: ${description}`
          }
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '{"priority": "Medium", "reason": "Default priority due to analysis error"}';
      return JSON.parse(content);
    }

    // In browser environment, use the API route
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'analyzePriority',
        title,
        description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze priority');
    }

    const result = await response.json();
    return result as PriorityAnalysis;
  } catch (error) {
    console.error('Error analyzing priority:', error);
    return { priority: 'Medium', reason: 'Default priority due to analysis error' };
  }
}

export async function generateTags(title: string, content: string): Promise<string[]> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'generateTags',
        title,
        content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate tags');
    }

    const result = await response.json();
    return result.tags;
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
}

export async function analyzeArticleQuality(content: string): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'analyzeArticleQuality',
        content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze article quality');
    }

    const result = await response.json();
    return result.suggestions;
  } catch (error) {
    console.error('Error analyzing article quality:', error);
    return '';
  }
}

export async function generateInitialResponse(
  title: string,
  description: string,
  similarArticles: Array<{ title: string; content: string }>,
): Promise<InitialResponse> {
  try {
    // In Node.js environment (CLI/tests), use OpenAI directly
    if (typeof window === 'undefined') {
      const openai = getOpenAIClient();

      // Prepare context from similar articles
      const articleContext = similarArticles.length > 0
        ? `\nRelevant knowledge base articles:\n${similarArticles.map(article => 
            `Article: ${article.title}\n${article.content}`
          ).join('\n\n')}`
        : '';

      // Generate response using RAG
      const response = await openai.chat.completions.create({
        model: COMPLETION_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a helpful customer support AI that provides responses based on the knowledge base articles when available.
            If the knowledge base articles are relevant:
            1. Use their information to provide accurate, specific answers
            2. Reference the articles you're using
            3. Stay factual and avoid speculation
            
            If the knowledge base articles aren't relevant or if you need more information:
            1. Provide a helpful general response
            2. Ask clarifying questions if needed
            3. Let them know you'll connect them with support staff for more help
            
            Keep responses:
            - Professional but friendly
            - Concise but thorough
            - Focused on solutions
            - Well-structured with paragraphs or bullet points as needed`
          },
          {
            role: 'user',
            content: `Ticket Title: ${title}\n\nDescription: ${description}${articleContext}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const message = response.choices[0].message.content || 'Thank you for submitting your ticket. We will review it shortly.';
      const requiresMoreInfo = message.toLowerCase().includes('need more information') || 
                             message.toLowerCase().includes('could you please provide');
      
      // Extract suggested questions if the AI asked any
      const suggestedQuestions = message.match(/\?[^\?]*(?=\n|$)/g)?.map(q => q.trim()) || [];

      return {
        message,
        requiresMoreInfo,
        suggestedQuestions
      };
    }

    // In browser environment, use the API route
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'generateInitialResponse',
        title,
        description,
        similarArticles,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate response');
    }

    const result = await response.json();
    return result as InitialResponse;
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      message: 'Thank you for submitting your ticket. We will review it shortly.',
      requiresMoreInfo: false,
      suggestedQuestions: []
    };
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // In Node.js environment (CLI/tests), use OpenAI directly
    if (typeof window === 'undefined') {
      const openai = getOpenAIClient();
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });
      return response.data[0].embedding;
    }

    // In browser environment, use the API route
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'generateEmbedding',
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate embedding');
    }

    const result = await response.json();
    return result.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function generateArticleSuggestions(
  ticketTitle: string,
  ticketContent: string,
  similarArticles: Array<{ title: string; content: string }>
): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'generateArticleSuggestions',
        ticketTitle,
        ticketContent,
        similarArticles,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate article suggestions');
    }

    const result = await response.json();
    return result.suggestions;
  } catch (error) {
    console.error('Error generating article suggestions:', error);
    throw error;
  }
} 