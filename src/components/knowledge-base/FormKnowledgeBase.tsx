'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

interface FormKnowledgeBaseProps {
  articleId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

export default function FormKnowledgeBase({ articleId, onSuccess, onCancel }: FormKnowledgeBaseProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    tags: [],
    status: 'draft'
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { supabase, user } = useSupabase();

  useEffect(() => {
    async function fetchArticle() {
      if (!supabase || !articleId) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('knowledge_base_articles')
          .select('*')
          .eq('id', articleId)
          .single();

        if (fetchError) throw fetchError;
        if (data) {
          setFormData({
            title: data.title,
            content: data.content,
            tags: Array.isArray(data.tags) ? data.tags : [],
            status: data.status
          });
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    if (articleId) {
      fetchArticle();
    }
  }, [supabase, articleId]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const articleData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (articleId) {
        // Update existing article
        const { error: updateError } = await supabase
          .from('knowledge_base_articles')
          .update(articleData)
          .eq('id', articleId);

        if (updateError) throw updateError;
      } else {
        // Create new article
        const { error: insertError } = await supabase
          .from('knowledge_base_articles')
          .insert([{
            ...articleData,
            created_by: user.id,
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving article:', err);
      setError('Failed to save article. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          <span>{error}</span>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text text-white font-medium">Title</span>
        </label>
        <input
          type="text"
          className="input input-bordered bg-gray-700 text-white border-gray-600"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-white font-medium">Content</span>
        </label>
        <textarea
          className="textarea textarea-bordered bg-gray-700 text-white border-gray-600 h-48"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-white font-medium">Tags</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered bg-gray-700 text-white border-gray-600 flex-1"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Type a tag and press Enter"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
          >
            Add Tag
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-600 text-white px-2 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                className="hover:text-red-300"
                onClick={() => handleRemoveTag(tag)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-white font-medium">Status</span>
        </label>
        <select
          className="select select-bordered bg-gray-700 text-white border-gray-600"
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as FormData['status'] }))}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="btn btn-ghost text-white"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : articleId ? 'Update Article' : 'Create Article'}
        </button>
      </div>
    </form>
  );
} 