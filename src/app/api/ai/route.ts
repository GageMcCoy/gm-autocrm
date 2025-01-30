'use server';

import { NextResponse } from 'next/server';
import { generateAIResponse, analyzePriority } from '@/app/actions/ai';

export async function POST(request: Request) {
  // Log environment variables in the server context
  console.log('Server-side environment check:', {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
    LANGCHAIN_API_KEY: !!process.env.LANGCHAIN_API_KEY ? 'Present' : 'Missing',
    LANGCHAIN_ENDPOINT: !!process.env.LANGCHAIN_ENDPOINT ? 'Present' : 'Missing',
    LANGCHAIN_PROJECT: !!process.env.LANGCHAIN_PROJECT ? 'Present' : 'Missing',
  });

  try {
    const body = await request.json();
    const { operation, title, description, similarArticles } = body;

    // Log the incoming request
    console.log('AI API Request:', {
      operation,
      title,
      descriptionLength: description?.length,
      numArticles: similarArticles?.length
    });

    switch (operation) {
      case 'analyzePriority': {
        const priority = await analyzePriority(title, description);
        return NextResponse.json(priority);
      }

      case 'generateInitialResponse': {
        const response = await generateAIResponse(title, description, similarArticles);
        return NextResponse.json(response);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in AI route:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Server configuration error')) {
        return NextResponse.json(
          { 
            error: 'Server configuration error',
            details: 'The server is not properly configured. Please contact support.'
          },
          { status: 503 }
        );
      }
      
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { 
            error: 'OpenAI configuration error',
            details: 'OpenAI API is not properly configured. Please check server settings.'
          },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 