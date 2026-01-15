'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
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

// 安全な日付パース関数
const parseDate = (date: string | Date): Date => {
  if (typeof date === 'string') {
    // YYYY-MM-DD形式の場合
    const dateOnly = date.split('T')[0];
    return new Date(dateOnly + 'T00:00:00');
  }
  return new Date(date);
};

// 時間文字列から時刻のみ取得
const formatTime = (time: string): string => {
  // HH:MM:SS or HH:MM 形式から HH:MM を取得
  return time.substring(0, 5);
};

// 時間範囲から1時間刻みのスロットを生成
const generateHourlySlots = (slot: TimeSlot): { id: string; time: string; originalSlot: TimeSlot }[] => {
  const startTime = formatTime(slot.start_time);
  const endTime = formatTime(slot.end_time);

  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);

  const slots: { id: string; time: string; originalSlot: TimeSlot }[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({
      id: `${slot.id}_${hour}`,
      time: timeStr,
      originalSlot: slot,
    });
  }

  return slots;
};

export default function ResponseFormClient({ event }: Props) {
  const [name, setName] = useState('');
  const [responses, setResponses] = useState<Record<string, SlotResponse>>({});
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 日付ごとにスロットをグループ化し、1時間刻みに分割
  const groupedSlots = useMemo(() => {
    const groups: Record<string, { id: string; time: string; originalSlot: TimeSlot }[]> = {};

    event.time_slots.forEach((slot) => {
      const dateKey = typeof slot.date === 'string' ? slot.date.split('T')[0] : slot.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      // 1時間刻みのスロットを生成
      const hourlySlots = generateHourlySlots(slot);
      groups[dateKey].push(...hourlySlots);
    });

    // 時間順にソート
    Object.values(groups).forEach((slots) => {
      slots.sort((a, b) => a.time.localeCompare(b.time));
    });

    return groups;
  }, [event.time_slots]);

  const sortedDates = Object.keys(groupedSlots).sort();

  // 全スロットID一覧
  const allSlotIds = useMemo(() => {
    return Object.values(groupedSlots).flat().map(s => s.id);
  }, [groupedSlots]);

  // 日付の回答完了状態を確認
  const getDateCompletionStatus = (date: string): 'complete' | 'partial' | 'none' => {
    const slots = groupedSlots[date];
    const answeredCount = slots.filter((s) => responses[s.id]?.status).length;

    if (answeredCount === 0) return 'none';
    if (answeredCount === slots.length) return 'complete';
    return 'partial';
  };

  // 日付全体のステータスを計算（表示用）
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
  const totalSlots = allSlotIds.length;
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

  // スロットIDから元のtime_slot_idと時間を抽出
  const parseSlotId = (slotId: string) => {
    const parts = slotId.split('_');
    const hour = parts.pop();
    const originalSlotId = parts.join('_');
    return { originalSlotId, hour };
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // 回答を元のスロットIDごとに集約
      const aggregatedResponses: Record<string, { statuses: ResponseStatus[]; comments: string[] }> = {};

      for (const [slotId, response] of Object.entries(responses)) {
        const { originalSlotId } = parseSlotId(slotId);
        if (!aggregatedResponses[originalSlotId]) {
          aggregatedResponses[originalSlotId] = { statuses: [], comments: [] };
        }
        if (response.status) {
          aggregatedResponses[originalSlotId].statuses.push(response.status);
        }
        if (response.comment?.trim()) {
          aggregatedResponses[originalSlotId].comments.push(response.comment.trim());
        }
      }

      // 集約した回答から最終的なステータスを決定
      const finalResponses = Object.entries(aggregatedResponses).map(([originalSlotId, data]) => {
        let status: ResponseStatus = 'ng';
        if (data.statuses.every((s) => s === 'ok')) {
          status = 'ok';
        } else if (data.statuses.some((s) => s === 'ok' || s === 'maybe')) {
          status = 'maybe';
        }

        return {
          time_slot_id: originalSlotId,
          status,
          comment: data.comments.join(' / ') || null,
        };
      });

      const response = await fetch(`/api/events/${event.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          responses: finalResponses,
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
            const completionStatus = getDateCompletionStatus(date);
            const dateStatus = getDateStatus(date);

            return (
              <div
                key={date}
                className={`bg-white rounded-xl border overflow-hidden transition-colors ${
                  completionStatus === 'complete'
                    ? 'border-green-300 bg-green-50/30'
                    : completionStatus === 'partial'
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Date header - clickable to expand */}
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  {/* Completion status icon */}
                  <div className="flex-shrink-0">
                    {completionStatus === 'complete' ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        dateStatus === 'ok' ? 'bg-green-100' :
                        dateStatus === 'ng' ? 'bg-red-100' :
                        'bg-amber-100'
                      }`}>
                        <CheckCircle2 className={`w-5 h-5 ${
                          dateStatus === 'ok' ? 'text-green-600' :
                          dateStatus === 'ng' ? 'text-red-600' :
                          'text-amber-600'
                        }`} />
                      </div>
                    ) : completionStatus === 'partial' ? (
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Circle className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      {format(parseDate(date), 'M/d (E)', { locale: ja })}
                    </div>
                    <div className="text-sm text-slate-500">
                      {slots.length}件の時間帯
                      {completionStatus === 'complete' && (
                        <span className="ml-2 text-green-600">回答済み</span>
                      )}
                      {completionStatus === 'partial' && (
                        <span className="ml-2 text-amber-600">一部未回答</span>
                      )}
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <div className={`p-2 rounded-lg ${isExpanded ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Time slots (expanded) */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Select all buttons */}
                    <div className="p-3 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 mr-2">すべて選択:</span>
                        <button
                          onClick={() => setDateStatus(date, 'ok')}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          ○ すべてOK
                        </button>
                        <button
                          onClick={() => setDateStatus(date, 'maybe')}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                        >
                          △ すべて調整可
                        </button>
                        <button
                          onClick={() => setDateStatus(date, 'ng')}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          × すべてNG
                        </button>
                      </div>
                    </div>

                    {/* Individual time slots */}
                    <div className="divide-y divide-slate-100">
                      {slots.map((slot) => {
                        const slotResponse = responses[slot.id];
                        const isMaybe = slotResponse?.status === 'maybe';

                        return (
                          <div key={slot.id} className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-slate-700">
                                  {slot.time}〜
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
                                  placeholder="例：30分程度なら可、15:00以降ならOK"
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
