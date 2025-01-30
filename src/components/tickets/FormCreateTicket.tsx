'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTicket } from '@/services/tickets';
import { useSupabase } from '@/providers/SupabaseProvider';
import { toast } from 'sonner';

export default function FormCreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { supabase } = useSupabase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      const result = await response.json();

      // Show success message with priority info
      toast.success(
        `Ticket created successfully! Priority: ${result.priority.priority}`,
        {
          description: result.priority.reason
        }
      );

      // Show the AI response in a separate toast
      if (result.response.message) {
        toast.info('AI Response', {
          description: result.response.message,
          duration: 10000 // 10 seconds to read the message
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      
      // Redirect to the ticket detail page
      router.push(`/customer/tickets/${result.ticket.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Title</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Brief description of your issue"
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Please provide detailed information about your issue"
        />
      </div>

      <button
        type="submit"
        className={`btn btn-primary w-full ${isSubmitting ? 'loading' : ''}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating Ticket...' : 'Create Ticket'}
      </button>
    </form>
  );
} 