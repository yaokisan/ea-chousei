import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEventById, updateEvent, deleteEvent } from '@/lib/api/events';
import { sql } from '@/lib/db';

// イベントを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// イベントを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // イベントの所有者を確認
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.rows.length === 0 || userResult.rows[0].id !== event.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedEvent = await updateEvent(id, body);

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// イベントを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // イベントの所有者を確認
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.rows.length === 0 || userResult.rows[0].id !== event.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteEvent(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
