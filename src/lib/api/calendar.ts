import { google, calendar_v3 } from 'googleapis';

interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
}

interface AvailableSlot {
  date: string;
  start_time: string;
  end_time: string;
}

export async function getCalendarEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events: CalendarEvent[] = [];

    if (response.data.items) {
      for (const event of response.data.items) {
        if (event.start?.dateTime && event.end?.dateTime) {
          events.push({
            id: event.id || '',
            summary: event.summary || '(予定)',
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime),
          });
        }
      }
    }

    return events;
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    throw error;
  }
}

// 既存の予定から空き時間を計算
export function calculateAvailableSlots(
  events: CalendarEvent[],
  dates: string[],
  workStartHour: number = 9,
  workEndHour: number = 18
): AvailableSlot[] {
  const availableSlots: AvailableSlot[] = [];

  for (const dateStr of dates) {
    const date = new Date(dateStr + 'T00:00:00');
    const dayStart = new Date(date);
    dayStart.setHours(workStartHour, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(workEndHour, 0, 0, 0);

    // その日の予定を取得
    const dayEvents = events.filter((event) => {
      const eventDate = event.start.toISOString().split('T')[0];
      return eventDate === dateStr;
    });

    // 予定を時間順にソート
    dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // 空き時間を計算
    let currentTime = dayStart;

    for (const event of dayEvents) {
      // イベントが作業時間外なら無視
      if (event.end <= dayStart || event.start >= dayEnd) continue;

      // 現在時刻からイベント開始までの空き時間
      if (event.start > currentTime) {
        const slotEnd = event.start < dayEnd ? event.start : dayEnd;
        if (slotEnd > currentTime) {
          availableSlots.push({
            date: dateStr,
            start_time: formatTimeHHMM(currentTime),
            end_time: formatTimeHHMM(slotEnd),
          });
        }
      }

      // 現在時刻を更新
      if (event.end > currentTime) {
        currentTime = new Date(Math.max(event.end.getTime(), dayStart.getTime()));
      }
    }

    // 最後のイベント後から終業時刻まで
    if (currentTime < dayEnd) {
      availableSlots.push({
        date: dateStr,
        start_time: formatTimeHHMM(currentTime),
        end_time: formatTimeHHMM(dayEnd),
      });
    }
  }

  return availableSlots;
}

function formatTimeHHMM(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 選択した日付の空き時間を直接取得
export async function getAvailableSlots(
  accessToken: string,
  dates: string[],
  workStartHour: number = 9,
  workEndHour: number = 18
): Promise<AvailableSlot[]> {
  if (dates.length === 0) return [];

  // 日付の範囲を計算
  const sortedDates = [...dates].sort();
  const timeMin = new Date(sortedDates[0] + 'T00:00:00');
  const timeMax = new Date(sortedDates[sortedDates.length - 1] + 'T23:59:59');

  const events = await getCalendarEvents(accessToken, timeMin, timeMax);
  return calculateAvailableSlots(events, dates, workStartHour, workEndHour);
}
