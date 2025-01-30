"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const openai_1 = require("@langchain/openai");
const langsmith_1 = require("langsmith");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const runnables_1 = require("@langchain/core/runnables");
// Load environment variables
(0, dotenv_1.config)();
async function main() {
    // Initialize LangSmith client
    const client = new langsmith_1.Client();
    // Initialize ChatOpenAI model
    const model = new openai_1.ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || 'gpt-4',
        temperature: 0.3,
    });
    // Create a simple test chain
    const prompt = prompts_1.PromptTemplate.fromTemplate(`
    Generate a one-sentence summary of this text: {text}
  `);
    const chain = runnables_1.RunnableSequence.from([
        prompt,
        model,
        new output_parsers_1.StringOutputParser(),
    ]);
    try {
        console.log('Testing LangSmith connection...');
        const result = await chain.invoke({ text: 'This is a test of the LangSmith monitoring system.' }, {
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
        });
        console.log('\nTest completed successfully!');
        console.log('Result:', result);
        console.log('\nCheck your LangSmith dashboard at https://smith.langchain.com to see the traced run.');
    }
    catch (error) {
        console.error('Error testing LangSmith connection:', error);
    }
}
main();
