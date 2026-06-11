'use client';

import { Plus, Lock, Repeat, Clock3, CheckCircle2, Hourglass, CalendarX2 } from 'lucide-react';
import { slotStart, type BoardSlot, type CourtLane, type DayBoard } from '@/lib/calendar';
import type { Booking } from '@/types';

interface CourtBoardProps {
  board: DayBoard;
  onBook?: (court: string, time: string) => void;
  onOpenBooking?: (b: Booking) => void;
  onSlotClick?: (court: string, slot: BoardSlot) => void;
  readOnly?: boolean;
}

const STATUS_META: Record<BoardSlot['status'], { label: string; icon: React.ReactNode }> = {
  free:     { label: 'Livre',      icon: <Clock3 className="w-3.5 h-3.5" /> },
  mine:     { label: 'Sua reserva', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  pending:  { label: 'Pendente',   icon: <Hourglass className="w-3.5 h-3.5" /> },
  reserved: { label: 'Reservado',  icon: <Lock className="w-3.5 h-3.5" /> },
  weekly:   { label: 'Fixo',       icon: <Repeat className="w-3.5 h-3.5" /> },
};

function Lane({ lane, onBook, onOpenBooking, onSlotClick, readOnly }: { lane: CourtLane } & Omit<CourtBoardProps, 'board'>) {
  const handle = (slot: BoardSlot) => {
    if (slot.status === 'free') {
      if (!readOnly && onBook) return onBook(lane.court, slot.time);
      if (onSlotClick) return onSlotClick(lane.court, slot);
    }
    if ((slot.status === 'mine' || slot.status === 'pending') && slot.booking && onOpenBooking) {
      return onOpenBooking(slot.booking);
    }
    if (onSlotClick) onSlotClick(lane.court, slot);
  };

  return (
    <section className="flex-1 min-w-0 flex flex-col rounded-3xl bg-white border border-[var(--line)] overflow-hidden shadow-[0_1px_3px_rgba(10,22,38,.06)]">
      {/* Lane header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]" style={{ background: lane.color.bg }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-7 rounded-full shrink-0" style={{ background: lane.color.dot }} />
          <h3 className="font-display text-[18px] font-semibold truncate" style={{ color: lane.color.text }}>{lane.court}</h3>
        </div>
        <span
          className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
          style={{ background: lane.freeCount > 0 ? lane.color.dot : '#cbd5e1', color: '#fff' }}
        >
          {lane.freeCount} {lane.freeCount === 1 ? 'livre' : 'livres'}
        </span>
      </header>

      {/* Slots */}
      <div className="flex-1 overflow-y-auto nice-scroll divide-y divide-[var(--line)]">
        {lane.slots.map((slot) => {
          const meta = STATUS_META[slot.status];
          const free = slot.status === 'free';
          const clickable = free ? (!readOnly && !!onBook) || !!onSlotClick
            : (slot.status === 'mine' || slot.status === 'pending') ? !!onOpenBooking || !!onSlotClick
            : !!onSlotClick;

          const weekly = slot.status === 'weekly';
          return (
            <button
              key={slot.time}
              disabled={!clickable}
              onClick={() => handle(slot)}
              className={[
                'group relative w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                free ? 'hover:bg-[var(--brand-tint)]' : weekly ? '' : 'hover:bg-[var(--paper)]',
                clickable ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
              style={weekly ? { background: slot.color.bg } : undefined}
            >
              {weekly && <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: slot.color.dot }} />}

              <span
                className="font-display text-[15px] font-semibold w-12 shrink-0 tabular-nums"
                style={{ color: weekly ? slot.color.text : 'var(--ink)' }}
              >
                {slotStart(slot.time)}
              </span>

              <span className="h-5 w-px shrink-0" style={{ background: weekly ? slot.color.dot : 'var(--line)', opacity: weekly ? 0.4 : 1 }} />

              {/* status / label */}
              <span className="flex-1 min-w-0">
                {free ? (
                  <span className="text-[13px] text-[var(--muted)] group-hover:text-[var(--brand-700)] transition-colors">
                    Horário disponível
                  </span>
                ) : weekly ? (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Repeat className="w-3.5 h-3.5 shrink-0" style={{ color: slot.color.dot }} />
                    <span className="text-[11px] font-bold uppercase tracking-wide shrink-0" style={{ color: slot.color.dot }}>Treino fixo</span>
                    <span className="text-[13px] font-semibold truncate" style={{ color: slot.color.text }}>· {slot.label}</span>
                  </span>
                ) : (
                  <span className="text-[13px] truncate block" style={{ color: slot.color.text }}>
                    {slot.label}
                  </span>
                )}
              </span>

              {/* trailing chip / action */}
              {free ? (
                <span className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4" /> Reservar
                </span>
              ) : (
                <span
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
                  style={weekly ? { background: slot.color.dot, color: '#fff' } : { background: slot.color.bg, color: slot.color.text }}
                >
                  {meta.icon} {meta.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function CourtBoard(props: CourtBoardProps) {
  if (props.board.closed) {
    return (
      <div className="anim-rise rounded-3xl border-2 border-dashed border-[#f3b4b4] bg-[#fdecec] p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#dc2626] text-white grid place-items-center mb-4">
          <CalendarX2 className="w-7 h-7" />
        </div>
        <h3 className="font-display text-[22px] font-bold text-[#b91c1c]">Ginásio fechado</h3>
        <p className="text-[14px] text-[#b91c1c]/80 mt-1">{props.board.closureReason}</p>
        <p className="text-[12px] text-[var(--muted)] mt-3">Nenhuma quadra disponível neste dia.</p>
      </div>
    );
  }

  return (
    <div className="anim-rise flex flex-col lg:flex-row gap-4 min-h-0">
      {props.board.lanes.map((lane) => (
        <Lane key={lane.court} lane={lane} {...props} />
      ))}
    </div>
  );
}
