import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testRoleQuery() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test user ID from your console log
  const userId = 'b819988e-abfa-406f-9ce5-9c34674a3824';

  console.log('Testing database connection...');
  
  try {
    // First, let's test if we can query the users table at all
    console.log('Attempting to query users table...');
    const { data: tableTest, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('Table test result:', { data: tableTest, error: tableError });

    // Now try the specific role query
    console.log('\nAttempting to fetch role for user:', userId);
    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    console.log('Role query result:', { data: roleData, error: roleError });

  } catch (err) {
    console.error('Error in test:', err);
  }
}

testRoleQuery(); 