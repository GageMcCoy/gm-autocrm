import { NextResponse } from 'next/server';
import { generateAIResponse } from '@/app/actions/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    // Generate AI response
    const response = await generateAIResponse(title, description);

    return NextResponse.json({
      ticket: { id: 'new-ticket' }, // Replace with actual ticket creation
      response,
      priority: { priority: 'Medium', reason: 'Default priority' }
    });
  } catch (error) {
    console.error('Error in tickets API:', error);
    return NextResponse.json(
      { error: 'Failed to process ticket' },
      { status: 500 }
    );
  }
} 