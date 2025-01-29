import { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeBaseArticle, ArticleSuggestion, ArticleMetrics, ArticleQualityAnalysis } from '@/types/knowledge-base';
import { generateEmbedding, generateArticleSuggestions, generateTags, analyzeArticleQuality } from '@/utils/openai';

export async function updateArticleEmbedding(
  supabase: SupabaseClient,
  articleId: string
): Promise<void> {
  try {
    // Fetch the article
    const { data: article, error: fetchError } = await supabase
      .from('knowledge_base_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (fetchError) throw fetchError;
    if (!article) throw new Error('Article not found');

    // Generate embedding from title and content
    const embedding = await generateEmbedding(`${article.title}\n\n${article.content}`);

    // Update the article with the new embedding
    const { error: updateError } = await supabase
      .from('knowledge_base_articles')
      .update({
        content_embedding: embedding,
        last_embedding_update: new Date().toISOString()
      })
      .eq('id', articleId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating article embedding:', error);
    throw error;
  }
}

export async function updateAllEmbeddings(
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Fetch all articles
    const { data: articles, error: fetchError } = await supabase
      .from('knowledge_base_articles')
      .select('*');

    if (fetchError) throw fetchError;
    if (!articles) return;

    // Update embeddings for each article
    for (const article of articles) {
      await updateArticleEmbedding(supabase, article.id);
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error('Error updating all embeddings:', error);
    throw error;
  }
}

export async function findSimilarArticles(
  supabase: SupabaseClient,
  text: string,
  limit: number = 3,
  threshold: number = 0.7
): Promise<ArticleSuggestion[]> {
  try {
    const embedding = await generateEmbedding(text);

    const { data, error } = await supabase.rpc('match_articles', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error finding similar articles:', error);
    throw error;
  }
}

export async function incrementMetric(
  supabase: SupabaseClient,
  articleId: string,
  metric: 'view' | 'suggestion' | 'click_through' | 'resolution' | 'helpful' | 'unhelpful'
): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_article_metric', {
      article_id: articleId,
      metric: metric
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error incrementing metric:', error);
    throw error;
  }
}

export async function getArticleMetrics(
  supabase: SupabaseClient,
  articleId: string
): Promise<ArticleMetrics> {
  try {
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('view_count, suggestion_count, click_through_count, resolution_count, helpful_votes, unhelpful_votes')
      .eq('id', articleId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Article not found');

    const clickThroughRate = data.suggestion_count > 0 
      ? (data.click_through_count / data.suggestion_count) * 100 
      : 0;

    const resolutionRate = data.click_through_count > 0 
      ? (data.resolution_count / data.click_through_count) * 100 
      : 0;

    const helpfulnessScore = (data.helpful_votes + data.unhelpful_votes) > 0
      ? (data.helpful_votes / (data.helpful_votes + data.unhelpful_votes)) * 100
      : 0;

    return {
      totalViews: data.view_count,
      totalSuggestions: data.suggestion_count,
      clickThroughRate,
      resolutionRate,
      helpfulnessScore
    };
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