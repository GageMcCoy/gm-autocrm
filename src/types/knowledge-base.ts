export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  suggestion_count: number;
  click_through_count: number;
  resolution_count: number;
  helpful_votes: number;
  unhelpful_votes: number;
}

export interface ArticleSuggestion {
  article: KnowledgeBaseArticle;
  similarity: number;
}

export interface ArticleMetrics {
  totalViews: number;
  totalSuggestions: number;
  clickThroughRate: number;
  resolutionRate: number;
  helpfulnessScore: number;
}

export interface ArticleQualityAnalysis {
  clarity: number;
  completeness: number;
  technicalAccuracy: number;
  formatting: number;
  suggestions: string[];
} 