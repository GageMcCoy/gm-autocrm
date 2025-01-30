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
  resolution?: {
    status: string;
    confidence: number;
    reason: string;
  };
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

    // Create the message without resolution field
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ticket_id: params.ticketId,
        sender_id: params.senderId,
        sender_name: senderName,
        content: params.content
      }])
      .select()
      .single();

    if (error) throw error;

    // If there's a resolution status, update the ticket directly
    if (params.resolution && params.senderId === AI_ASSISTANT_ID) {
      if (params.resolution.status === 'potential_resolution' && params.resolution.confidence > 0.8) {
        await supabase
          .from('tickets')
          .update({ 
            status: 'Pending Resolution',
            last_ai_confidence: params.resolution.confidence,
            last_ai_reason: params.resolution.reason
          })
          .eq('id', params.ticketId);
      } else if (params.resolution.status === 'escalate' && params.resolution.confidence > 0.8) {
        await supabase
          .from('tickets')
          .update({ 
            status: 'Needs Attention',
            needs_human_attention: true,
            last_ai_confidence: params.resolution.confidence,
            last_ai_reason: params.resolution.reason
          })
          .eq('id', params.ticketId);
      }
    }

    // Return the message with resolution for client-side use only
    return {
      ...data,
      resolution: params.resolution
    };
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

    // Create the message without resolution field
    const message = await createMessage(supabase, {
      ticketId,
      senderId: AI_ASSISTANT_ID,
      senderName: 'AI Assistant',
      content: response.message,
      resolution: response.resolution
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
        resolution: {
          status: 'escalate',
          confidence: 1.0,
          reason: 'Error in AI processing'
        }
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