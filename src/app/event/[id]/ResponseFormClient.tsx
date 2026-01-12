'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import ResponseButtonGroup from '@/components/ui/ResponseButtonGroup';
import type { EventWithSlots, ResponseStatus, TimeSlot } from '@/types';

interface Props {
  event: EventWithSlots;
}

interface SlotResponse {
  status: ResponseStatus | null;
  comment: string;
}

export default function ResponseFormClient({ event }: Props) {
  const [name, setName] = useState('');
  const [responses, setResponses] = useState<Record<string, SlotResponse>>({});
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 日付ごとにスロットをグループ化
  const groupedSlots = useMemo(() => {
    const groups: Record<string, TimeSlot[]> = {};
    event.time_slots.forEach((slot) => {
      if (!groups[slot.date]) {
        groups[slot.date] = [];
      }
      groups[slot.date].push(slot);
    });
    // 時間順にソート
    Object.values(groups).forEach((slots) => {
      slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return groups;
  }, [event.time_slots]);

  const sortedDates = Object.keys(groupedSlots).sort();

  // 日付全体のステータスを計算
  const getDateStatus = (date: string): ResponseStatus | null => {
    const slots = groupedSlots[date];
    const slotResponses = slots.map((s) => responses[s.id]?.status).filter(Boolean);

    if (slotResponses.length === 0) return null;
    if (slotResponses.every((s) => s === 'ok')) return 'ok';
    if (slotResponses.every((s) => s === 'ng')) return 'ng';
    if (slotResponses.some((s) => s === 'ok' || s === 'maybe')) return 'maybe';
    return null;
  };

  // 日付の展開/折りたたみ
  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // 日付全体のステータスを一括設定
  const setDateStatus = (date: string, status: ResponseStatus) => {
    const slots = groupedSlots[date];
    const newResponses = { ...responses };
    slots.forEach((slot) => {
      newResponses[slot.id] = {
        status,
        comment: newResponses[slot.id]?.comment || '',
      };
    });
    setResponses(newResponses);

    // △の場合は展開する
    if (status === 'maybe') {
      setExpandedDates((prev) => new Set([...prev, date]));
    }
  };

  // 個別スロットのステータス設定
  const setSlotStatus = (slotId: string, status: ResponseStatus) => {
    setResponses((prev) => ({
      ...prev,
      [slotId]: {
        status,
        comment: prev[slotId]?.comment || '',
      },
    }));
  };

  // コメント設定
  const setSlotComment = (slotId: string, comment: string) => {
    setResponses((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        comment,
      },
    }));
  };

  // 回答率
  const answeredCount = Object.values(responses).filter((r) => r.status !== null).length;
  const totalSlots = event.time_slots.length;
  const progress = totalSlots > 0 ? (answeredCount / totalSlots) * 100 : 0;

  // バリデーション
  const validate = () => {
    if (!name.trim()) {
      setError('お名前を入力してください');
      return false;
    }

    if (answeredCount !== totalSlots) {
      setError('すべての日時に回答してください');
      return false;
    }

    // △の回答にコメントがあるか確認
    for (const [slotId, response] of Object.entries(responses)) {
      if (response.status === 'maybe' && !response.comment.trim()) {
        setError('「△」の回答にはコメントが必要です');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${event.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          responses: Object.entries(responses).map(([slotId, r]) => ({
            time_slot_id: slotId,
            status: r.status,
            comment: r.comment.trim() || null,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit response');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 送信完了画面
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">回答を送信しました</h1>
          <p className="text-slate-500 mb-6">
            ご協力ありがとうございます。<br />
            日程が決まり次第、ご連絡いたします。
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setIsSubmitted(false);
              setName('');
              setResponses({});
            }}
          >
            別の名前で回答する
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h1 className="font-bold text-slate-900">{event.title}</h1>
          </div>
          {event.description && (
            <p className="text-sm text-slate-500 text-center">{event.description}</p>
          )}
          <div className="flex items-center justify-center gap-3 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.duration}分
            </span>
            {event.deadline && (
              <span>
                期限: {format(new Date(event.deadline), 'M/d (E)', { locale: ja })}
              </span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Name input */}
        <div className="mb-6">
          <Input
            label="お名前"
            placeholder="山田太郎"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Date slots */}
        <div className="space-y-3 mb-6">
          {sortedDates.map((date) => {
            const slots = groupedSlots[date];
            const isExpanded = expandedDates.has(date);
            const dateStatus = getDateStatus(date);
            const allAnswered = slots.every((s) => responses[s.id]?.status);

            return (
              <div
                key={date}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Date header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      {format(parseISO(date), 'M/d (E)', { locale: ja })}
                    </div>
                    <div className="text-sm text-slate-500">
                      {slots.length}件の時間帯
                    </div>
                  </div>

                  {/* Quick response buttons */}
                  <ResponseButtonGroup
                    value={dateStatus}
                    onChange={(status) => setDateStatus(date, status)}
                    size="sm"
                  />

                  {/* Expand button */}
                  <button
                    onClick={() => toggleDate(date)}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isExpanded ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-400'}
                    `}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Time slots (expanded) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {slots.map((slot) => {
                      const slotResponse = responses[slot.id];
                      const isMaybe = slotResponse?.status === 'maybe';

                      return (
                        <div key={slot.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-slate-700">
                                {slot.start_time} 〜 {slot.end_time}
                              </span>
                            </div>
                            <ResponseButtonGroup
                              value={slotResponse?.status || null}
                              onChange={(status) => setSlotStatus(slot.id, status)}
                              size="sm"
                            />
                          </div>

                          {/* Comment for maybe */}
                          {isMaybe && (
                            <div className="mt-3">
                              <Textarea
                                placeholder="例：13:00以降なら○、30分程度なら可"
                                value={slotResponse?.comment || ''}
                                onChange={(e) => setSlotComment(slot.id, e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                              <p className="text-xs text-amber-600 mt-1">
                                ※ 調整可能な条件を入力してください
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!name.trim() || answeredCount !== totalSlots}
        >
          回答を送信 ({answeredCount}/{totalSlots})
        </Button>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">○</span>
            OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs">△</span>
            調整可
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">×</span>
            NG
          </span>
        </div>
      </div>
    </div>
  );
}
