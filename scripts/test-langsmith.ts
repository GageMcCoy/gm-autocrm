import { config } from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { Client } from 'langsmith';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Load environment variables
config();

async function main() {
  // Initialize LangSmith client
  const client = new Client();

  // Initialize ChatOpenAI model
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.3,
  });

  // Create a simple test chain
  const prompt = PromptTemplate.fromTemplate(`
    Generate a one-sentence summary of this text: {text}
  `);

  const chain = RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser(),
  ]);

  try {
    console.log('Testing LangSmith connection...');
    
    const result = await chain.invoke(
      { text: 'This is a test of the LangSmith monitoring system.' },
      {
        callbacks: [{
          handleLLMEnd: async (output) => {
            await client.createRun({
              name: "test_connection",
              run_type: "chain",
              inputs: { text: 'This is a test of the LangSmith monitoring system.' },
              outputs: output,
              project_name: process.env.LANGCHAIN_PROJECT,
            });
          },
        }],
      }
    );

    console.log('\nTest completed successfully!');
    console.log('Result:', result);
    console.log('\nCheck your LangSmith dashboard at https://smith.langchain.com to see the traced run.');
    
  } catch (error) {
    console.error('Error testing LangSmith connection:', error);
  }
}

main(); 