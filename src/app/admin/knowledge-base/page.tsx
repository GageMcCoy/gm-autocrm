'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import ButtonSync from '@/components/buttons/ButtonSync';
import TableKnowledgeBase from '@/components/knowledge-base/TableKnowledgeBase';
import CardKnowledgeBaseAI from '@/components/knowledge-base/CardKnowledgeBaseAI';

export default function KnowledgeBasePage() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/knowledge/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync knowledge base');
      }

      toast.success(`Successfully synced ${result.totalProcessed} articles to Pinecone`);

      if (result.errors?.length) {
        toast.warning(`Completed with ${result.errors.length} errors. Check console for details.`);
        console.warn('Sync errors:', result.errors);
      }
    } catch (error) {
      console.error('Error syncing knowledge base:', error);
      toast.error('Failed to sync knowledge base');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <div className="flex gap-2">
          <ButtonSync 
            onClick={handleSync}
            isLoading={isSyncing}
          />
          <button className="btn btn-primary gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Article
          </button>
        </div>
      </div>

      <div className="dropdown">
        <button className="btn btn-ghost">
          All Articles
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <CardKnowledgeBaseAI />
      
      <div className="divider"></div>
      
      <TableKnowledgeBase />
    </div>
  );
} 