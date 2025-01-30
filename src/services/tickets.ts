import { SupabaseClient } from '@supabase/supabase-js';
import { analyzePriority } from '@/app/actions/ai';
import { createMessage, createAIResponse } from '@/services/messages';

interface CreateTicketParams {
  title: string;
  description: string;
  submittedBy: string;
  customerId: string;
  customerEmail: string;
}

export async function createTicket(
  supabase: SupabaseClient,
  params: CreateTicketParams
) {
  try {
    // Get priority analysis from server action
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
    await createMessage(supabase, {
      ticketId: ticket.id,
      senderId: params.submittedBy,
      content: params.description
    });

    // Generate and create AI response asynchronously
    // We don't await this since we'll handle the response in the UI
    createAIResponse(
      supabase,
      ticket.id,
      params.title,
      params.description
    ).catch(error => {
      console.error('Error generating AI response:', error);
    });

    return ticket;
  } catch (error) {
    console.error('Error in createTicket:', error);
    throw error;
  }
} 