"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const runnables_1 = require("@langchain/core/runnables");
const langsmith_1 = require("langsmith");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
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
        const client = new langsmith_1.Client({
            apiUrl: process.env.LANGCHAIN_ENDPOINT,
            apiKey: process.env.LANGCHAIN_API_KEY,
        });
        // Initialize ChatOpenAI model
        console.log('\nInitializing ChatOpenAI model...');
        const model = new openai_1.ChatOpenAI({
            modelName: process.env.OPENAI_MODEL || 'gpt-4',
            temperature: 0.3,
            maxRetries: 2,
            timeout: 30000,
        });
        // Create a simple test prompt
        console.log('\nCreating test prompt and chain...');
        const testPrompt = prompts_1.PromptTemplate.fromTemplate(`
      You are a test assistant. Please respond with:
      "LangChain test successful! Project: {project}"
    `);
        const chain = runnables_1.RunnableSequence.from([
            testPrompt,
            model,
            new output_parsers_1.StringOutputParser(),
        ]);
        // Run the chain with LangSmith tracing
        console.log('\nRunning test chain with LangSmith tracing...');
        const result = await chain.invoke({
            project: process.env.LANGCHAIN_PROJECT
        }, {
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
        });
        console.log('\nResponse:', result);
        console.log('\n✓ Test completed successfully');
        console.log('Check LangSmith dashboard for the test run!');
    }
    catch (error) {
        console.error('\n✗ Error during test:', error);
        console.error('Full error:', error);
    }
}
testLangChainSetup();
