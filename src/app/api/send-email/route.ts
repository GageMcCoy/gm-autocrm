import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import TicketResolvedEmail from '@/components/emails/TicketResolvedEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, customerName, ticketId, ticketTitle, resolutionNotes } = await request.json();

    const data = await resend.emails.send({
      from: 'GM AutoCRM <support@resend.dev>',
      to: [to],
      subject: `Ticket Resolved: ${ticketTitle}`,
      react: TicketResolvedEmail({
        customerName,
        ticketId,
        ticketTitle,
        resolutionNotes,
      }),
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 