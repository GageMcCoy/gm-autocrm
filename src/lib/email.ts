import { Resend } from 'resend';
import TicketResolvedEmail from '@/components/emails/TicketResolvedEmail';
import { renderAsync } from '@react-email/components';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendTicketResolvedEmailParams {
  to: string;
  customerName: string;
  ticketId: string;
  ticketTitle: string;
  resolutionNotes: string;
}

export async function sendTicketResolvedEmail({
  to,
  customerName,
  ticketId,
  ticketTitle,
  resolutionNotes,
}: SendTicketResolvedEmailParams) {
  try {
    const html = await renderAsync(
      TicketResolvedEmail({
        customerName,
        ticketId,
        ticketTitle,
        resolutionNotes,
      })
    );

    const data = await resend.emails.send({
      from: 'AutoCRM <notifications@your-domain.com>', // Update this with your verified domain
      to,
      subject: `Ticket #${ticketId} Has Been Resolved`,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
} 