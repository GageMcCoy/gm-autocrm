import { NextResponse } from 'next/server';
import { generateRAGResponse } from '@/utils/rag';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await generateRAGResponse(message);

    return NextResponse.json({
      response: result.response,
      usedArticles: result.usedArticles,
      needsLiveAgent: result.needsLiveAgent
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 