import { notFound } from 'next/navigation';
import { getEventById } from '@/lib/api/events';
import { getResponsesByEventId, getResponseSummary } from '@/lib/api/responses';
import EventDetailClient from './EventDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;

  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const { respondents, timeSlots } = await getResponsesByEventId(id);
  const summary = await getResponseSummary(id);

  return (
    <EventDetailClient
      event={event}
      respondents={respondents}
      timeSlots={timeSlots}
      summary={summary}
    />
  );
}
