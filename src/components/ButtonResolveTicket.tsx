'use client';

import { useState } from 'react';
import { resolveTicket } from '@/app/actions/tickets';

interface ButtonResolveTicketProps {
  ticketId: string;
}

export default function ButtonResolveTicket({ ticketId }: ButtonResolveTicketProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [showResolutionInput, setShowResolutionInput] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) return;
    
    try {
      setIsResolving(true);
      const result = await resolveTicket({
        ticketId,
        resolutionNotes,
      });

      if (result.success) {
        setShowResolutionInput(false);
        setResolutionNotes('');
      } else {
        alert('Failed to resolve ticket: ' + result.error);
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('An error occurred while resolving the ticket');
    } finally {
      setIsResolving(false);
    }
  };

  if (showResolutionInput) {
    return (
      <div className="space-y-4">
        <textarea
          className="w-full min-h-[100px] p-2 border rounded-lg"
          placeholder="Enter resolution notes..."
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          disabled={isResolving}
        />
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            onClick={handleResolve}
            disabled={isResolving || !resolutionNotes.trim()}
          >
            {isResolving ? 'Resolving...' : 'Confirm Resolution'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowResolutionInput(false)}
            disabled={isResolving}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className="btn btn-success"
      onClick={() => setShowResolutionInput(true)}
    >
      Resolve Ticket
    </button>
  );
} 