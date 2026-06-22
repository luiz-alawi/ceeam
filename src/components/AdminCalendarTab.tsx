'use client';

import { useEffect, useMemo, useState } from 'react';
import DayRail from '@/components/agenda/DayRail';
import CourtBoard from '@/components/agenda/CourtBoard';
import BookingDetailModal from '@/components/BookingDetailModal';
import { buildBoard, toYMD } from '@/lib/calendar';
import { COURTS, TIME_SLOTS } from '@/data/mockData';
import { formatDatePtBR } from '@/utils/dateUtils';
import type { Booking, CalendarEntry, GymClosure, WeeklyEvent, Request } from '@/types';

interface AdminCalendarTabProps {
  calendarBookings: CalendarEntry[];
  closures: GymClosure[];
  weeklyEvents: WeeklyEvent[];
  requests: Request[];
  onUpdateStatus: (id: string, status: 'accepted' | 'rejected' | 'cancelled') => void;
  onChat: (user: { name: string; email: string }) => void;
}

export default function AdminCalendarTab({
  calendarBookings, closures, weeklyEvents, requests, onUpdateStatus, onChat,
}: AdminCalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [rangeStart, setRangeStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [detail, setDetail] = useState<Request | null>(null);

  // Relógio que avança ao longo do dia, ocultando horários já passados (igual ao dashboard).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const byId = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);
  const ownBookings = useMemo(
    () => requests.filter((r) => r.status === 'pending' || r.status === 'accepted') as unknown as Booking[],
    [requests],
  );

  const board = useMemo(() => {
    const b = buildBoard({ date: selectedDate, slots: TIME_SLOTS, courts: COURTS, ownBookings, busy: calendarBookings, weeklyEvents, closures, now });
    // Relabel own slots with the requester name for the admin perspective.
    for (const lane of b.lanes) {
      for (const slot of lane.slots) {
        if ((slot.status === 'mine' || slot.status === 'pending') && slot.booking) {
          const r = byId.get(slot.booking.id);
          if (r) slot.label = r.userName;
        }
      }
    }
    return b;
  }, [selectedDate, ownBookings, calendarBookings, weeklyEvents, closures, byId, now]);

  const closedDays = useMemo(() => new Set(closures.map((c) => c.date)), [closures]);
  const activeDays = useMemo(() => new Set(ownBookings.map((b) => b.date)), [ownBookings]);
  const trainingDows = useMemo(() => new Set(weeklyEvents.map((w) => w.dayOfWeek)), [weeklyEvents]);

  const heroDate = formatDatePtBR(toYMD(selectedDate), { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="rounded-3xl overflow-hidden border border-[var(--line)] bg-white shadow-[0_1px_3px_rgba(10,22,38,.06)]">
      <div className="bg-[var(--ink)] court-lines text-white px-4 sm:px-5 pt-4 pb-3">
        <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-300)]">Agenda geral</p>
            <h2 className="font-display text-[22px] font-bold capitalize leading-tight mt-0.5">{heroDate}</h2>
          </div>
          <button
            onClick={() => { const t = new Date(); t.setHours(0,0,0,0); setSelectedDate(t); setRangeStart(t); }}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
          >
            Hoje
          </button>
        </div>
        <DayRail
          selected={selectedDate}
          onSelect={setSelectedDate}
          rangeStart={rangeStart}
          days={21}
          onShift={(d) => setRangeStart((prev) => { const n = new Date(prev); n.setDate(n.getDate() + d); return n; })}
          closedDays={closedDays}
          myDays={activeDays}
          trainingDows={trainingDows}
        />
      </div>

      <div className="p-4 sm:p-5 bg-[var(--paper)]">
        <CourtBoard
          board={board}
          readOnly
          onOpenBooking={(b) => { const r = byId.get(b.id); if (r) setDetail(r); }}
        />
      </div>

      {detail && (
        <BookingDetailModal
          booking={{
            id: detail.id, court: detail.court, date: detail.date, time: detail.time,
            players: detail.players, equipment: detail.equipment, status: detail.status,
            userName: detail.userName, userEmail: detail.userEmail, requestDate: detail.requestDate,
          }}
          onClose={() => setDetail(null)}
          onAccept={() => { onUpdateStatus(detail.id, 'accepted'); setDetail(null); }}
          onReject={() => { onUpdateStatus(detail.id, 'rejected'); setDetail(null); }}
          onAdminCancel={() => { onUpdateStatus(detail.id, 'cancelled'); setDetail(null); }}
          onRestore={() => { onUpdateStatus(detail.id, 'accepted'); setDetail(null); }}
          onChat={() => { onChat({ name: detail.userName, email: detail.userEmail }); setDetail(null); }}
        />
      )}
    </div>
  );
}
