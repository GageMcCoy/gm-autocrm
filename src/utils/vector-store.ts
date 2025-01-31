'use server';

import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
});

// Types
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Initialize Pinecone client
function getPineconeClient() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY is not configured');
  }
  
  return new Pinecone({
    apiKey,
  });
}

// Get or create index
async function getOrCreateIndex() {
  const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'gm-autocrm';
  return getPineconeClient().Index(INDEX_NAME);
}

export async function syncKnowledgeBase(articles: KnowledgeArticle[]): Promise<{ 
  success: boolean; 
  message: string; 
  totalProcessed?: number;
  errors?: string[];
}> {
  try {
    const index = await getOrCreateIndex();
    const errors: string[] = [];
    let processedCount = 0;

    // Get all existing vector IDs from Pinecone
    const stats = await index.describeIndexStats();
    const totalVectors = stats.totalRecordCount || 0;
    
    // Get all current article IDs
    const currentArticleIds = articles.map(article => article.id);
    
    // If there are vectors in the index, delete any that aren't in the current articles
    if (totalVectors > 0) {
      await index.deleteAll();
      console.log('Cleared existing vectors for clean sync');
    }

    // Process articles in batches to avoid rate limits
    const batchSize = 5;

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      try {
        // Generate embeddings for the batch using OpenAI directly
        const embeddingsResponse = await embeddings.embedDocuments(
          batch.map(article => `${article.title}\n\n${article.content}`)
        );

        // Prepare vectors for upsert
        const vectors = batch.map((article, idx) => ({
          id: article.id,
          values: embeddingsResponse[idx],
          metadata: {
            title: article.title,
            content: article.content,
            category: article.category,
            tags: article.tags,
            created_at: article.created_at,
            updated_at: article.updated_at,
          },
        }));

        // Upsert vectors to Pinecone
        await index.upsert(vectors);

        processedCount += batch.length;
      } catch (err) {
        const error = err as Error;
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      }

      // Add a small delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: true,
      message: `Successfully synced ${processedCount} articles to vector store${totalVectors > 0 ? ' (after clearing existing vectors)' : ''}`,
      totalProcessed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    const error = err as Error;
    console.error('Error syncing knowledge base:', error);
    return {
      success: false,
      message: `Failed to sync knowledge base: ${error.message}`,
      errors: [error.message],
    };
  }
}

export async function searchSimilarArticles(query: string, limit: number = 5): Promise<KnowledgeArticle[]> {
  try {
    // Generate embedding using OpenAI directly
    const embedding = await embeddings.embedQuery(query);
    
    // Query Pinecone
    const index = await getOrCreateIndex();
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true
    });
    
    return queryResponse.matches
      .filter(match => match.metadata) // Filter out matches without metadata
      .map(match => ({
        id: match.id,
        title: String(match.metadata?.title || ''),
        content: String(match.metadata?.content || ''),
        category: String(match.metadata?.category || ''),
        tags: Array.isArray(match.metadata?.tags) ? match.metadata.tags : [],
        created_at: String(match.metadata?.created_at || ''),
        updated_at: String(match.metadata?.updated_at || '')
      }));
  } catch (err) {
    const error = err as Error;
    console.error('Error searching similar articles:', error);
    return [];
  }
} 