'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  usedArticles?: { title: string; similarity: number }[];
  needsLiveAgent?: boolean;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const result = await response.json();

      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.response,
        usedArticles: result.usedArticles,
        needsLiveAgent: result.needsLiveAgent
      }]);

      if (result.needsLiveAgent) {
        toast.info('Connecting you to a live agent...');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response');
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, but I'm having trouble responding right now. Please try again later.",
        needsLiveAgent: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-800 rounded-lg overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              message.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <div className="prose prose-invert max-w-none">
                {message.content}
              </div>
              
              {message.usedArticles && message.usedArticles.length > 0 && (
                <div className="mt-2 text-sm text-gray-400">
                  <p className="font-semibold">Referenced Articles:</p>
                  <ul className="list-disc list-inside">
                    {message.usedArticles.map((article, idx) => (
                      <li key={idx}>{article.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="loading loading-dots loading-sm"></span>
            <span>AI is typing...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 input input-bordered bg-gray-700 text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 