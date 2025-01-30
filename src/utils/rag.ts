import { searchSimilarArticles } from './vector-store';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  timeout: 30000,
  maxRetries: 2,
});

const SIMILARITY_THRESHOLD = 0.7; // Minimum similarity score to consider an article relevant

export async function generateRAGResponse(
  userQuery: string,
  maxArticles: number = 3
): Promise<{
  response: string;
  usedArticles: { title: string; similarity: number }[];
  needsLiveAgent: boolean;
}> {
  try {
    // Search for relevant articles
    const articles = await searchSimilarArticles(userQuery, maxArticles);

    if (articles.length === 0) {
      return {
        response: "I apologize, but I don't have enough information in my knowledge base to help with this specific issue. Let me connect you with a live agent who can better assist you.",
        usedArticles: [],
        needsLiveAgent: true
      };
    }

    // Prepare the context for GPT
    const context = articles
      .map(article => `Article: ${article.title}\n\nContent: ${article.content}`)
      .join('\n\n---\n\n');

    // Generate response using GPT-4
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful customer support AI that provides responses based STRICTLY on the provided knowledge base articles. 
          If you cannot answer the question completely using ONLY the information from the provided articles:
          1. DO NOT make up or infer information
          2. DO NOT use your general knowledge
          3. Instead, politely explain that you'll need to refer them to a live agent
          
          When answering:
          1. Be concise but thorough
          2. Use bullet points for steps or lists
          3. Format the response using markdown for better readability
          4. If relevant, cite the specific article you're referencing`
        },
        {
          role: 'user',
          content: `Knowledge Base Articles:\n\n${context}\n\nUser Question: ${userQuery}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content || '';
    const needsLiveAgent = response.toLowerCase().includes('live agent');

    return {
      response,
      usedArticles: articles.map(article => ({
        title: article.title,
        similarity: 0 // We'll implement similarity scores when needed
      })),
      needsLiveAgent
    };

  } catch (error) {
    console.error('Error generating RAG response:', error);
    return {
      response: "I apologize, but I'm having trouble accessing the knowledge base at the moment. Let me connect you with a live agent who can help.",
      usedArticles: [],
      needsLiveAgent: true
    };
  }
} 