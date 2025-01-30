'use server';

import { searchSimilarArticles } from '@/utils/vector-store';

export async function findSimilarArticlesAction(
  text: string,
  limit: number = 3
): Promise<{
  success: boolean;
  articles?: any[];
  message?: string;
}> {
  try {
    const articles = await searchSimilarArticles(text, limit);
    return {
      success: true,
      articles
    };
  } catch (error) {
    console.error('Error finding similar articles:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 