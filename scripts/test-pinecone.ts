import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

async function testPineconeConnection() {
  console.log('=== Pinecone Connection Test ===\n');
  
  // Check environment variables
  console.log('1. Checking environment variables:');
  console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✓ Found' : '✗ Missing');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Found' : '✗ Missing');
  console.log('OPENAI_EMBEDDING_MODEL:', process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small (default)');

  try {
    // Initialize Pinecone client
    console.log('\n2. Initializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });

    // List indexes
    console.log('\n3. Listing available indexes...');
    const indexes = await pinecone.listIndexes();
    console.log('Available indexes:', indexes);

    // Try to connect to our specific index
    console.log('\n4. Connecting to gm-autocrm index...');
    const index = pinecone.Index('gm-autocrm');
    
    // Get index stats
    console.log('\n5. Fetching index statistics...');
    const stats = await index.describeIndexStats();
    console.log('Index statistics:', JSON.stringify(stats, null, 2));

    // Test basic operations
    console.log('\n6. Testing basic operations...');
    const testVector = {
      id: 'test-vector',
      values: new Array(1536).fill(0.1),
      metadata: { test: true }
    };

    console.log('\nInserting test vector...');
    await index.upsert([testVector]);

    console.log('Querying test vector...');
    const queryResponse = await index.query({
      topK: 1,
      vector: new Array(1536).fill(0.1),
      includeMetadata: true
    });
    console.log('Query response:', queryResponse);

    console.log('\nDeleting test vector...');
    await index.deleteOne('test-vector');
    
    console.log('\n✓ All Pinecone operations completed successfully!');
  } catch (error) {
    console.error('\n✗ Error during Pinecone operations:');
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

testPineconeConnection(); 