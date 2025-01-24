'use server';

import { createClient } from '@/lib/supabase/server';
import { sendTicketResolvedEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

export async function resolveTicket({
  ticketId,
  resolutionNotes,
}: {
  ticketId: string;
  resolutionNotes: string;
}) {
  try {
    const supabase = await createClient();

    // First, get the ticket and customer details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        customers (
          id,
          name,
          email
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error(ticketError?.message || 'Ticket not found');
    }

    // Update the ticket status to resolved
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'RESOLVED',
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Send email notification
    await sendTicketResolvedEmail({
      to: ticket.customers.email,
      customerName: ticket.customers.name,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      resolutionNotes,
    });

    // Revalidate the tickets page to show updated status
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${ticketId}`);

    return { success: true };
  } catch (error) {
    console.error('Error resolving ticket:', error);
    return { success: false, error: (error as Error).message };
  }
} 