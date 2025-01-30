"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config({ path: '.env.local' });
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
async function analyzePriority(title, description) {
    try {
        console.log('Analyzing ticket:');
        console.log(`Title: ${title}`);
        console.log(`Description: ${description}\n`);
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are a support ticket priority analyzer. Based on the ticket's title and description, determine its priority level.
          Consider factors like:
          - Business impact
          - User experience impact
          - Number of affected users
          - Time sensitivity
          
          Return ONLY a JSON object with:
          - priority: one of ["Low", "Medium", "High"]
          - reason: brief explanation of why this priority was chosen`
                },
                {
                    role: 'user',
                    content: `Title: ${title}\n\nDescription: ${description}`
                }
            ],
            temperature: 0.3,
        });
        const content = response.choices[0].message.content || '{"priority": "Medium", "reason": "Default priority - parsing error"}';
        const result = JSON.parse(content);
        console.log('\nAnalysis Result:');
        console.log(JSON.stringify(result, null, 2));
        return result;
    }
    catch (error) {
        console.error('Error:', error);
        return { priority: 'Medium', reason: 'Default priority due to analysis error' };
    }
}
// Test cases
const testCases = [
    {
        title: 'Cannot log in to my account',
        description: 'I keep getting an error message when trying to log in. This is urgent as I need to access my work files.'
    },
    {
        title: 'Feature request: dark mode',
        description: 'It would be nice to have a dark mode option for better visibility at night.'
    },
    {
        title: 'System crash during payment',
        description: 'The system crashed while processing my payment and I\'m not sure if it went through. My clients are waiting.'
    }
];
// Run tests
async function runTests() {
    for (const testCase of testCases) {
        console.log('\n=== Testing New Case ===');
        await analyzePriority(testCase.title, testCase.description);
    }
}
runTests();
