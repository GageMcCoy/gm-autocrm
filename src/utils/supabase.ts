import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom enum types to match the database
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  submitted_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
} 