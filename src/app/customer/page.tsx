'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Ticket } from '@/utils/supabase';
import { useSupabase } from '@/hooks/useSupabase';

// Add Message interface
interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export default function CustomerView() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { supabase, user } = useSupabase();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  useEffect(() => {
    async function loadUserTickets() {
      if (!supabase || !user) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('tickets')
          .select('*')
          .eq('submitted_by', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setUserTickets(data || []);
      } catch (err) {
        console.error('Error loading tickets:', err);
        setError('Failed to load tickets');
      }
    }

    if (supabase && user) {
      loadUserTickets();
    }
  }, [supabase, user]);

  // Update handleSubmit to remove hardcoded ID
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !supabase || !user) return;

    try {
      setIsSubmitting(true);
      
      const newTicket = {
        title: title.trim(),
        description: description.trim(),
        status: 'Open',
        priority: 'Medium',
        submitted_by: user.id,
        assigned_to: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('tickets')
        .insert([newTicket])
        .select();

      if (insertError) throw insertError;

      // Clear form
      setTitle('');
      setDescription('');

      // Update the tickets list with the new ticket
      if (data) {
        setUserTickets(prev => [...prev, data[0]]);
      }
      
    } catch (err) {
      console.error('Error submitting ticket:', err);
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Update message handling to remove hardcoded ID
  const loadMessages = useCallback(async (ticketId: string) => {
    if (!supabase) return;

    try {
      setIsLoadingMessages(true);
      
      // First get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Then get user names for all sender_ids
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', senderIds);

      if (userError) throw userError;

      // Create a map of user IDs to names
      const userMap = new Map(userData?.map(user => [user.id, user.name]));

      // Combine the data
      const transformedData = messagesData?.map(message => ({
        ...message,
        sender_name: userMap.get(message.sender_id) || 'Unknown User'
      })) || [];

      setMessages(transformedData);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [supabase]);

  async function handleReOpen(ticketId: string) {
    if (!supabase) return;

    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'Re-Opened',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Update the local state
      setUserTickets(tickets => 
        tickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status: 'Re-Opened', updated_at: new Date().toISOString() }
            : ticket
        )
      );
    } catch (err) {
      console.error('Error re-opening ticket:', err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }

  // Add handleSendMessage function
  const handleSendMessage = async (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!supabase || !newMessage.trim() || !user) return;

    try {
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (insertError) throw insertError;

      setNewMessage('');
      await loadMessages(ticketId);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Filter tickets based on active tab
  const filteredTickets = userTickets.filter(ticket => {
    if (activeTab === 'active') {
      return ticket.status !== 'Resolved';
    } else {
      return ticket.status === 'Resolved';
    }
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Submit Ticket */}
          <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-white">Submit a New Ticket</h2>
              <p className="text-gray-400">Tell us about your issue and we&apos;ll help you resolve it.</p>
            </div>

            {/* Content Card */}
            <div className="bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-control w-full">
                    <input
                      type="text"
                      placeholder="Ticket Title"
                      className="input input-bordered w-full bg-gray-700 text-white border-gray-600"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <textarea
                      placeholder="Describe your issue..."
                      className="textarea textarea-bordered h-32 bg-gray-700 text-white border-gray-600"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <button
                      type="button"
                      className="btn btn-outline border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      Attach Files
                    </button>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        try {
                          const files = e.target.files;
                          if (!files) return;
                          console.log('Files:', files);
                        } catch (err) {
                          console.error('Error handling files:', err);
                          if (err instanceof Error) {
                            setError(err.message);
                          }
                        }
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Submit Ticket
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column - Your Tickets */}
          <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-white">Your Tickets</h2>
              <p className="text-gray-400">View and manage your support tickets</p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-800 rounded-lg p-2 shadow-lg">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'active'
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Active Tickets
                </button>
                <button
                  onClick={() => setActiveTab('resolved')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'resolved'
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  Resolved Tickets
                </button>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6 space-y-4">
                {filteredTickets.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    No {activeTab} tickets found
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white">{ticket.title}</h3>
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.status === 'Open' ? 'bg-purple-500 text-white' :
                          ticket.status === 'In Progress' ? 'bg-yellow-500 text-white' :
                          ticket.status === 'Resolved' ? 'bg-green-500 text-white' :
                          ticket.status === 'Re-Opened' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        } min-w-[80px]`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-3">{ticket.description}</p>
                      <div className="text-sm text-gray-400 mb-3">
                        Created: {new Date(ticket.created_at).toLocaleString()}
                      </div>
                      
                      <div className="flex gap-2">
                        {ticket.status === 'Resolved' && (
                          <button
                            onClick={() => handleReOpen(ticket.id)}
                            className="btn btn-sm btn-outline"
                          >
                            Re-Open Ticket
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (selectedTicketId === ticket.id) {
                              setSelectedTicketId(null);
                            } else {
                              setSelectedTicketId(ticket.id);
                              loadMessages(ticket.id);
                            }
                          }}
                          className="btn btn-sm btn-primary"
                        >
                          {selectedTicketId === ticket.id ? 'Hide Messages' : 'View Messages'}
                        </button>
                      </div>

                      {/* Messages Section */}
                      {selectedTicketId === ticket.id && (
                        <div className="mt-4 border-t border-gray-600 pt-4">
                          <div className="bg-gray-800 rounded-lg p-4 h-48 overflow-y-auto">
                            {isLoadingMessages ? (
                              <div className="flex justify-center items-center h-full">
                                <span className="loading loading-spinner loading-md"></span>
                              </div>
                            ) : messages.length > 0 ? (
                              <div className="space-y-4">
                                {messages.map(message => (
                                  <div key={message.id} className="flex flex-col">
                                    <div className="bg-gray-700 rounded-lg p-3">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-medium text-blue-300">
                                          {message.sender_name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {new Date(message.created_at).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-white">{message.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-center h-full flex items-center justify-center">
                                No messages yet
                              </div>
                            )}
                          </div>

                          {/* Add message input form */}
                          <form onSubmit={(e) => handleSendMessage(e, ticket.id)} className="mt-4 flex gap-2">
                            <input
                              type="text"
                              placeholder="Type your message..."
                              className="input input-bordered flex-1 bg-gray-700 text-white border-gray-600"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={!newMessage.trim()}
                            >
                              Send
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 