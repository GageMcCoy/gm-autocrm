'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import FormKnowledgeBase from './FormKnowledgeBase';

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

export default function TableKnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<KnowledgeBaseArticle | null>(null);
  const { supabase } = useSupabase();

  // Fetch articles on component mount
  useEffect(() => {
    fetchArticles();
  }, [supabase, statusFilter]);

  async function fetchArticles() {
    if (!supabase) return;

    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('knowledge_base_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setArticles(data || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!supabase || !articleToDelete) return;

    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('knowledge_base_articles')
        .delete()
        .eq('id', articleToDelete.id);

      if (deleteError) throw deleteError;

      setArticles(prev => prev.filter(article => article.id !== articleToDelete.id));
      setShowDeleteModal(false);
      setArticleToDelete(null);
    } catch (err) {
      console.error('Error deleting article:', err);
      setError('Failed to delete article. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedArticleId) {
    return (
      <FormKnowledgeBase
        articleId={selectedArticleId}
        onSuccess={() => {
          setSelectedArticleId(null);
          fetchArticles();
        }}
        onCancel={() => setSelectedArticleId(null)}
      />
    );
  }

  return (
    <div>
      <div className="border-b border-gray-700">
        <div className="px-4 py-3">
          <select 
            className="select select-sm h-9 min-h-0 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border-gray-600 hover:border-gray-500 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Articles</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4">
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
            <span>{error}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="bg-gray-700 text-white">Title</th>
                <th className="bg-gray-700 text-white">Status</th>
                <th className="bg-gray-700 text-white">Tags</th>
                <th className="bg-gray-700 text-white">Created</th>
                <th className="bg-gray-700 text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400">
                    No articles found
                  </td>
                </tr>
              ) : (
                articles.map(article => (
                  <tr key={article.id} className="hover:bg-gray-700/50">
                    <td className="text-white font-medium">{article.title}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        article.status === 'published' ? 'bg-green-500 text-white' :
                        article.status === 'draft' ? 'bg-yellow-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-gray-300">
                      {Array.isArray(article.tags) && article.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-block bg-gray-600 text-white text-xs px-2 py-1 rounded-full mr-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </td>
                    <td className="text-gray-300">
                      {new Date(article.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-ghost btn-sm text-blue-400 hover:text-blue-300"
                          onClick={() => setSelectedArticleId(article.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                          onClick={() => {
                            setArticleToDelete(article);
                            setShowDeleteModal(true);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Delete Article</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{articleToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="btn btn-ghost text-white"
                onClick={() => {
                  setShowDeleteModal(false);
                  setArticleToDelete(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 