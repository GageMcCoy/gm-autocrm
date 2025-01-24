import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface TicketResolvedEmailProps {
  customerName: string;
  ticketId: string;
  ticketTitle: string;
  resolutionNotes: string;
}

export default function TicketResolvedEmail({
  customerName,
  ticketId,
  ticketTitle,
  resolutionNotes,
}: TicketResolvedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your ticket has been resolved</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-5 px-4">
            <Heading className="text-2xl font-bold text-gray-800">
              Ticket Resolution Notification
            </Heading>
            
            <Section className="mt-4">
              <Text className="text-gray-700">
                Hello {customerName},
              </Text>
              
              <Text className="text-gray-700">
                Your ticket ({ticketId}) regarding &ldquo;{ticketTitle}&rdquo; has been resolved.
              </Text>

              <Section className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Text className="text-gray-700 font-medium">Resolution Notes:</Text>
                <Text className="text-gray-600">{resolutionNotes}</Text>
              </Section>

              <Text className="mt-4 text-gray-700">
                If you have any questions or if you feel this ticket was resolved in error,
                please don&apos;t hesitate to respond or open a new ticket.
              </Text>

              <Text className="mt-4 text-gray-700">
                Thank you for your patience!
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
} 