import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../src/utils/openai';

async function initializeEmbeddings() {
  console.log('=== Starting Embeddings Initialization ===');

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all articles without embeddings
    console.log('Fetching articles without embeddings...');
    const { data: articles, error: fetchError } = await supabase
      .from('knowledge_base_articles')
      .select('id, title, content')
      .is('content_embedding', null);

    if (fetchError) throw fetchError;

    if (!articles || articles.length === 0) {
      console.log('No articles found needing embeddings.');
      return;
    }

    console.log(`Found ${articles.length} articles needing embeddings.`);

    // Process articles in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${i / batchSize + 1}...`);

      await Promise.all(
        batch.map(async (article: { id: string; title: string; content: string }) => {
          try {
            console.log(`Generating embedding for article: ${article.title}`);
            
            // Generate embedding from title and content
            const embedding = await generateEmbedding(
              `${article.title}\n\n${article.content}`
            );

            // Update article with embedding
            const { error: updateError } = await supabase
              .from('knowledge_base_articles')
              .update({
                content_embedding: embedding,
                last_embedding_update: new Date().toISOString()
              })
              .eq('id', article.id);

            if (updateError) {
              console.error(`Error updating article ${article.id}:`, updateError);
              return;
            }

            console.log(`✓ Updated embedding for: ${article.title}`);
          } catch (error) {
            console.error(`Error processing article ${article.id}:`, error);
          }
        })
      );

      // Add a small delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n=== Embeddings Initialization Complete ===');
  } catch (error) {
    console.error('Error initializing embeddings:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeEmbeddings(); 