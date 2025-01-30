import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Client } from 'langsmith';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testLangChainSetup() {
  console.log('Testing LangChain Setup...');
  console.log('\nEnvironment Variables:');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Present' : '✗ Missing');
  console.log('LANGCHAIN_API_KEY:', process.env.LANGCHAIN_API_KEY ? '✓ Present' : '✗ Missing');
  console.log('LANGCHAIN_PROJECT:', process.env.LANGCHAIN_PROJECT || '✗ Missing');
  console.log('LANGCHAIN_ENDPOINT:', process.env.LANGCHAIN_ENDPOINT || '✗ Missing');
  
  try {
    // Initialize LangSmith client
    console.log('\nInitializing LangSmith client...');
    const client = new Client({
      apiUrl: process.env.LANGCHAIN_ENDPOINT,
      apiKey: process.env.LANGCHAIN_API_KEY,
    });

    // Initialize ChatOpenAI model
    console.log('\nInitializing ChatOpenAI model...');
    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.3,
      maxRetries: 2,
      timeout: 30000,
    });

    // Create a simple test prompt
    console.log('\nCreating test prompt and chain...');
    const testPrompt = PromptTemplate.fromTemplate(`
      You are a test assistant. Please respond with:
      "LangChain test successful! Project: {project}"
    `);

    const chain = RunnableSequence.from([
      testPrompt,
      model,
      new StringOutputParser(),
    ]);

    // Run the chain with LangSmith tracing
    console.log('\nRunning test chain with LangSmith tracing...');
    const result = await chain.invoke(
      {
        project: process.env.LANGCHAIN_PROJECT
      },
      {
        callbacks: [{
          handleLLMEnd: async (output) => {
            await client.createRun({
              name: "langchain_test",
              run_type: "chain",
              inputs: { project: process.env.LANGCHAIN_PROJECT },
              outputs: output,
            });
          },
        }],
      }
    );

    console.log('\nResponse:', result);
    console.log('\n✓ Test completed successfully');
    console.log('Check LangSmith dashboard for the test run!');
  } catch (error) {
    console.error('\n✗ Error during test:', error);
    console.error('Full error:', error);
  }
}

testLangChainSetup(); 