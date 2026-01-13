'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Users, Plus, ChevronRight, MoreVertical, Trash2, Copy, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { EventWithSlots } from '@/types';

interface DashboardClientProps {
  events: EventWithSlots[];
}

// 日付を安全にDateオブジェクトに変換
const parseDate = (date: string | Date): Date => {
  if (typeof date === 'string') {
    const dateStr = date.split('T')[0];
    return new Date(dateStr + 'T00:00:00');
  }
  return new Date(date);
};

// 日付キーを取得
const getDateKey = (date: string | Date): string => {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return new Date(date).toISOString().split('T')[0];
};

export default function DashboardClient({ events: initialEvents }: DashboardClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">受付中</Badge>;
      case 'closed':
        return <Badge variant="default">締切</Badge>;
      case 'cancelled':
        return <Badge variant="danger">キャンセル</Badge>;
      default:
        return null;
    }
  };

  const formatDateRange = (slots: { date: string | Date }[]) => {
    if (slots.length === 0) return '日程未設定';

    const dates = slots.map((s) => getDateKey(s.date)).sort();
    const firstDate = parseDate(dates[0]);
    const lastDate = parseDate(dates[dates.length - 1]);

    if (dates.length === 1) {
      return format(firstDate, 'M/d (E)', { locale: ja });
    }

    return `${format(firstDate, 'M/d', { locale: ja })} 〜 ${format(lastDate, 'M/d', { locale: ja })}`;
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('このイベントを削除しますか？\n回答データも全て削除されます。')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter((e) => e.id !== eventId));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleCopyLink = async (eventId: string) => {
    const url = `${window.location.origin}/event/${eventId}`;
    await navigator.clipboard.writeText(url);
    alert('リンクをコピーしました');
    setOpenMenuId(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ダッシュボード</h1>
          <p className="text-sm text-slate-500 mt-1">
            {events.length > 0 ? `${events.length}件のイベント` : 'イベントがありません'}
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            新規作成
          </Button>
        </Link>
      </div>

      {/* Event List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">まだイベントがありません</p>
            <Link href="/admin/events/new">
              <Button>
                <Plus className="w-4 h-4 mr-1" />
                最初のイベントを作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Content */}
                  <Link href={`/admin/events/${event.id}`} className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(event.status)}
                          <h3 className="font-medium text-slate-900 truncate">
                            {event.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateRange(event.time_slots)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {event.duration}分
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {event.respondent_count}人回答
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>

                    {openMenuId === event.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                          <button
                            onClick={() => handleCopyLink(event.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Copy className="w-4 h-4" />
                            リンクをコピー
                          </button>
                          <a
                            href={`/event/${event.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <ExternalLink className="w-4 h-4" />
                            回答ページを開く
                          </a>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDelete(event.id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            削除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
