import { notFound } from 'next/navigation';
import { getEventById } from '@/lib/api/events';
import ResponseFormClient from './ResponseFormClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventResponsePage({ params }: Props) {
  const { id } = await params;

  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return <ResponseFormClient event={event} />;
}
