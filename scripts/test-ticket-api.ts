import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { analyzePriority, generateInitialResponse } from '../src/utils/openai';
import { findSimilarArticles } from '../src/services/knowledge-base';

// Verify environment variables
function checkEnvVariables() {
  const required = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function testTicketCreation() {
  console.log('=== Starting Ticket Creation Test ===');

  try {
    // Check environment variables first
    checkEnvVariables();
    console.log('Environment variables verified ✓');

    // Test data
    const testData = {
      title: 'Test Ticket from Node',
      description: 'This is a test ticket to verify the AI integration is working properly.'
    };

    console.log('\nTest Data:', testData);

    // Step 1: Test Priority Analysis
    console.log('\n1. Testing Priority Analysis...');
    try {
      const priority = await analyzePriority(testData.title, testData.description);
      console.log('Priority Analysis Result:', priority);
    } catch (error) {
      console.error('Priority Analysis Failed:', error);
      throw error; // Rethrow to stop the test
    }

    // Step 2: Test Similar Articles
    console.log('\n2. Testing Similar Articles Search...');
    try {
      const articles = await findSimilarArticles(
        `${testData.title}\n${testData.description}`,
        3
      );
      console.log('Similar Articles Found:', articles.length);
    } catch (error) {
      console.error('Similar Articles Search Failed:', error);
      // Don't throw here as it's not critical
    }

    // Step 3: Test Response Generation
    console.log('\n3. Testing Response Generation...');
    try {
      const response = await generateInitialResponse(
        testData.title,
        testData.description,
        [] // Empty array for testing
      );
      console.log('Generated Response:', response);
    } catch (error) {
      console.error('Response Generation Failed:', error);
      throw error; // Rethrow to stop the test
    }

  } catch (error) {
    console.error('\nTest Failed:', error);
    process.exit(1);
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testTicketCreation(); 