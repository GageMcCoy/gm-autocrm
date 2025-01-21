'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import type { Ticket } from '@/utils/supabase';
import { useSupabase } from '@/hooks/useSupabase';

export default function CustomerView() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();

  useEffect(() => {
    async function loadUserTickets() {
      if (!supabase) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('tickets')
          .select('*')
          .eq('submitted_by', 'b819988e-abfa-406f-9ce5-9c34674a3824')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setUserTickets(data || []);
      } catch (err) {
        console.error('Error loading tickets:', err);
        setError('Failed to load tickets');
      }
    }

    if (supabase) {
      loadUserTickets();
    }
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !supabase) return;

    try {
      setIsSubmitting(true);
      
      const newTicket = {
        title: title.trim(),
        description: description.trim(),
        status: 'Open',
        priority: 'Medium',
        submitted_by: 'b819988e-abfa-406f-9ce5-9c34674a3824', // Temporary hardcoded user ID
        assigned_to: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to insert ticket:', newTicket);

      const { data, error: insertError } = await supabase
        .from('tickets')
        .insert([newTicket])
        .select();

      if (insertError) {
        console.error('Supabase error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }

      // Clear form
      setTitle('');
      setDescription('');

      // Update the tickets list with the new ticket
      if (data) {
        setUserTickets(prev => [...prev, data[0]]);
      }

      console.log('Ticket submitted successfully:', data);
      
    } catch (err) {
      console.error('Error submitting ticket:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-100">
      <NavBar />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Left Column - Submit Ticket */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-2xl font-bold text-gray-900">Submit a New Ticket</h2>
            <p className="text-gray-700">Tell us about your issue and we&apos;ll help you resolve it.</p>

            {error && (
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="form-control w-full">
                <input
                  type="text"
                  placeholder="Ticket Title"
                  className="input input-bordered w-full text-gray-900"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <textarea
                  placeholder="Describe your issue..."
                  className="textarea textarea-bordered h-32 text-gray-900"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <button
                  type="button"
                  className="btn btn-outline w-full"
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
                      
                      // Handle file upload logic here
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

        {/* Right Column - Your Tickets */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-2xl font-bold text-gray-900">Your Tickets</h2>
            <p className="text-gray-700">View and manage your support tickets</p>

            {userTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No tickets submitted yet
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {userTickets.map((ticket) => (
                  <div key={ticket.id} className="card bg-base-100 border border-gray-200 hover:shadow-md">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                          <p className="text-gray-700 text-sm mt-1">{ticket.description}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            Created: {new Date(ticket.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className={`badge ${
                            ticket.status === 'Open' ? 'badge-primary' :
                            ticket.status === 'In Progress' ? 'badge-warning' :
                            ticket.status === 'Resolved' ? 'badge-success' :
                            'badge-ghost'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 