import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncKnowledgeBase } from '@/utils/vector-store';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST() {
  try {
    // Fetch all knowledge base articles
    const { data: articles, error } = await supabase
      .from('knowledge_base_articles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!articles?.length) {
      return NextResponse.json({
        success: true,
        message: 'No articles found to process',
        totalProcessed: 0
      });
    }

    // Sync articles to Pinecone
    const result = await syncKnowledgeBase(articles);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message, details: result.errors },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 