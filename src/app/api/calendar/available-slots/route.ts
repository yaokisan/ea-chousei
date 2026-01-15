import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAvailableSlots } from '@/lib/api/calendar';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // セッションからアクセストークンを取得
    const accessToken = (session as { accessToken?: string }).accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar access token not found. Please re-login.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dates, workStartHour = 9, workEndHour = 18 } = body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'dates array is required' },
        { status: 400 }
      );
    }

    const availableSlots = await getAvailableSlots(
      accessToken,
      dates,
      workStartHour,
      workEndHour
    );

    return NextResponse.json({ data: availableSlots });
  } catch (error) {
    console.error('Failed to get available slots:', error);
    return NextResponse.json(
      { error: 'Failed to get available slots from Google Calendar' },
      { status: 500 }
    );
  }
}
