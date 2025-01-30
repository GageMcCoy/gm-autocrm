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
async function testTicketPriority() {
    try {
        const title = "Feature Request";
        const description = "You should add a feature where if a page takes too long to load you can play Atari Breakout";
        console.log('Testing OpenAI connection with ticket:');
        console.log(`Title: ${title}`);
        console.log(`Description: ${description}\n`);
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are a customer support AI that analyzes support tickets to determine their priority level.
          Consider factors like:
          - Business impact
          - Number of affected users
          - System functionality
          - Data security/privacy concerns
          - Time sensitivity
          
          Return a JSON object with two fields:
          - priority: one of ["low", "medium", "high", "urgent"]
          - reason: brief explanation of the priority assignment`
                },
                {
                    role: 'user',
                    content: `Title: ${title}\n\nDescription: ${description}`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });
        const content = response.choices[0].message.content || '{"priority": "medium", "reason": "Default priority assigned"}';
        const result = JSON.parse(content);
        console.log('Analysis Result:');
        console.log(JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error('Error:', error);
    }
}
testTicketPriority();
