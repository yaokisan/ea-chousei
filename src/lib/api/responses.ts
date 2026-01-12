import { sql } from '@/lib/db';
import type { Respondent, Response, ResponseFormData, ResponseWithRespondent, TimeSlotWithResponses } from '@/types';

// 回答者を取得または作成
export async function getOrCreateRespondent(
  eventId: string,
  name: string
): Promise<Respondent> {
  // 既存の回答者を検索
  const existing = await sql`
    SELECT * FROM respondents
    WHERE event_id = ${eventId} AND name = ${name}
  `;

  if (existing.rows.length > 0) {
    return existing.rows[0] as Respondent;
  }

  // 新規作成
  const result = await sql`
    INSERT INTO respondents (event_id, name)
    VALUES (${eventId}, ${name})
    RETURNING *
  `;

  return result.rows[0] as Respondent;
}

// 回答を保存
export async function saveResponses(
  eventId: string,
  data: ResponseFormData
): Promise<{ respondent: Respondent; responses: Response[] }> {
  // 回答者を取得または作成
  const respondent = await getOrCreateRespondent(eventId, data.name);

  // 既存の回答を削除
  await sql`
    DELETE FROM responses WHERE respondent_id = ${respondent.id}
  `;

  // 新しい回答を保存
  const responses: Response[] = [];

  for (const response of data.responses) {
    const result = await sql`
      INSERT INTO responses (respondent_id, time_slot_id, status, comment)
      VALUES (${respondent.id}, ${response.time_slot_id}, ${response.status}, ${response.comment || null})
      RETURNING *
    `;
    responses.push(result.rows[0] as Response);
  }

  return { respondent, responses };
}

// イベントの全回答を取得
export async function getResponsesByEventId(eventId: string): Promise<{
  respondents: Respondent[];
  timeSlots: TimeSlotWithResponses[];
}> {
  // 回答者一覧を取得
  const respondentsResult = await sql`
    SELECT * FROM respondents
    WHERE event_id = ${eventId}
    ORDER BY created_at
  `;
  const respondents = respondentsResult.rows as Respondent[];

  // タイムスロットと回答を取得
  const timeSlotsResult = await sql`
    SELECT * FROM time_slots
    WHERE event_id = ${eventId}
    ORDER BY date, start_time
  `;

  const timeSlots: TimeSlotWithResponses[] = await Promise.all(
    timeSlotsResult.rows.map(async (slot) => {
      const responsesResult = await sql`
        SELECT r.*, res.name as respondent_name
        FROM responses r
        JOIN respondents res ON r.respondent_id = res.id
        WHERE r.time_slot_id = ${slot.id}
        ORDER BY res.created_at
      `;

      const responses: ResponseWithRespondent[] = responsesResult.rows.map((row) => ({
        ...row,
        respondent: {
          id: row.respondent_id,
          event_id: eventId,
          name: row.respondent_name,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      })) as ResponseWithRespondent[];

      return {
        ...slot,
        responses,
      } as TimeSlotWithResponses;
    })
  );

  return { respondents, timeSlots };
}

// 特定の回答者の回答を取得
export async function getResponsesByRespondentId(
  respondentId: string
): Promise<Response[]> {
  const result = await sql`
    SELECT * FROM responses
    WHERE respondent_id = ${respondentId}
  `;
  return result.rows as Response[];
}

// 回答の集計を取得
export async function getResponseSummary(eventId: string): Promise<{
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
  ok_count: number;
  maybe_count: number;
  ng_count: number;
  total_respondents: number;
}[]> {
  const result = await sql`
    SELECT
      ts.id as slot_id,
      ts.date,
      ts.start_time,
      ts.end_time,
      COUNT(CASE WHEN r.status = 'ok' THEN 1 END) as ok_count,
      COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as maybe_count,
      COUNT(CASE WHEN r.status = 'ng' THEN 1 END) as ng_count,
      (SELECT COUNT(*) FROM respondents WHERE event_id = ${eventId}) as total_respondents
    FROM time_slots ts
    LEFT JOIN responses r ON ts.id = r.time_slot_id
    WHERE ts.event_id = ${eventId}
    GROUP BY ts.id, ts.date, ts.start_time, ts.end_time
    ORDER BY ts.date, ts.start_time
  `;

  return result.rows.map((row) => ({
    slot_id: row.slot_id,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    ok_count: parseInt(row.ok_count, 10),
    maybe_count: parseInt(row.maybe_count, 10),
    ng_count: parseInt(row.ng_count, 10),
    total_respondents: parseInt(row.total_respondents, 10),
  }));
}
