import { Resend } from 'resend';
import { sql } from '@/lib/db';
import type { Event } from '@/types';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendResponseNotification(event: Event, respondentName: string) {
  // メール送信が設定されていない場合はスキップ
  if (!resend) {
    console.log('Email notification skipped: RESEND_API_KEY not configured');
    return;
  }

  // イベント作成者のメールアドレスを取得
  const userResult = await sql`
    SELECT email, name FROM users WHERE id = ${event.user_id}
  `;

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];
  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/events/${event.id}`;

  await resend.emails.send({
    from: 'EA Desk <noreply@eadesk.app>',
    to: user.email,
    subject: `【EA Desk】${respondentName}さんが「${event.title}」に回答しました`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">新しい回答がありました</h2>
        <p style="color: #475569;">
          ${user.name}さん、
        </p>
        <p style="color: #475569;">
          <strong>${respondentName}</strong>さんが「<strong>${event.title}</strong>」に回答しました。
        </p>
        <p style="margin: 24px 0;">
          <a href="${eventUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
          ">
            回答を確認する
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">
          このメールは EA Desk から自動送信されています。
        </p>
      </div>
    `,
  });
}
