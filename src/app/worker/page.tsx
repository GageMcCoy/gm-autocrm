'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import Header from '@/components/Header';

interface Message {
  id: string;
  ticket_id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    name: string;
    email: string;
  };
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
}

interface MessageResponse {
  id: string;
  ticket_id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    name: string;
    email: string;
  };
}

export default function WorkerView() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const loadMessages = useCallback(async (ticketId: string) => {
    if (!supabase) return;

    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          ticket_id,
          content,
          created_at,
          user_id,
          user:users (
            name,
            email
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const messages = (data as unknown as MessageResponse[]).map(msg => ({
        id: msg.id,
        ticket_id: msg.ticket_id,
        content: msg.content,
        created_at: msg.created_at,
        user_id: msg.user_id,
        user: {
          name: msg.user?.name || 'Unknown',
          email: msg.user?.email || ''
        }
      }));

      setMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    } else {
      setMessages([]);
    }
  }, [selectedTicket, loadMessages]);

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
      setError('Failed to update ticket');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedTicket || !newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: user.id,
          content: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  // Filter tickets
  const activeTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === '' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === '' || ticket.priority === priorityFilter;
    return matchesStatus && matchesPriority;
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
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Ticket Details */}
          <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-white">Ticket Details</h2>
              <p className="text-gray-400">View and manage ticket information</p>
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
                    </div>

                    <div className="mt-6">
                      <button
                        className="btn btn-primary w-full"
                        onClick={() => setShowMessages(prev => !prev)}
                      >
                        {showMessages ? 'Hide Messages' : 'Show Messages'}
                      </button>
                    </div>

                    {showMessages && (
                      <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Messages</h3>
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
                                      {message.user.name}
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
                  <option value="">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Re-Opened">Re-Opened</option>
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
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
                    <span>{error}</span>
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