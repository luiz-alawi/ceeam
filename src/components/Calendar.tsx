'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COURTS } from '@/data/mockData';
import type { CalendarEntry, GymClosure, WeeklyEvent } from '@/types';

interface CalendarProps {
  bookings: CalendarEntry[];
  closures: GymClosure[];
  weeklyEvents: WeeklyEvent[];
  onDateClick: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
  selectedDate: Date | null;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Calendar({ bookings, closures, weeklyEvents, onDateClick, onDateDoubleClick, selectedDate }: CalendarProps) {
  const [current, setCurrent] = useState(new Date());
  const [court, setCourt] = useState(COURTS[0]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const closureSet = new Set(closures.map((c) => c.date));
  const closureReasonMap = new Map(closures.map((c) => [c.date, c.reason]));

  const bookedTimesForDay = (ymd: string) =>
    bookings.filter((b) => b.date === ymd && b.court === court).map((b) => b.time);

  const weeklyForDow = (dow: number) =>
    weeklyEvents.filter((we) => we.court === court && we.dayOfWeek === dow);

  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="aspect-square" />);

  for (let day = 1; day <= daysInMonth; day++) {
    const ymd = toYMD(new Date(year, month, day));
    const isClosed = closureSet.has(ymd);
    const times = bookedTimesForDay(ymd);
    const isBooked = times.length > 0;
    const isToday = ymd === toYMD(new Date());
    const isSelected = selectedDate ? ymd === toYMD(selectedDate) : false;
    const dow = new Date(year, month, day).getDay();
    const hasWeekly = weeklyForDow(dow).length > 0;

    let base = 'aspect-square rounded-md flex flex-col items-center justify-center relative transition-all text-xs ';

    if (isClosed) {
      base += 'bg-red-100 text-red-700 cursor-not-allowed';
    } else if (isBooked) {
      base += 'bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer hover:scale-105';
    } else if (isToday) {
      base += 'border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 cursor-pointer hover:scale-105';
    } else {
      base += 'hover:bg-gray-100 text-gray-700 cursor-pointer hover:scale-105';
    }

    if (isSelected) base += ' ring-2 ring-blue-400 ring-offset-2';

    cells.push(
      <button
        key={day}
        onClick={() => !isClosed && onDateClick(new Date(year, month, day))}
        onDoubleClick={() => !isClosed && onDateDoubleClick?.(new Date(year, month, day))}
        className={base}
        title={isClosed ? closureReasonMap.get(ymd) : undefined}
        disabled={isClosed}
      >
        <span>{day}</span>
        {isClosed && (
          <span className="absolute bottom-0 left-0 right-0 bg-red-400 text-white text-[9px] text-center rounded-b-lg leading-4 truncate px-0.5">
            Fechado
          </span>
        )}
        {!isClosed && isBooked && (
          <span className="absolute bottom-0 left-0 right-0 bg-blue-800 text-white text-[9px] text-center rounded-b-lg leading-4">
            {times.length}×
          </span>
        )}
        {!isClosed && hasWeekly && (
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
        )}
      </button>,
    );
  }

  return (
    <div>
      {/* Court tabs */}
      <div className="flex rounded-lg border border-gray-200 mb-3 overflow-hidden">
        {COURTS.map((c) => (
          <button
            key={c}
            onClick={() => setCourt(c)}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              court === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrent(new Date(year, month - 1))}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h3 className="text-sm font-bold text-gray-900">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={() => setCurrent(new Date(year, month + 1))}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">{cells}</div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-blue-600 rounded" />
          Reservado
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 border-2 border-blue-600 rounded" />
          Hoje
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-red-100 rounded border border-red-300" />
          Fechado
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
          Fixo semanal
        </div>
      </div>

      {/* Selected day info */}
      {selectedDate && !closureSet.has(toYMD(selectedDate)) && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="font-semibold text-gray-900 text-xs mb-1.5">
            {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' — '}{court}
          </p>
          {weeklyForDow(selectedDate.getDay()).length > 0 && (
            <div className="mb-1.5 space-y-0.5">
              {weeklyForDow(selectedDate.getDay()).map((we) => (
                <p key={we.id} className="text-xs text-purple-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full inline-block flex-shrink-0" />
                  {we.time} — {we.title}
                </p>
              ))}
            </div>
          )}
          {bookedTimesForDay(toYMD(selectedDate)).length > 0 ? (
            <div className="space-y-0.5">
              {bookedTimesForDay(toYMD(selectedDate)).map((t) => (
                <p key={t} className="text-xs text-gray-600">🕐 {t}</p>
              ))}
            </div>
          ) : weeklyForDow(selectedDate.getDay()).length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum horário reservado — disponível!</p>
          ) : null}
        </div>
      )}

      {selectedDate && closureSet.has(toYMD(selectedDate)) && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs font-medium text-red-700">
            🔒 {closureReasonMap.get(toYMD(selectedDate))}
          </p>
        </div>
      )}
    </div>
  );
}
