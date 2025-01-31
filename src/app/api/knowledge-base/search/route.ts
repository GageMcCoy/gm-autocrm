import { NextResponse } from 'next/server';
import { findSimilarArticlesAction } from '@/app/actions/knowledge-base';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, limit = 3 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const result = await findSimilarArticlesAction(query, limit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to search articles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      articles: result.articles
    });
  } catch (error) {
    console.error('Error in knowledge base search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 