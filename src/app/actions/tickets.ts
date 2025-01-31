'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { analyzePriority, generateAIResponse } from '@/app/actions/ai';
import { findSimilarArticlesAction } from '@/app/actions/knowledge-base';
import { AI_ASSISTANT_ID } from '@/services/messages';
import { revalidatePath } from 'next/cache';

export async function resolveTicket({
  ticketId,
  resolutionNotes,
}: {
  ticketId: string;
  resolutionNotes: string;
}) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // First, get the ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error(ticketError?.message || 'Ticket not found');
    }

    // Update the ticket status to resolved
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'Resolved',
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Revalidate the tickets page to show updated status
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${ticketId}`);

    return { success: true };
  } catch (error) {
    console.error('Error resolving ticket:', error);
    return { success: false, error: (error as Error).message };
  }
}

interface CreateTicketParams {
  title: string;
  description: string;
  submittedBy: string;
}

export async function createTicketAction(params: CreateTicketParams) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get priority analysis
    const priorityAnalysis = await analyzePriority(params.title, params.description);

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        {
          title: params.title,
          description: params.description,
          status: 'Open',
          priority: priorityAnalysis.priority,
          submitted_by: params.submittedBy
        }
      ])
      .select()
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error('No ticket returned after creation');

    // Create initial customer message
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        ticket_id: ticket.id,
        sender_id: params.submittedBy,
        content: params.description
      }]);

    if (messageError) throw messageError;

    // Find similar articles using server action
    const similarArticlesResult = await findSimilarArticlesAction(params.description);
    const similarArticles = similarArticlesResult.success && similarArticlesResult.articles 
      ? similarArticlesResult.articles.map(article => ({
          title: article.title,
          content: article.content
        }))
      : [];

    console.log('Found similar articles:', similarArticles.length);

    // Generate AI response
    const response = await generateAIResponse(
      params.title,
      params.description,
      JSON.stringify(similarArticles)
    );

    // Create AI response message
    const { error: aiError } = await supabase
      .from('messages')
      .insert([{
        ticket_id: ticket.id,
        sender_id: AI_ASSISTANT_ID,
        sender_name: 'AI Assistant',
        content: response.message
      }])
      .select()
      .single();

    if (aiError) throw aiError;

    // Update ticket status based on AI resolution
    if (response.resolution) {
      const updates: any = {
        status: 'In Progress',
        resolution: response.resolution // Store resolution on the ticket where it belongs
      };

      if (response.resolution.status === 'potential_resolution' && response.resolution.confidence > 0.8) {
        updates.status = 'In Progress';
      } else if (response.resolution.status === 'escalate' && response.resolution.confidence > 0.8) {
        updates.needs_human_attention = true;
      }

      await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket.id);
    }

    return {
      success: true,
      ticket
    };
  } catch (error) {
    console.error('Error in createTicketAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 