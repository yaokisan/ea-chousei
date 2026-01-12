import { sql } from '@/lib/db';
import type { Event, EventWithSlots, TimeSlot } from '@/types';

// イベント一覧を取得
export async function getEventsByUserId(userId: string): Promise<EventWithSlots[]> {
  const result = await sql`
    SELECT
      e.*,
      COUNT(DISTINCT r.id) as respondent_count
    FROM events e
    LEFT JOIN respondents r ON e.id = r.event_id
    WHERE e.user_id = ${userId}
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;

  const events = result.rows as (Event & { respondent_count: string })[];

  // 各イベントのタイムスロットを取得
  const eventsWithSlots = await Promise.all(
    events.map(async (event) => {
      const slotsResult = await sql`
        SELECT * FROM time_slots
        WHERE event_id = ${event.id}
        ORDER BY date, start_time
      `;
      return {
        ...event,
        respondent_count: parseInt(event.respondent_count, 10),
        time_slots: slotsResult.rows as TimeSlot[],
      };
    })
  );

  return eventsWithSlots;
}

// イベントを取得
export async function getEventById(eventId: string): Promise<EventWithSlots | null> {
  const result = await sql`
    SELECT
      e.*,
      COUNT(DISTINCT r.id) as respondent_count
    FROM events e
    LEFT JOIN respondents r ON e.id = r.event_id
    WHERE e.id = ${eventId}
    GROUP BY e.id
  `;

  if (result.rows.length === 0) {
    return null;
  }

  const event = result.rows[0] as Event & { respondent_count: string };

  const slotsResult = await sql`
    SELECT * FROM time_slots
    WHERE event_id = ${eventId}
    ORDER BY date, start_time
  `;

  return {
    ...event,
    respondent_count: parseInt(event.respondent_count, 10),
    time_slots: slotsResult.rows as TimeSlot[],
  };
}

// イベントを作成
export async function createEvent(
  userId: string,
  data: {
    title: string;
    description?: string;
    duration: number;
    deadline?: Date;
    timeSlots: { date: string; start_time: string; end_time: string }[];
  }
): Promise<Event> {
  const deadlineStr = data.deadline ? data.deadline.toISOString() : null;
  const result = await sql`
    INSERT INTO events (user_id, title, description, duration, deadline)
    VALUES (${userId}, ${data.title}, ${data.description || null}, ${data.duration}, ${deadlineStr})
    RETURNING *
  `;

  const event = result.rows[0] as Event;

  // タイムスロットを作成
  if (data.timeSlots.length > 0) {
    for (const slot of data.timeSlots) {
      await sql`
        INSERT INTO time_slots (event_id, date, start_time, end_time)
        VALUES (${event.id}, ${slot.date}, ${slot.start_time}, ${slot.end_time})
      `;
    }
  }

  return event;
}

// イベントを更新
export async function updateEvent(
  eventId: string,
  data: {
    title?: string;
    description?: string;
    duration?: number;
    deadline?: Date | null;
    status?: 'active' | 'closed' | 'cancelled';
  }
): Promise<Event | null> {
  const setClauses = [];
  const values: (string | number | Date | null)[] = [];

  if (data.title !== undefined) {
    setClauses.push(`title = $${values.length + 1}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    setClauses.push(`description = $${values.length + 1}`);
    values.push(data.description);
  }
  if (data.duration !== undefined) {
    setClauses.push(`duration = $${values.length + 1}`);
    values.push(data.duration);
  }
  if (data.deadline !== undefined) {
    setClauses.push(`deadline = $${values.length + 1}`);
    values.push(data.deadline);
  }
  if (data.status !== undefined) {
    setClauses.push(`status = $${values.length + 1}`);
    values.push(data.status);
  }

  if (setClauses.length === 0) {
    return null;
  }

  const result = await sql.query(
    `UPDATE events SET ${setClauses.join(', ')} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, eventId]
  );

  return result.rows[0] as Event || null;
}

// イベントを削除
export async function deleteEvent(eventId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM events WHERE id = ${eventId}
  `;
  return (result.rowCount ?? 0) > 0;
}

// タイムスロットを追加
export async function addTimeSlots(
  eventId: string,
  slots: { date: string; start_time: string; end_time: string }[]
): Promise<TimeSlot[]> {
  const results: TimeSlot[] = [];

  for (const slot of slots) {
    const result = await sql`
      INSERT INTO time_slots (event_id, date, start_time, end_time)
      VALUES (${eventId}, ${slot.date}, ${slot.start_time}, ${slot.end_time})
      ON CONFLICT (event_id, date, start_time, end_time) DO NOTHING
      RETURNING *
    `;
    if (result.rows[0]) {
      results.push(result.rows[0] as TimeSlot);
    }
  }

  return results;
}

// タイムスロットを削除
export async function deleteTimeSlot(slotId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM time_slots WHERE id = ${slotId}
  `;
  return (result.rowCount ?? 0) > 0;
}
