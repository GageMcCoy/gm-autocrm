import { KnowledgeBaseArticle, ArticleSuggestion, ArticleMetrics, ArticleQualityAnalysis } from '@/types/knowledge-base';
import { generateArticleSuggestions, generateTags, analyzeArticleQuality } from '@/utils/openai';
import { syncKnowledgeBase } from '@/utils/vector-store';
import { findSimilarArticlesAction } from '@/app/actions/knowledge-base';

export async function updateArticleEmbedding(
  articleId: string
): Promise<void> {
  try {
    // Fetch the article
    const article = await findSimilarArticlesAction(articleId, 1);

    if (!article.success || !article.articles) {
      throw new Error('Article not found');
    }

    // Sync the article to Pinecone
    const result = await syncKnowledgeBase([{
      id: article.articles[0].id,
      title: article.articles[0].title,
      content: article.articles[0].content,
      category: article.articles[0].tags?.[0] || 'general',
      tags: article.articles[0].tags || [],
      created_at: article.articles[0].created_at,
      updated_at: article.articles[0].updated_at
    }]);

    if (!result.success) {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error updating article in vector store:', error);
    throw error;
  }
}

export async function updateAllEmbeddings(
): Promise<void> {
  try {
    // Fetch all articles
    const articles = await findSimilarArticlesAction('', 100);

    if (!articles.success || !articles.articles) {
      return;
    }

    // Sync all articles to Pinecone
    const result = await syncKnowledgeBase(articles.articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.tags?.[0] || 'general',
      tags: article.tags || [],
      created_at: article.created_at,
      updated_at: article.updated_at
    })));

    if (!result.success) {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error syncing articles to vector store:', error);
    throw error;
  }
}

export async function findSimilarArticles(
  text: string,
  limit: number = 3
): Promise<ArticleSuggestion[]> {
  try {
    const result = await findSimilarArticlesAction(text, limit);
    
    if (!result.success || !result.articles) {
      return [];
    }
    
    return result.articles.map(article => ({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        tags: article.tags,
        status: 'published',
        created_by: 'system',
        created_at: article.created_at,
        updated_at: article.updated_at,
        view_count: 0,
        suggestion_count: 0,
        click_through_count: 0,
        resolution_count: 0,
        helpful_votes: 0,
        unhelpful_votes: 0
      },
      similarity: 1 // Pinecone already filters by threshold
    }));
  } catch (error) {
    console.error('Error finding similar articles:', error);
    throw error;
  }
}

export async function incrementMetric(
  articleId: string,
  metric: 'view' | 'suggestion' | 'click_through' | 'resolution' | 'helpful' | 'unhelpful'
): Promise<void> {
  try {
    // This function is no longer used in the new implementation
  } catch (error) {
    console.error('Error incrementing metric:', error);
    throw error;
  }
}

export async function getArticleMetrics(
  articleId: string
): Promise<ArticleMetrics> {
  try {
    // This function is no longer used in the new implementation
    throw new Error('Article metrics are no longer available');
  } catch (error) {
    console.error('Error getting article metrics:', error);
    throw error;
  }
}

export async function suggestArticleImprovements(
  title: string,
  content: string
): Promise<ArticleQualityAnalysis> {
  try {
    const analysis = await analyzeArticleQuality(content);
    const suggestions = analysis.split('\n').filter(line => line.trim().length > 0);

    return {
      clarity: 0.8, // These would be calculated based on the AI analysis
      completeness: 0.7,
      technicalAccuracy: 0.9,
      formatting: 0.8,
      suggestions
    };
  } catch (error) {
    console.error('Error analyzing article quality:', error);
    throw error;
  }
}

export async function suggestTags(
  title: string,
  content: string
): Promise<string[]> {
  try {
    return await generateTags(title, content);
  } catch (error) {
    console.error('Error generating tags:', error);
    throw error;
  }
} 