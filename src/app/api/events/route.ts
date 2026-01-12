import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEventsByUserId, createEvent } from '@/lib/api/events';
import { sql } from '@/lib/db';

// イベント一覧を取得
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーIDを取得
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;
    const events = await getEventsByUserId(userId);

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// イベントを作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーIDを取得
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;
    const body = await request.json();

    const { title, description, duration, deadline, timeSlots } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const event = await createEvent(userId, {
      title,
      description,
      duration: duration || 60,
      deadline: deadline ? new Date(deadline) : undefined,
      timeSlots: timeSlots || [],
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
