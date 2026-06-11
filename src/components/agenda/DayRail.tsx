'use client';

import { useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS_SHORT, MONTHS_LONG, addDays, isSameDay, isToday, toYMD } from '@/lib/calendar';

interface DayRailProps {
  selected: Date;
  onSelect: (d: Date) => void;
  rangeStart: Date;            // first day in the strip
  days?: number;               // how many days to render
  onShift: (deltaDays: number) => void;
  closedDays?: Set<string>;
  myDays?: Set<string>;
  trainingDows?: Set<number>;   // weekdays (0-6) that have a fixed training
}

export default function DayRail({
  selected, onSelect, rangeStart, days = 14, onShift, closedDays, myDays, trainingDows,
}: DayRailProps) {
  const list = useMemo(
    () => Array.from({ length: days }, (_, i) => addDays(rangeStart, i)),
    [rangeStart, days],
  );
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current?.querySelector('[data-selected="true"]') as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selected]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onShift(-7)}
        className="shrink-0 w-9 h-9 rounded-full grid place-items-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Semana anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div ref={scroller} className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1 scroll-px-4">
        {list.map((d) => {
          const sel = isSameDay(d, selected);
          const today = isToday(d);
          const ymd = toYMD(d);
          const closed = closedDays?.has(ymd);
          const mine = myDays?.has(ymd);
          const training = trainingDows?.has(d.getDay());
          return (
            <button
              key={ymd}
              data-selected={sel}
              onClick={() => onSelect(d)}
              className={[
                'shrink-0 w-[58px] rounded-2xl px-1 py-2 flex flex-col items-center gap-0.5 border transition-all',
                sel
                  ? 'bg-[var(--brand)] border-[var(--brand)] text-white shadow-[0_6px_18px_rgba(18,115,194,.45)]'
                  : 'bg-white/[0.06] border-white/10 text-white/80 hover:bg-white/[0.12]',
              ].join(' ')}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {WEEKDAYS_SHORT[d.getDay()]}
              </span>
              <span className="font-display text-[20px] font-bold leading-none">{d.getDate()}</span>
              <span className="text-[9px] opacity-60 leading-none">{MONTHS_LONG[d.getMonth()].slice(0, 3)}</span>
              <span className="h-2 flex items-center gap-0.5 mt-0.5">
                {today && <span className="w-1 h-1 rounded-full bg-current" />}
                {closed && <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />}
                {training && !closed && <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />}
                {mine && !closed && <span className="w-1.5 h-1.5 rounded-full bg-[#86efac]" />}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onShift(7)}
        className="shrink-0 w-9 h-9 rounded-full grid place-items-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Próxima semana"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
