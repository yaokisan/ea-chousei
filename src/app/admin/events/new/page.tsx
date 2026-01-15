'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, FileText, RefreshCw, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { format, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import DatePicker from '@/components/calendar/DatePicker';
import TimeSlotEditor from '@/components/calendar/TimeSlotEditor';

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [workStartHour, setWorkStartHour] = useState(9);
  const [workEndHour, setWorkEndHour] = useState(18);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [deadline, setDeadline] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const handleDateSelect = (date: Date) => {
    setSelectedDates([...selectedDates, date]);
  };

  const handleDateDeselect = (date: Date) => {
    setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)));
    // その日付のスロットも削除
    const dateStr = format(date, 'yyyy-MM-dd');
    setTimeSlots(timeSlots.filter((s) => s.date !== dateStr));
  };

  const handleAddSlot = (date: string, startTime: string, endTime: string) => {
    // 重複チェック
    const exists = timeSlots.some(
      (s) => s.date === date && s.start_time === startTime && s.end_time === endTime
    );
    if (exists) return;

    setTimeSlots([
      ...timeSlots,
      {
        id: uuidv4(),
        date,
        start_time: startTime,
        end_time: endTime,
      },
    ]);
  };

  const handleRemoveSlot = (slotId: string) => {
    setTimeSlots(timeSlots.filter((s) => s.id !== slotId));
  };

  // Googleカレンダーから空き時間を取得
  const handleFetchFromCalendar = async () => {
    if (selectedDates.length === 0) {
      alert('まず候補日を選択してください');
      return;
    }

    setIsLoadingCalendar(true);
    setCalendarError(null);

    try {
      const dates = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));

      const response = await fetch('/api/calendar/available-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates,
          workStartHour,
          workEndHour,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'カレンダーの取得に失敗しました');
      }

      const result = await response.json();

      // 取得した空き時間をスロットに追加
      const newSlots: TimeSlot[] = result.data.map((slot: { date: string; start_time: string; end_time: string }) => ({
        id: uuidv4(),
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }));

      // 既存のスロットとマージ（重複を除く）
      const mergedSlots = [...timeSlots];
      for (const newSlot of newSlots) {
        const exists = mergedSlots.some(
          (s) => s.date === newSlot.date && s.start_time === newSlot.start_time && s.end_time === newSlot.end_time
        );
        if (!exists) {
          mergedSlots.push(newSlot);
        }
      }

      setTimeSlots(mergedSlots);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      setCalendarError(error instanceof Error ? error.message : 'カレンダーの取得に失敗しました');
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    if (timeSlots.length === 0) {
      alert('少なくとも1つの時間帯を追加してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          duration,
          deadline: deadline || null,
          timeSlots: timeSlots.map((s) => ({
            date: s.date,
            start_time: s.start_time,
            end_time: s.end_time,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const result = await response.json();
      router.push(`/admin/events/${result.data.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('イベントの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">新規イベント作成</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= s ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}
              `}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-1 mx-1 ${step > s ? 'bg-blue-500' : 'bg-slate-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-slate-900">基本情報</h2>
            </div>

            <div className="space-y-4">
              <Input
                label="タイトル"
                placeholder="例：番組収録の日程調整"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="説明（任意）"
                placeholder="補足説明があれば入力してください"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  所要時間
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30分</option>
                  <option value={60}>1時間</option>
                  <option value={90}>1時間30分</option>
                  <option value={120}>2時間</option>
                  <option value={180}>3時間</option>
                  <option value={240}>4時間</option>
                </select>
              </div>

              <Input
                label="回答期限（任意）"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!title.trim()}>
              次へ
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Date Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-slate-900">候補日を選択</h2>
            </div>
            <DatePicker
              selectedDates={selectedDates}
              onDateSelect={handleDateSelect}
              onDateDeselect={handleDateDeselect}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              戻る
            </Button>
            <Button onClick={() => setStep(3)} disabled={selectedDates.length === 0}>
              次へ
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Time Selection */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Google Calendar Integration */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Googleカレンダーから空き時間を取得</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Googleカレンダーの予定を確認し、空いている時間帯を自動で追加します。
            </p>

            {/* Work hours settings */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">勤務時間:</label>
                <select
                  value={workStartHour}
                  onChange={(e) => setWorkStartHour(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
                <span className="text-slate-400">〜</span>
                <select
                  value={workEndHour}
                  onChange={(e) => setWorkEndHour(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleFetchFromCalendar}
              disabled={isLoadingCalendar || selectedDates.length === 0}
              className="w-full bg-white"
            >
              {isLoadingCalendar ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  取得中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  カレンダーから空き時間を取得
                </>
              )}
            </Button>

            {calendarError && (
              <p className="text-sm text-red-600 mt-2">{calendarError}</p>
            )}
          </div>

          {/* Manual time slot editor */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-slate-900">時間帯を設定</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              カレンダーから取得した空き時間を編集するか、手動で時間帯を追加できます。
            </p>
            <TimeSlotEditor
              selectedDates={selectedDates}
              timeSlots={timeSlots}
              onAddSlot={handleAddSlot}
              onRemoveSlot={handleRemoveSlot}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              戻る
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={timeSlots.length === 0}
            >
              作成する
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
