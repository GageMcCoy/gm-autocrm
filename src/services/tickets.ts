import { SupabaseClient } from '@supabase/supabase-js';
import { analyzePriority, generateAIResponse } from '@/app/actions/ai';
import { createMessage, AI_ASSISTANT_ID } from '@/services/messages';
import { findSimilarArticles } from '@/services/knowledge-base';

interface CreateTicketParams {
  title: string;
  description: string;
  submittedBy: string;
}

interface KnowledgeArticle {
  article: {
    title: string;
    content: string;
  };
}

export async function createTicket(
  supabase: SupabaseClient,
  params: CreateTicketParams
) {
  try {
    // Get priority analysis from server action
    const priorityAnalysis = await analyzePriority(params.title, params.description);

    // Create the ticket with only the fields that exist in our schema
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        {
          title: params.title,
          description: params.description,
          status: 'Open',
          priority: priorityAnalysis.priority,
          submitted_by: params.submittedBy
        }
      ])
      .select()
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error('No ticket returned after creation');

    // Create initial customer message
    await createMessage(supabase, {
      ticketId: ticket.id,
      senderId: params.submittedBy,
      content: params.description
    });

    // Find similar articles from knowledge base
    const similarArticles = await findSimilarArticles(params.description);
    console.log('Found similar articles:', similarArticles.length);

    // Transform articles to only include relevant fields
    const relevantArticles = similarArticles.map((suggestion: KnowledgeArticle) => ({
      title: suggestion.article.title,
      content: suggestion.article.content
    }));

    // Generate AI response using server action
    const response = await generateAIResponse(
      params.title,
      params.description,
      JSON.stringify(relevantArticles)
    );

    // Create AI response message
    await createMessage(supabase, {
      ticketId: ticket.id,
      senderId: AI_ASSISTANT_ID,
      senderName: 'AI Assistant',
      content: response.message,
      resolution: response.resolution
    });

    // Update ticket status based on AI resolution
    if (response.resolution) {
      if (response.resolution.status === 'potential_resolution' && response.resolution.confidence > 0.8) {
        await supabase
          .from('tickets')
          .update({ 
            status: 'In Progress',
            last_ai_confidence: response.resolution.confidence,
            last_ai_reason: response.resolution.reason
          })
          .eq('id', ticket.id);
      } else if (response.resolution.status === 'escalate' && response.resolution.confidence > 0.8) {
        await supabase
          .from('tickets')
          .update({ 
            status: 'In Progress',
            needs_human_attention: true,
            last_ai_confidence: response.resolution.confidence,
            last_ai_reason: response.resolution.reason
          })
          .eq('id', ticket.id);
      }
    }

    return ticket;
  } catch (error) {
    console.error('Error in createTicket:', error);
    throw error;
  }
} 