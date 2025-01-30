'use client';

import ChatBox from '@/components/chat/ChatBox';

export default function ChatPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">AI Support Assistant</h1>
      <p className="text-gray-400 mb-4">
        Ask me anything! I'll help you using our knowledge base articles, or connect you with a live agent if needed.
      </p>
      <ChatBox />
    </div>
  );
} 