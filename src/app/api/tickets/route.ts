import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createTicket } from '@/services/tickets';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Parse request body
    const json = await request.json();
    if (!json.title?.trim() || !json.description?.trim()) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Create ticket
    const result = await createTicket(supabase, {
      title: json.title.trim(),
      description: json.description.trim(),
      submittedBy: user.id,
      customerId: user.id,
      customerEmail: user.email || ''
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
} 