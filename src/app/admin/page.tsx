import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getEventsByUserId } from '@/lib/api/events';
import DashboardClient from './DashboardClient';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  // ユーザーIDを取得
  const userResult = await sql`
    SELECT id FROM users WHERE email = ${session.user.email}
  `;

  if (userResult.rows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">ユーザー情報が見つかりません。</p>
      </div>
    );
  }

  const userId = userResult.rows[0].id;
  const events = await getEventsByUserId(userId);

  return <DashboardClient events={events} />;
}
