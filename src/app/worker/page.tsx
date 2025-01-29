'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Re-Opened';
  priority: 'High' | 'Medium' | 'Low';
  submitted_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

export default function WorkerView() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const { supabase, user } = useSupabase();

  const loadTickets = useCallback(async () => {
    if (!supabase) return;

    try {
      setIsLoading(true);
      setTicketError(null);
      
      const { data, error: fetchError } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          submitted_by,
          assigned_to,
          created_at,
          updated_at,
          customer:users!tickets_submitted_by_fkey (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Transform the data to match the Ticket interface
      const transformedData = (data || []).map((ticket: {
        id: string;
        title: string;
        description: string;
        status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Re-Opened';
        priority: 'High' | 'Medium' | 'Low';
        submitted_by: string;
        assigned_to: string | null;
        created_at: string;
        updated_at: string;
        customer: Array<{
          id: string;
          name: string;
          email: string;
        }>;
      }) => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        submitted_by: ticket.submitted_by,
        assigned_to: ticket.assigned_to,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        customer: {
          id: ticket.customer?.[0]?.id || '',
          name: ticket.customer?.[0]?.name || '',
          email: ticket.customer?.[0]?.email || ''
        }
      }));

      setTickets(transformedData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTicketError('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

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
        id: message.id,
        ticket_id: message.ticket_id,
        content: message.content,
        created_at: message.created_at,
        sender_id: message.sender_id,
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

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (selectedTicket && showMessages) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket, showMessages, loadMessages]);

  const handleTicketUpdate = async (ticketId: string, updates: Partial<Ticket>) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      setTicketError('Failed to update ticket');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedTicket || !newMessage.trim() || !user) return;

    try {
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (insertError) throw insertError;

      setNewMessage('');
      await loadMessages(selectedTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageError('Failed to send message');
    }
  };

  // Filter tickets
  const activeTickets = tickets.filter(ticket => {
    // First filter out resolved tickets unless explicitly showing them
    if (statusFilter === '') {
      if (ticket.status === 'Resolved') return false;
    } else if (ticket.status !== statusFilter) return false;

    // Then apply priority filter
    return priorityFilter === '' || ticket.priority === priorityFilter;
  });

  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500 text-white';
      case 'Medium':
        return 'bg-orange-500 text-white';
      case 'Low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'Open':
        return 'bg-purple-500 text-white';
      case 'In Progress':
        return 'bg-yellow-500 text-white';
      case 'Resolved':
        return 'bg-green-500 text-white';
      case 'Re-Opened':
        return 'bg-blue-500 text-white';
      case 'Closed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Ticket Details */}
          <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-white">Ticket Details</h2>
              <p className="text-gray-400">View and manage the selected ticket</p>
            </div>

            {/* Content Card */}
            <div className="bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6">
                {selectedTicket ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-white">{selectedTicket.title}</h3>
                      <div className="flex gap-2">
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(selectedTicket.priority)} min-w-[60px]`}>
                          {selectedTicket.priority}
                        </span>
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedTicket.status)} min-w-[80px]`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-300 mt-2">{selectedTicket.description}</p>

                    <div className="mt-6 space-y-4">
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text text-gray-300 font-medium">Status</span>
                        </label>
                        <select 
                          className="select select-bordered w-full bg-gray-700 text-white border-gray-600"
                          value={selectedTicket.status}
                          onChange={(e) => handleTicketUpdate(selectedTicket.id, { status: e.target.value as Ticket['status'] })}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                          <option value="Re-Opened">Re-Opened</option>
                        </select>
                      </div>

                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text text-gray-300 font-medium">Priority</span>
                        </label>
                        <select 
                          className="select select-bordered w-full bg-gray-700 text-white border-gray-600"
                          value={selectedTicket.priority}
                          onChange={(e) => handleTicketUpdate(selectedTicket.id, { priority: e.target.value as Ticket['priority'] })}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="btn btn-success flex-1"
                          onClick={() => handleTicketUpdate(selectedTicket.id, { status: 'Resolved' })}
                          disabled={selectedTicket.status === 'Resolved'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Resolve
                        </button>
                        <button
                          className="btn btn-warning flex-1"
                          onClick={() => handleTicketUpdate(selectedTicket.id, { priority: 'High' })}
                          disabled={selectedTicket.priority === 'High'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Escalate
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={() => setShowMessages(prev => !prev)}
                        className="btn btn-primary w-full"
                      >
                        {showMessages ? 'Hide Messages' : 'Show Messages'}
                      </button>
                    </div>

                    {showMessages && (
                      <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Messages</h3>
                        {messageError && (
                          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
                            <span>{messageError}</span>
                          </div>
                        )}
                        <div className="bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
                          {isLoadingMessages ? (
                            <div className="flex justify-center items-center h-full">
                              <span className="loading loading-spinner loading-lg text-primary"></span>
                            </div>
                          ) : messages.length > 0 ? (
                            <div className="space-y-4">
                              {messages.map(message => (
                                <div key={message.id} className="bg-gray-600 rounded-lg p-3">
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
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-center h-full flex items-center justify-center">
                              No messages yet
                            </div>
                          )}
                        </div>

                        <form onSubmit={handleSendMessage} className="flex gap-2">
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
                  </>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    Select a ticket from the dashboard to view details
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Ticket List */}
          <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-white">Ticket Dashboard</h2>
              <p className="text-gray-400">Manage and respond to customer tickets</p>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex gap-4">
                <select 
                  className="select select-bordered w-full bg-gray-700 text-white border-gray-600"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Active Tickets Only</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Re-Opened">Re-Opened</option>
                  <option value="Resolved">Show Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                <select 
                  className="select select-bordered w-full bg-gray-700 text-white border-gray-600"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Ticket List */}
            <div className="bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6">
                {ticketError && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
                    <span>{ticketError}</span>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : activeTickets.length > 0 ? (
                  <div className="space-y-4">
                    {activeTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        className={`bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors ${
                          selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white">{ticket.title}</h3>
                            <p className="text-gray-300 text-sm mt-1">{ticket.description}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority)} min-w-[60px]`}>
                              {ticket.priority}
                            </span>
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)} min-w-[80px]`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Created: {new Date(ticket.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    No tickets found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 