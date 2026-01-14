'use client';

import { Calendar, Mail, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-6">設定</h1>

      <div className="space-y-4">
        {/* Googleカレンダー連携 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-slate-900">Googleカレンダー連携</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Googleカレンダーと連携すると、空き時間を自動で取得できます。
              ログイン時に既に連携されています。
            </p>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              連携済み
            </div>
          </CardContent>
        </Card>

        {/* メール通知 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-slate-900">メール通知</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              新しい回答があった時にメールで通知を受け取ります。
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Bell className="w-4 h-4" />
              回答通知: 有効（環境変数 RESEND_API_KEY 設定時）
            </div>
          </CardContent>
        </Card>

        {/* アプリ情報 */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">アプリ情報</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">アプリ名</dt>
                <dd className="text-slate-900">EA Desk</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">バージョン</dt>
                <dd className="text-slate-900">1.0.0</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
