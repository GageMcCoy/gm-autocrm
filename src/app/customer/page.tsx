'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Ticket } from '@/utils/supabase';
import { useSupabase } from '@/providers/SupabaseProvider';
import { toast } from 'sonner';
import { analyzePriority } from '@/utils/openai';
import { createTicket } from '@/services/tickets';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { AI_ASSISTANT_ID } from '@/services/messages';

// Add Message interface
interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

// Add Message type for payload
interface MessagePayload {
  id: string;
  ticket_id: string;
  sender_id: string;
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

  // Add subscription cleanup ref
  const messageSubscription = useRef<any>(null);

  // Define loadMessages inside the component
  const loadMessages = useCallback(async (ticketId: string) => {
    if (!supabase) return;

    try {
      setIsLoadingMessages(true);
      
      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Get user names
      const senderIds = [...new Set(messagesData?.map((m: Message) => m.sender_id) || [])];
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', senderIds);

      if (userError) throw userError;

      const userMap = new Map(userData?.map((user: { id: string; name: string }) => [user.id, user.name]));

      // Transform messages
      const transformedData = messagesData?.map((message: Message) => ({
        ...message,
        sender_name: message.sender_id === AI_ASSISTANT_ID 
          ? 'AI Assistant' 
          : userMap.get(message.sender_id) || 'Unknown User'
      })) || [];

      setMessages(transformedData);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [supabase]);

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

  useEffect(() => {
    if (!supabase || !selectedTicketId) {
      if (messageSubscription.current) {
        console.log('Cleaning up old subscription');
        messageSubscription.current.unsubscribe();
        messageSubscription.current = null;
      }
      return;
    }

    // Don't set up subscription for temporary tickets
    if (selectedTicketId.startsWith('temp-')) {
      console.log('Skipping subscription for temporary ticket');
      return;
    }

    // Create a stable channel name
    const channelName = 'messages';
    console.log('Setting up subscription for channel:', channelName);

    // Load initial messages
    loadMessages(selectedTicketId);

    const channel = supabase.channel(channelName);
    
    // Set up subscription
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${selectedTicketId}`,
        },
        async (payload) => {
          console.log('Received new message payload:', {
            id: payload.new.id,
            sender_id: payload.new.sender_id,
            is_ai: payload.new.sender_id === AI_ASSISTANT_ID,
            content: payload.new.content,
            ticket_id: payload.new.ticket_id
          });
          
          // For any new message, add it to the messages array
          setMessages(prevMessages => {
            console.log('Previous messages:', prevMessages);
            const newMessages = [
              ...prevMessages,
              {
                id: payload.new.id,
                ticket_id: payload.new.ticket_id,
                sender_id: payload.new.sender_id,
                sender_name: payload.new.sender_id === AI_ASSISTANT_ID ? 'AI Assistant' : 'Unknown User',
                content: payload.new.content,
                created_at: payload.new.created_at
              }
            ];
            console.log('Updated messages:', newMessages);
            return newMessages;
          });
        }
      )
      .subscribe(status => {
        console.log(`Subscription status for ${channelName}:`, status);
      });

    messageSubscription.current = channel;

    return () => {
      console.log('Cleaning up subscription for channel:', channelName);
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
        messageSubscription.current = null;
      }
    };
  }, [supabase, selectedTicketId, loadMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) {
      toast.error('Please sign in to submit a ticket');
      return;
    }

    // Store form values before clearing
    const submittedTitle = title;
    const submittedDescription = description;

    // Immediately clear form and show loading state
    setIsSubmitting(true);
    setError(null);
    setTitle('');
    setDescription('');

    // Show immediate feedback toast
    const loadingToast = toast.loading('Creating your ticket...', {
      duration: Infinity // We'll dismiss this manually
    });

    try {
      // Create actual ticket first
      const ticket = await createTicket(supabase, {
        title: submittedTitle,
        description: submittedDescription,
        submittedBy: user.id,
        customerId: user.id,
        customerEmail: user.email || ''
      });

      // Add ticket to the list
      setUserTickets(prev => [ticket, ...prev]);
      
      // Set selected ticket ID to trigger subscription
      setSelectedTicketId(ticket.id);
      setActiveTab('active');

      // Initialize messages with just the user's message
      setMessages([
        {
          id: 'initial-message',
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_name: user.user_metadata?.name || user.email || 'You',
          content: submittedDescription,
          created_at: new Date().toISOString()
        }
      ]);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Ticket submitted successfully!', {
        action: {
          label: 'View Ticket',
          onClick: () => {
            const ticketElement = document.getElementById(`ticket-${ticket.id}`);
            if (ticketElement) {
              ticketElement.scrollIntoView({ behavior: 'smooth' });
            }
          }
        },
        duration: 5000
      });

    } catch (err) {
      console.error('Error creating ticket:', err);
      // Restore form values on error
      setTitle(submittedTitle);
      setDescription(submittedDescription);
      setError('Failed to create ticket. Please try again.');
      toast.dismiss(loadingToast);
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Modify handleSendMessage to remove loadMessages call
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
      // Remove the loadMessages call since we have realtime subscription
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

  // Add scroll into view when selecting a ticket
  const handleTicketSelect = (ticketId: string) => {
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null);
    } else {
      setSelectedTicketId(ticketId);
      loadMessages(ticketId);
      
      // Scroll the messages section into view after a short delay
      setTimeout(() => {
        const messagesSection = document.getElementById(`messages-${ticketId}`);
        if (messagesSection) {
          messagesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

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
                    <div 
                      key={ticket.id} 
                      id={`ticket-${ticket.id}`}
                      className={`bg-gray-700 rounded-lg p-4 transition-all duration-200 ${
                        selectedTicketId === ticket.id ? 'ring-2 ring-primary' : 'hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white">{ticket.title}</h3>
                        <div className="flex gap-2 items-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ticket.priority === 'High' ? 'bg-red-500 text-white' :
                            ticket.priority === 'Medium' ? 'bg-yellow-500 text-white' :
                            'bg-green-500 text-white'
                          } min-w-[60px]`}>
                            {ticket.priority}
                          </span>
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
                          onClick={() => handleTicketSelect(ticket.id)}
                          className={`btn btn-sm ${selectedTicketId === ticket.id ? 'btn-secondary' : 'btn-primary'}`}
                        >
                          {selectedTicketId === ticket.id ? 'Hide Messages' : 'View Messages'}
                        </button>
                      </div>

                      {/* Messages Section */}
                      {selectedTicketId === ticket.id && (() => {
                        console.log('Rendering messages:', messages);
                        return (
                          <div 
                            id={`messages-${ticket.id}`}
                            className="mt-4 border-t border-gray-600 pt-4"
                          >
                            <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto">
                              {isLoadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                  <span className="loading loading-spinner loading-md"></span>
                                </div>
                              ) : messages.length > 0 ? (
                                <div className="space-y-4">
                                  {messages.map(message => (
                                    <div 
                                      key={message.id} 
                                      className={`flex flex-col ${
                                        message.sender_id === user?.id ? 'items-end' : 'items-start'
                                      }`}
                                    >
                                      <div className={`bg-gray-700 rounded-lg p-3 max-w-[85%] ${
                                        message.sender_id === user?.id ? 'bg-primary/10' : ''
                                      }`}>
                                        <div className="flex justify-between items-start mb-1 gap-4">
                                          <span className={`text-sm font-medium ${
                                            message.sender_id === user?.id ? 'text-primary' : 'text-blue-300'
                                          }`}>
                                            {message.sender_name}
                                          </span>
                                          <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(message.created_at).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-white whitespace-pre-wrap break-words">
                                          {message.id === 'temp-loading' ? (
                                            <span className="flex items-center gap-2">
                                              Generating response...
                                              <span className="loading loading-dots loading-sm"></span>
                                            </span>
                                          ) : (
                                            message.content
                                          )}
                                        </p>
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
                        );
                      })()}
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