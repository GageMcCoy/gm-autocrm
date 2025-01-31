import { SupabaseClient } from '@supabase/supabase-js';
import { createTicketAction } from '@/app/actions/tickets';

interface CreateTicketParams {
  title: string;
  description: string;
  submittedBy: string;
}

export async function createTicket(
  supabase: SupabaseClient,
  params: CreateTicketParams
) {
  const result = await createTicketAction(params);
  
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.ticket;
} 