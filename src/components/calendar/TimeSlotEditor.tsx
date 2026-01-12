'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Trash2, Plus, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface TimeSlotEditorProps {
  selectedDates: Date[];
  timeSlots: TimeSlot[];
  onAddSlot: (date: string, startTime: string, endTime: string) => void;
  onRemoveSlot: (slotId: string) => void;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export default function TimeSlotEditor({
  selectedDates,
  timeSlots,
  onAddSlot,
  onRemoveSlot,
  defaultStartTime = '10:00',
  defaultEndTime = '18:00',
}: TimeSlotEditorProps) {
  const [newSlotTimes, setNewSlotTimes] = useState<Record<string, { start: string; end: string }>>({});

  // 時間オプションを生成
  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  const getSlotsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeSlots.filter((slot) => slot.date === dateStr);
  };

  const getNewSlotTime = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return newSlotTimes[dateStr] || { start: defaultStartTime, end: defaultEndTime };
  };

  const setNewSlotTime = (date: Date, start: string, end: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setNewSlotTimes((prev) => ({
      ...prev,
      [dateStr]: { start, end },
    }));
  };

  const handleAddSlot = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const times = getNewSlotTime(date);
    onAddSlot(dateStr, times.start, times.end);
  };

  // 日付でソート
  const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

  if (selectedDates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">カレンダーから日付を選択してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const slots = getSlotsByDate(date);
        const times = getNewSlotTime(date);

        return (
          <div
            key={dateStr}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            {/* Date header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-medium text-slate-900">
                {format(date, 'M/d (E)', { locale: ja })}
              </h3>
            </div>

            <div className="p-4 space-y-3">
              {/* Existing slots */}
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-medium text-blue-700">
                    {slot.start_time} 〜 {slot.end_time}
                  </span>
                  <button
                    onClick={() => onRemoveSlot(slot.id)}
                    className="p-1 text-blue-500 hover:text-red-500 hover:bg-white rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add new slot */}
              <div className="flex items-center gap-2">
                <select
                  value={times.start}
                  onChange={(e) => setNewSlotTime(date, e.target.value, times.end)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <span className="text-slate-400">〜</span>
                <select
                  value={times.end}
                  onChange={(e) => setNewSlotTime(date, times.start, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => handleAddSlot(date)}
                  disabled={times.start >= times.end}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
