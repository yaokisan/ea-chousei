import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { format, addDays, startOfDay, endOfDay, parseISO, differenceInMinutes } from 'date-fns';

interface CalendarEvent {
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  summary?: string;
}

interface AvailableSlot {
  date: string;
  start_time: string;
  end_time: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = (session as { accessToken?: string }).accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');
    const endDate = searchParams.get('endDate') || format(addDays(new Date(), 30), 'yyyy-MM-dd');
    const workStartTime = searchParams.get('workStartTime') || '09:00';
    const workEndTime = searchParams.get('workEndTime') || '21:00';
    const slotDuration = parseInt(searchParams.get('slotDuration') || '60', 10);

    // Googleカレンダーから予定を取得
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: startOfDay(parseISO(startDate)).toISOString(),
        timeMax: endOfDay(parseISO(endDate)).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.json();
      console.error('Google Calendar API error:', error);
      return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
    }

    const calendarData = await calendarResponse.json();
    const busySlots = (calendarData.items || []).map((event: CalendarEvent) => ({
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
    }));

    // 空き時間を計算
    const availableSlots: AvailableSlot[] = [];
    let currentDate = parseISO(startDate);
    const endDateParsed = parseISO(endDate);

    while (currentDate <= endDateParsed) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      // その日のbusy時間を取得
      const dayBusySlots = busySlots.filter((slot: { start: string; end: string }) => {
        const slotDate = slot.start.split('T')[0];
        return slotDate === dateStr;
      });

      // 作業時間内でスロットを生成
      const [workStartHour, workStartMin] = workStartTime.split(':').map(Number);
      const [workEndHour, workEndMin] = workEndTime.split(':').map(Number);

      let currentTime = workStartHour * 60 + workStartMin;
      const endTime = workEndHour * 60 + workEndMin;

      while (currentTime + slotDuration <= endTime) {
        const slotStart = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`;
        const slotEnd = `${Math.floor((currentTime + slotDuration) / 60).toString().padStart(2, '0')}:${((currentTime + slotDuration) % 60).toString().padStart(2, '0')}`;

        // 既存の予定と重なっていないかチェック
        const slotStartDateTime = new Date(`${dateStr}T${slotStart}:00`);
        const slotEndDateTime = new Date(`${dateStr}T${slotEnd}:00`);

        const isAvailable = !dayBusySlots.some((busy: { start: string; end: string }) => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return slotStartDateTime < busyEnd && slotEndDateTime > busyStart;
        });

        if (isAvailable) {
          availableSlots.push({
            date: dateStr,
            start_time: slotStart,
            end_time: slotEnd,
          });
        }

        currentTime += 30; // 30分刻みで次のスロットへ
      }

      currentDate = addDays(currentDate, 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        availableSlots,
        busySlots: busySlots.map((slot: { start: string; end: string }) => ({
          ...slot,
          summary: 'busy',
        })),
      },
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
