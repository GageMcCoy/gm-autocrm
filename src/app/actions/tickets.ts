'use server';

import { createClient } from '@/lib/supabase/server';
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