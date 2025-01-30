import { SupabaseClient } from '@supabase/supabase-js';
import { generateAIResponse } from '@/app/actions/ai';
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
    const similarArticles = await findSimilarArticles(description);
    console.log('Found similar articles:', similarArticles.length);

    // Transform articles to only include relevant fields
    const relevantArticles = similarArticles.map(suggestion => ({
      title: suggestion.article.title,
      content: suggestion.article.content
    }));

    // Generate AI response using server action
    const response = await generateAIResponse(
      title,
      description,
      JSON.stringify(relevantArticles)
    );

    // Create the message with the complete content
    const message = await createMessage(supabase, {
      ticketId,
      senderId: AI_ASSISTANT_ID,
      senderName: 'AI Assistant',
      content: response.message
    });

    return {
      id: message.id,
      content: message.content,
      status: 'complete'
    };

  } catch (error) {
    console.error('Error creating AI response:', error);
    
    // Create a fallback message if AI fails
    try {
      const fallbackMessage = await createMessage(supabase, {
        ticketId,
        senderId: AI_ASSISTANT_ID,
        senderName: 'AI Assistant',
        content: 'I apologize, but I encountered an error while generating a response. A support agent will review your ticket as soon as possible.',
      });

      return {
        id: fallbackMessage.id,
        content: fallbackMessage.content,
        status: 'error'
      };
    } catch (fallbackError) {
      console.error('Error creating fallback message:', fallbackError);
      throw error;
    }
  }
} 