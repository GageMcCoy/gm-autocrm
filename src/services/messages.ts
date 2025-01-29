import { SupabaseClient } from '@supabase/supabase-js';
import { generateInitialResponse } from '@/utils/openai';
import { findSimilarArticles } from '@/services/knowledge-base';

// Constant UUID for AI Assistant
export const AI_ASSISTANT_ID = '00000000-0000-0000-0000-000000000000';

interface CreateMessageParams {
  ticketId: string;
  senderId: string;
  senderName?: string;  // Make senderName optional
  content: string;
}

export async function createMessage(
  supabase: SupabaseClient,
  params: CreateMessageParams
) {
  try {
    // If senderName is not provided, try to get it from the users table
    let senderName = params.senderName;
    if (!senderName) {
      if (params.senderId === AI_ASSISTANT_ID) {
        senderName = 'AI Assistant';
      } else {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', params.senderId)
          .single();

        if (!userError && userData) {
          senderName = userData.name;
        }
      }
    }

    // Set default name if still not found
    if (!senderName) {
      senderName = 'Unknown User';
    }

    // Create the message
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ticket_id: params.ticketId,
        sender_id: params.senderId,
        sender_name: senderName,
        content: params.content,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in createMessage:', error);
    throw error;
  }
}

export async function createAIResponse(
  supabase: SupabaseClient,
  ticketId: string,
  title: string,
  description: string
): Promise<{ id: string; content: string; status: 'complete' | 'error' }> {
  try {
    // Find similar articles from knowledge base
    const similarArticles = await findSimilarArticles(supabase, description);

    // Generate AI response using similar articles
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
      throw new Error('Failed to generate AI response');
    }

    const data = await response.json();
    
    // Create the message with the complete content
    const message = await createMessage(supabase, {
      ticketId,
      senderId: AI_ASSISTANT_ID,
      senderName: 'AI Assistant',
      content: data.content,
    });

    return {
      id: message.id,
      content: data.content,
      status: 'complete'
    };

  } catch (error) {
    console.error('Error creating AI response:', error);
    // Create a fallback message if AI fails
    const fallbackMessage = await createMessage(supabase, {
      ticketId,
      senderId: AI_ASSISTANT_ID,
      senderName: 'AI Assistant',
      content: 'Thank you for submitting your ticket. Our support team will review it shortly.',
    });

    return {
      id: fallbackMessage.id,
      content: fallbackMessage.content,
      status: 'error'
    };
  }
} 