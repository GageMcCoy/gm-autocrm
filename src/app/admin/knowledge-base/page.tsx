import TableKnowledgeBase from '@/components/knowledge-base/TableKnowledgeBase';
import CardKnowledgeBaseAI from '@/components/knowledge-base/CardKnowledgeBaseAI';

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Knowledge Base Management</h1>
      </div>

      <CardKnowledgeBaseAI />
      
      <div className="divider"></div>
      
      <TableKnowledgeBase />
    </div>
  );
} 