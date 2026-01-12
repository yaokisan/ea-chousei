import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/lib/api/events';
import { saveResponses, getResponsesByEventId, getResponseSummary } from '@/lib/api/responses';
import { sendResponseNotification } from '@/lib/email';

// 回答一覧を取得
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'summary') {
      const summary = await getResponseSummary(id);
      return NextResponse.json({ success: true, data: summary });
    }

    const responses = await getResponsesByEventId(id);
    return NextResponse.json({ success: true, data: responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 回答を保存
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'active') {
      return NextResponse.json({ error: 'Event is not accepting responses' }, { status: 400 });
    }

    const body = await request.json();
    const { name, responses } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: 'Responses are required' }, { status: 400 });
    }

    // △の回答にはコメントが必須
    for (const response of responses) {
      if (response.status === 'maybe' && (!response.comment || !response.comment.trim())) {
        return NextResponse.json({ error: '「△」の回答にはコメントが必要です' }, { status: 400 });
      }
    }

    const result = await saveResponses(id, { name: name.trim(), responses });

    // メール通知を送信
    try {
      await sendResponseNotification(event, result.respondent.name);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // メール送信失敗しても回答保存は成功とする
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
