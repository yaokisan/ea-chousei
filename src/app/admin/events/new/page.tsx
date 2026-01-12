'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, FileText } from 'lucide-react';
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
  const [step, setStep] = useState(1);

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
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-slate-900">時間帯を設定</h2>
            </div>
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
