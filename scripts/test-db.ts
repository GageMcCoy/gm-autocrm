import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data: tableInfo, error: tableError } = await supabase
      .from('tickets')
      .select('count');
      
    console.log('Table count:', tableInfo);
    
    if (tableError) {
      console.error('Error getting count:', tableError);
      return;
    }
    
    // Try to fetch actual data
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(1);
      
    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      return;
    }
    
    console.log('First ticket:', tickets[0]);
    console.log('Total tickets found:', tickets.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testConnection(); 