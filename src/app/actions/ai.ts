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

export async function generateAIResponse(title: string, description: string, context: string = '') {
  try {
    const model = await getModel();
    
    const responseChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(`
        You are a helpful customer support AI assistant. Your task is to help users with their questions using only the information provided in the knowledge base articles.

        User Question:
        Title: {title}
        Description: {description}

        Available Knowledge Base Articles:
        {context}

        Instructions:
        1. Use ONLY the information from the provided articles to help the user
        2. If the articles don't contain the specific information needed, acknowledge this and refer to a support agent
        3. Don't make assumptions or provide information not present in the articles
        4. Keep responses concise and focused on the user's specific question
        5. If multiple articles are relevant, combine their information appropriately

        Response:
      `),
      model,
      new StringOutputParser(),
    ]);

    const result = await responseChain.invoke({
      title,
      description,
      context
    });

    return { message: result };
  } catch (error) {
    console.error('AI Response Error:', error);
    return { 
      message: 'I apologize, but I encountered an error. A support agent will review your ticket shortly.'
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