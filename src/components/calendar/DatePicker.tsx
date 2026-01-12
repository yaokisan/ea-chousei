'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ja } from 'date-fns/locale';

interface DatePickerProps {
  selectedDates: Date[];
  onDateSelect: (date: Date) => void;
  onDateDeselect: (date: Date) => void;
  minDate?: Date;
  disabledDates?: Date[];
}

export default function DatePicker({
  selectedDates,
  onDateSelect,
  onDateDeselect,
  minDate = new Date(),
  disabledDates = [],
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const isDateSelected = (date: Date) => {
    return selectedDates.some((d) => isSameDay(d, date));
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(minDate))) return true;
    return disabledDates.some((d) => isSameDay(d, date));
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (isDateSelected(date)) {
      onDateDeselect(date);
    } else {
      onDateSelect(date);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">
          {format(currentMonth, 'yyyy年 M月', { locale: ja })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`
              text-center text-xs font-medium py-2
              ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-slate-500'}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isDateSelected(day);
          const isDisabled = isDateDisabled(day);
          const isDayToday = isToday(day);
          const dayOfWeek = day.getDay();

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg
                transition-colors duration-150
                ${!isCurrentMonth ? 'text-slate-300' : ''}
                ${isDisabled ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100'}
                ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                ${isDayToday && !isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                ${!isSelected && isCurrentMonth && dayOfWeek === 0 ? 'text-red-500' : ''}
                ${!isSelected && isCurrentMonth && dayOfWeek === 6 ? 'text-blue-500' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Selected dates count */}
      <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500 text-center">
        {selectedDates.length > 0 ? (
          <span>{selectedDates.length}日選択中</span>
        ) : (
          <span>日付をタップして選択</span>
        )}
      </div>
    </div>
  );
}
