'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function CardKnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const { supabase } = useSupabase();

  useEffect(() => {
    fetchArticles();
  }, [supabase, searchQuery, selectedTags]);

  async function fetchArticles() {
    if (!supabase) return;

    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('knowledge_base_articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      if (selectedTags.length > 0) {
        // For array columns, we need to use the contains operator
        query = query.contains('tags', selectedTags);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setArticles(data || []);

      // Extract and deduplicate all tags
      const tags = (data || []).reduce<string[]>((acc, article) => {
        return [...acc, ...(Array.isArray(article.tags) ? article.tags : [])];
      }, []);
      
      const uniqueTags = Array.from(new Set(tags));
      setAllTags(uniqueTags);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <button
          className="btn btn-ghost gap-2 text-gray-400 hover:text-white"
          onClick={() => setSelectedArticle(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Articles
        </button>

        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-white mb-4">{selectedArticle.title}</h1>
          <div className="flex gap-2 mb-6">
            {Array.isArray(selectedArticle.tags) && selectedArticle.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="text-gray-300 whitespace-pre-wrap">
            {selectedArticle.content}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              className="input input-bordered bg-gray-700 text-white border-gray-600 w-full pl-10"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {allTags.map((tag, index) => (
          <button
            key={index}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-primary text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            No articles found
          </div>
        ) : (
          articles.map(article => (
            <div
              key={article.id}
              className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <h3 className="text-xl font-semibold text-white mb-4">{article.title}</h3>
              <p className="text-gray-300 mb-4 line-clamp-3">
                {article.content}
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(article.tags) && article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 