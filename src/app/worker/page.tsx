'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import type { Ticket } from '@/utils/supabase';
import { useSupabase } from '@/hooks/useSupabase';

export default function WorkerView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();

  const loadTickets = useCallback(async () => {
    if (!supabase) return;

    try {
      setIsLoading(true);
      console.log('Starting ticket fetch...');
      
      // First, let's verify we can access the table
      const { data: tableInfo } = await supabase
        .from('tickets')
        .select('count');
      
      console.log('Table info:', tableInfo);
      
      // Now fetch all tickets
      const { data, error } = await supabase
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

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Tickets loaded successfully:', data);
      if (data && data.length > 0) {
        console.log('First ticket status:', data[0].status);
        console.log('First ticket priority:', data[0].priority);
      }
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase, setTickets, setIsLoading]);

  useEffect(() => {
    if (supabase) {
      loadTickets();
    }
  }, [supabase, loadTickets]);

  async function handleTicketUpdate(ticketId: string, updates: Partial<Ticket>) {
    if (!supabase) return;

    try {
      console.log('Starting update for ticket:', ticketId);
      
      // First, get the current ticket data
      const { data: currentTicket, error: fetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (fetchError) {
        console.error('Error fetching current ticket:', fetchError);
        throw fetchError;
      }

      if (!currentTicket) {
        throw new Error('Ticket not found');
      }

      // Prepare the update data
      const formattedUpdates = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      console.log('Updating with data:', formattedUpdates);

      // Perform the update
      const { error: updateError } = await supabase
        .from('tickets')
        .update(formattedUpdates)
        .eq('id', ticketId);

      if (updateError) {
        console.error('Error updating ticket:', updateError);
        throw updateError;
      }

      // Fetch the updated ticket
      const { data: updatedTicket, error: refetchError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (refetchError) {
        console.error('Error fetching updated ticket:', refetchError);
        throw refetchError;
      }

      console.log('Update successful:', updatedTicket);

      // Update local state
      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? updatedTicket : ticket
      ));

    } catch (error) {
      console.error('Error in handleTicketUpdate:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    // Exclude resolved tickets
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') return false;

    const matchesSearch = searchQuery === '' || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === '' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Helper function to get priority badge color
  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'High':
        return 'inline-flex items-center justify-center bg-orange-500 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[60px]';
      case 'Medium':
        return 'inline-flex items-center justify-center bg-blue-500 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[60px]';
      case 'Low':
        return 'inline-flex items-center justify-center bg-green-500 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[60px]';
      default:
        return 'inline-flex items-center justify-center bg-gray-500 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[60px]';
    }
  };

  // Helper function to get status badge color
  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'Open':
        return 'inline-flex items-center justify-center bg-purple-500 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[80px]';
      case 'In Progress':
        return 'inline-flex items-center justify-center bg-yellow-500 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[80px]';
      case 'Resolved':
        return 'inline-flex items-center justify-center bg-green-600 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[80px]';
      case 'Closed':
        return 'inline-flex items-center justify-center bg-gray-600 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[80px]';
      default:
        return 'inline-flex items-center justify-center bg-gray-500 text-white font-semibold px-2.5 py-0.5 rounded-full text-sm whitespace-nowrap min-w-[80px]';
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      <NavBar />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Left Column - Ticket Details */}
        <div className="space-y-4">
          {/* Header Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="text-2xl font-bold text-gray-900">Ticket Details</h2>
              <p className="text-gray-700">View and manage ticket information</p>
            </div>
          </div>

          {/* Content Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {selectedTicket ? (
                <>
                  <div className="mt-2">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{selectedTicket.title}</h3>
                      <div className="flex gap-2">
                        <span className={getPriorityBadge(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </span>
                        <span className={getStatusBadge(selectedTicket.status)}>
                          {selectedTicket.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">{selectedTicket.description}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      Created: {new Date(selectedTicket.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="form-control w-full mt-6">
                    <label className="label">
                      <span className="label-text text-gray-700 font-medium">Status</span>
                    </label>
                    <select 
                      className="select select-bordered w-full text-gray-900" 
                      value={selectedTicket.status}
                      onChange={(e) => {
                        handleTicketUpdate(selectedTicket.id, { status: e.target.value as Ticket['status'] });
                      }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="form-control w-full mt-4">
                    <label className="label">
                      <span className="label-text text-gray-700 font-medium">Priority</span>
                    </label>
                    <select 
                      className="select select-bordered w-full text-gray-900"
                      value={selectedTicket.priority}
                      onChange={(e) => {
                        handleTicketUpdate(selectedTicket.id, { priority: e.target.value as Ticket['priority'] });
                      }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button 
                      className="btn btn-success text-white gap-2"
                      onClick={() => handleTicketUpdate(selectedTicket.id, { status: 'Resolved' })}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Resolve
                    </button>
                    <button 
                      className="btn btn-warning text-white gap-2"
                      onClick={() => handleTicketUpdate(selectedTicket.id, { priority: 'High' })}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Escalate
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-gray-600 text-center py-8">
                  Select a ticket from the dashboard to view details
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Ticket Dashboard */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-2xl font-bold text-gray-900">Ticket Dashboard</h2>
            <p className="text-gray-700">Manage and respond to customer tickets</p>

            <div className="flex gap-4 mt-4">
              <input 
                type="text" 
                placeholder="Search tickets..." 
                className="input input-bordered w-full text-gray-900" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select 
                className="select select-bordered w-32 text-gray-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
              </select>

              <select 
                className="select select-bordered w-32 text-gray-900"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map(ticket => (
                  <div 
                    key={ticket.id}
                    className={`card bg-base-100 border hover:shadow-md cursor-pointer transition-all ${
                      selectedTicket?.id === ticket.id ? 'border-primary border-2' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                          <p className="text-gray-700 text-sm mt-1 line-clamp-2">{ticket.description}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            Created: {new Date(ticket.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 min-w-fit">
                          <span className={getPriorityBadge(ticket.priority)}>
                            {ticket.priority}
                          </span>
                          <span className={getStatusBadge(ticket.status)}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-600 text-center py-8">
                  No tickets found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 