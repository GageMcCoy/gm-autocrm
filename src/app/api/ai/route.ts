import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2,
});

// Models from environment variables
const COMPLETION_MODEL = process.env.OPENAI_MODEL || 'gpt-4';
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured on the server' },
      { status: 500 }
    );
  }

  try {
    const { operation, title, description, content, similarArticles, text, ticketTitle, ticketContent, tickets } = await request.json();

    switch (operation) {
      case 'analyzePriority': {
        const response = await openai.chat.completions.create({
          model: COMPLETION_MODEL,
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
        return NextResponse.json(JSON.parse(content));
      }

      case 'generateInitialResponse': {
        const articleContext = similarArticles?.length > 0
          ? `\n\nRelevant knowledge base articles:\n${similarArticles.map((a: any) => `- ${a.title}`).join('\n')}`
          : '';

        const response = await openai.chat.completions.create({
          model: COMPLETION_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a helpful customer support assistant. Provide brief, focused responses that:
              - Start with a friendly but concise greeting
              - Acknowledge the customer's issue clearly
              - Keep the response under 3-4 short paragraphs
              - Use simple formatting (just paragraphs, no fancy headers or signatures)
              - Focus on immediate next steps or solutions
              - Reference knowledge base articles if available
              - End with a simple reassurance
              
              Do not include:
              - Subject lines or email headers
              - Formal letter formatting
              - Lengthy signatures
              - Placeholder text like [Your Name] or [Insert Link]`
            },
            {
              role: 'user',
              content: `Ticket Title: ${title}\nDescription: ${description}${articleContext}`
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
        });

        return NextResponse.json({
          content: response.choices[0].message.content || ''
        });
      }

      case 'generateTags': {
        const response = await openai.chat.completions.create({
          model: COMPLETION_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates relevant tags for knowledge base articles. Generate 3-5 tags that best categorize the article content. Return only the tags as a comma-separated list, without any additional text or explanation.'
            },
            {
              role: 'user',
              content: `Title: ${title}\n\nContent: ${content}`
            }
          ],
          temperature: 0.3,
          max_tokens: 100,
        });

        const tags = (response.choices[0].message.content || '')
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        return NextResponse.json({ tags });
      }

      case 'analyzeArticleQuality': {
        const response = await openai.chat.completions.create({
          model: COMPLETION_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that analyzes the quality of knowledge base articles. Analyze the given article and provide specific suggestions for improvement in the following areas:\n1. Clarity and readability\n2. Completeness of information\n3. Technical accuracy\n4. Formatting and structure\n\nProvide your suggestions in a bullet-point list format.'
            },
            {
              role: 'user',
              content
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        return NextResponse.json({
          suggestions: response.choices[0].message.content || ''
        });
      }

      case 'generateEmbedding': {
        const response = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: text,
        });

        return NextResponse.json({
          embedding: response.data[0].embedding
        });
      }

      case 'generateArticleSuggestions': {
        const response = await openai.chat.completions.create({
          model: COMPLETION_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that suggests knowledge base articles to help resolve customer support tickets. Analyze the ticket and the available articles, then explain which articles are most relevant and why. Focus on how each suggested article can help resolve the customer\'s issue.'
            },
            {
              role: 'user',
              content: `Ticket Title: ${ticketTitle}\n\nTicket Content: ${ticketContent}\n\nAvailable Articles:\n${similarArticles
                .map((article: any, index: number) => `${index + 1}. ${article.title}\n${article.content}`)
                .join('\n\n')}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        return NextResponse.json({
          suggestions: response.choices[0].message.content || ''
        });
      }

      case 'analyzeTicketPatterns': {
        const response = await openai.chat.completions.create({
          model: COMPLETION_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a support ticket analyzer. For each ticket, extract the 2 most important phrases that represent the core issue or request.
                Rules:
                - Each phrase should be 1-3 words maximum
                - Focus on actionable items or specific issues (e.g., "password reset", "feature request", "login error")
                - Avoid generic words
                - Standardize similar phrases (e.g., "reset password" and "password reset" should be unified)
                - Return ONLY a JSON array of objects with:
                  - text: the key phrase identified
                  - value: number of times this phrase appears (minimum 1)
                
                Example format:
                [
                  {"text": "password reset", "value": 3},
                  {"text": "feature request", "value": 2}
                ]`
            },
            {
              role: 'user',
              content: `Analyze these tickets:\n${tickets.map((t: any) => 
                `Title: ${t.title}\nDescription: ${t.description}\n---\n`
              ).join('\n')}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        const patterns = JSON.parse(response.choices[0].message.content || '[]');
        
        // Sort by value (frequency) in descending order
        patterns.sort((a: any, b: any) => b.value - a.value);
        
        return NextResponse.json({ patterns });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in AI operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 