'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Clock,
  Users,
  Circle,
  Triangle,
  X,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { EventWithSlots, Respondent, TimeSlotWithResponses } from '@/types';

interface Props {
  event: EventWithSlots;
  respondents: Respondent[];
  timeSlots: TimeSlotWithResponses[];
  summary: {
    slot_id: string;
    date: string;
    start_time: string;
    end_time: string;
    ok_count: number;
    maybe_count: number;
    ng_count: number;
    total_respondents: number;
  }[];
}

export default function EventDetailClient({
  event,
  respondents,
  timeSlots,
  summary,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${event.id}`
    : '';

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLine = () => {
    const text = encodeURIComponent(`${event.title}の日程調整`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://line.me/R/msg/text/?${text}%0A${url}`, '_blank');
  };

  // 日付ごとにグループ化
  const groupedSlots = summary.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, typeof summary>);

  const sortedDates = Object.keys(groupedSlots).sort();

  // ベストな時間帯を見つける
  const bestSlot = summary.reduce((best, current) => {
    if (!best) return current;
    // OK数が多い方を優先、同数ならNG数が少ない方
    if (current.ok_count > best.ok_count) return current;
    if (current.ok_count === best.ok_count && current.ng_count < best.ng_count) return current;
    return best;
  }, summary[0]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg mt-0.5">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={event.status === 'active' ? 'success' : 'default'}>
                {event.status === 'active' ? '受付中' : '締切'}
              </Badge>
              <h1 className="text-xl font-bold text-slate-900">{event.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {event.duration}分
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {respondents.length}人回答
              </span>
            </div>
          </div>
        </div>

        <Button onClick={() => setShowShareModal(true)}>
          <Share2 className="w-4 h-4 mr-1" />
          共有
        </Button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">回答ページを共有</h2>

            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Copy className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-900">
                    {copied ? 'コピーしました' : 'リンクをコピー'}
                  </div>
                  <div className="text-sm text-slate-500 truncate max-w-[200px]">
                    {shareUrl}
                  </div>
                </div>
              </button>

              <button
                onClick={handleShareLine}
                className="w-full flex items-center gap-3 p-4 bg-[#06C755]/10 hover:bg-[#06C755]/20 rounded-xl"
              >
                <div className="w-10 h-10 bg-[#06C755] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.65 1.33 5.02 3.42 6.59-.14.51-.91 3.31-.94 3.53 0 .06.02.13.07.17a.25.25 0 00.19.04c.26-.04 3.02-1.98 3.49-2.31.57.09 1.16.13 1.77.13 5.52 0 10-3.82 10-8.5S17.52 2 12 2z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-900">LINEで送る</div>
                  <div className="text-sm text-slate-500">友達に共有</div>
                </div>
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl"
              >
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-900">回答ページを開く</div>
                  <div className="text-sm text-slate-500">プレビュー確認</div>
                </div>
              </a>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowShareModal(false)}
            >
              閉じる
            </Button>
          </div>
        </div>
      )}

      {/* Best slot highlight */}
      {bestSlot && respondents.length > 0 && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Circle className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
              <div>
                <div className="text-sm text-green-700 font-medium">ベストな候補</div>
                <div className="text-lg font-bold text-green-800">
                  {format(parseISO(bestSlot.date), 'M/d (E)', { locale: ja })} {bestSlot.start_time}〜{bestSlot.end_time}
                </div>
                <div className="text-sm text-green-600">
                  {bestSlot.ok_count}人がOK、{bestSlot.maybe_count}人が調整可
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Summary */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-slate-900">回答一覧</h2>
        </CardHeader>
        <CardContent className="p-0">
          {respondents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">まだ回答がありません</p>
              <p className="text-sm text-slate-400 mt-1">共有リンクを送って回答を集めましょう</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 sticky left-0 bg-slate-50 z-10">
                      日時
                    </th>
                    {respondents.map((r) => (
                      <th key={r.id} className="px-3 py-3 text-sm font-medium text-slate-600 text-center whitespace-nowrap">
                        {r.name}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-sm font-medium text-slate-600 text-center">集計</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDates.map((date) => (
                    groupedSlots[date].map((slot, idx) => {
                      const slotData = timeSlots.find((ts) => ts.id === slot.slot_id);
                      const isBest = bestSlot && slot.slot_id === bestSlot.slot_id;

                      return (
                        <tr
                          key={slot.slot_id}
                          className={`border-b border-slate-100 ${isBest ? 'bg-green-50' : ''}`}
                        >
                          <td className={`px-4 py-3 text-sm sticky left-0 z-10 ${isBest ? 'bg-green-50' : 'bg-white'}`}>
                            {idx === 0 && (
                              <div className="font-medium text-slate-900">
                                {format(parseISO(date), 'M/d (E)', { locale: ja })}
                              </div>
                            )}
                            <div className="text-slate-500">
                              {slot.start_time}〜{slot.end_time}
                            </div>
                          </td>
                          {respondents.map((r) => {
                            const response = slotData?.responses.find(
                              (res) => res.respondent_id === r.id
                            );
                            return (
                              <td key={r.id} className="px-3 py-3 text-center">
                                {response ? (
                                  <div className="flex flex-col items-center">
                                    {response.status === 'ok' && (
                                      <Circle className="w-5 h-5 text-green-500" strokeWidth={3} />
                                    )}
                                    {response.status === 'maybe' && (
                                      <div className="relative">
                                        <Triangle className="w-5 h-5 text-amber-500" strokeWidth={3} />
                                        {response.comment && (
                                          <div className="absolute -top-1 -right-1">
                                            <MessageSquare className="w-3 h-3 text-amber-600" />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {response.status === 'ng' && (
                                      <X className="w-5 h-5 text-red-500" strokeWidth={3} />
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2 text-xs">
                              <span className="text-green-600 font-medium">○{slot.ok_count}</span>
                              <span className="text-amber-600 font-medium">△{slot.maybe_count}</span>
                              <span className="text-red-600 font-medium">×{slot.ng_count}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* △ Comments */}
      {timeSlots.some((ts) => ts.responses.some((r) => r.status === 'maybe' && r.comment)) && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">△のコメント</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeSlots.flatMap((ts) =>
              ts.responses
                .filter((r) => r.status === 'maybe' && r.comment)
                .map((r) => (
                  <div key={r.id} className="bg-amber-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-amber-800">{r.respondent.name}</span>
                      <span className="text-sm text-amber-600">
                        {format(parseISO(ts.date), 'M/d', { locale: ja })} {ts.start_time}〜
                      </span>
                    </div>
                    <p className="text-sm text-amber-700">{r.comment}</p>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
