// Pure helpers shared by the Google-Agenda style calendar views.
// No backend access here — only date math, slot parsing and colour palettes.

import type { Booking, CalendarEntry, GymClosure, WeeklyEvent } from '@/types';

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_LONG = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];
export const MONTHS_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/* ── Date utilities ─────────────────────────────────────────── */

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay()); // week starts on Sunday (pt-BR Google default)
  r.setHours(0, 0, 0, 0);
  return r;
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/** 6×7 matrix of dates covering the month that `anchor` belongs to. */
export function monthMatrix(anchor: Date): Date[][] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)));
  }
  return weeks;
}

/* ── Slot utilities ─────────────────────────────────────────── */

/** "09:00 - 10:00" -> "09:00" */
export function slotStart(slot: string): string {
  return slot.split('-')[0].trim();
}

/**
 * Hora a partir da qual um slot é considerado "de madrugada" e, portanto,
 * pertencente ao dia seguinte na grade (ex.: `00:00 - 00:45` vem depois de
 * `23:00 - 00:00`). A grade abre às 09:00, então nenhum slot legítimo começa
 * antes desse limite no mesmo dia.
 */
const OVERNIGHT_CUTOFF_HOUR = 8;

/**
 * Indica se o horário (slot) já passou em relação a `now`. Dias anteriores a hoje
 * contam como totalmente passados; dias futuros nunca; no dia de hoje compara o
 * início do slot com o horário atual.
 *
 * Slots de madrugada (ex.: `00:00 - 00:45`) aparecem na grade do dia mas ocorrem
 * de fato na madrugada seguinte, então são comparados com a meia-noite do dia +1.
 */
export function slotHasPassed(ymd: string, time: string, now: Date): boolean {
  const [h, m] = slotStart(time).split(':').map(Number);
  const isOvernight = h < OVERNIGHT_CUTOFF_HOUR;

  const start = new Date(`${ymd}T00:00:00`);
  if (isOvernight) start.setDate(start.getDate() + 1);
  start.setHours(h, m, 0, 0);

  return start.getTime() <= now.getTime();
}

/* ── Colour palettes (Google Calendar inspired) ─────────────── */

export interface EventColor {
  dot: string;    // solid colour
  bg: string;     // soft chip / block background
  border: string; // left accent border / outline
  text: string;   // readable text on bg
}

const COURT_COLORS: EventColor[] = [
  { dot: '#1273c2', bg: '#e8f1fb', border: '#1273c2', text: '#0e5c9e' }, // brand blue
  { dot: '#0f3d63', bg: '#e7edf4', border: '#0f3d63', text: '#0f3d63' }, // deep navy
  { dot: '#2a9d8f', bg: '#e4f4f1', border: '#2a9d8f', text: '#1f7a6f' }, // teal (fallback)
  { dot: '#5b4bce', bg: '#ecebf9', border: '#5b4bce', text: '#473ca3' }, // indigo (fallback)
];

export const WEEKLY_COLOR: EventColor = { dot: '#6d4bd8', bg: '#efeafe', border: '#6d4bd8', text: '#5b3fc4' };
export const CLOSURE_COLOR: EventColor = { dot: '#dc2626', bg: '#fdecec', border: '#dc2626', text: '#b91c1c' };
export const PENDING_COLOR: EventColor = { dot: '#d97706', bg: '#fdf2e3', border: '#d97706', text: '#b45309' };

export function courtColor(court: string, courts: string[]): EventColor {
  const idx = Math.max(0, courts.indexOf(court));
  return COURT_COLORS[idx % COURT_COLORS.length];
}

/* ── Unified event model for the views ──────────────────────── */

export type EventKind = 'own' | 'busy' | 'weekly' | 'closure';

export interface AgendaEvent {
  key: string;
  date: string;      // YMD
  time: string;      // full slot string ("" for all-day closures)
  court: string;
  title: string;
  kind: EventKind;
  status?: Booking['status'];
  color: EventColor;
  booking?: Booking; // present for own bookings (enables detail/cancel)
}

/**
 * Builds the flat event list for a set of visible days, merging the user's own
 * bookings, other people's confirmed reservations, weekly recurring events and
 * closures. Own bookings win over the anonymous "busy" layer for the same slot.
 */
export function buildEvents(opts: {
  days: Date[];
  courts: string[];
  ownBookings: Booking[];
  busy: CalendarEntry[];
  weeklyEvents: WeeklyEvent[];
  closures: GymClosure[];
  visibleCourts: Set<string>;
}): AgendaEvent[] {
  const { days, courts, ownBookings, busy, weeklyEvents, closures, visibleCourts } = opts;
  const dayKeys = new Set(days.map(toYMD));
  const events: AgendaEvent[] = [];
  const ownSlots = new Set<string>();

  // Own bookings (any status except cancelled is shown on the grid)
  for (const b of ownBookings) {
    if (b.status === 'cancelled' || b.status === 'rejected') continue;
    if (!dayKeys.has(b.date) || !visibleCourts.has(b.court)) continue;
    ownSlots.add(`${b.date}__${b.time}__${b.court}`);
    events.push({
      key: `own-${b.id}`,
      date: b.date,
      time: b.time,
      court: b.court,
      title: b.court,
      kind: 'own',
      status: b.status,
      color: b.status === 'pending' ? PENDING_COLOR : courtColor(b.court, courts),
      booking: b,
    });
  }

  // Other people's confirmed reservations (availability layer)
  for (const e of busy) {
    if (!dayKeys.has(e.date) || !visibleCourts.has(e.court)) continue;
    if (ownSlots.has(`${e.date}__${e.time}__${e.court}`)) continue;
    events.push({
      key: `busy-${e.date}-${e.time}-${e.court}`,
      date: e.date,
      time: e.time,
      court: e.court,
      title: 'Reservado',
      kind: 'busy',
      color: courtColor(e.court, courts),
    });
  }

  // Weekly recurring events expanded onto the visible days
  for (const d of days) {
    const ymd = toYMD(d);
    for (const w of weeklyEvents) {
      if (w.dayOfWeek !== d.getDay() || !visibleCourts.has(w.court)) continue;
      events.push({
        key: `weekly-${w.id}-${ymd}`,
        date: ymd,
        time: w.time,
        court: w.court,
        title: w.title,
        kind: 'weekly',
        color: WEEKLY_COLOR,
      });
    }
  }

  // Closures (all-day)
  for (const c of closures) {
    if (!dayKeys.has(c.date)) continue;
    events.push({
      key: `closure-${c.id}`,
      date: c.date,
      time: '',
      court: '',
      title: c.reason,
      kind: 'closure',
      color: CLOSURE_COLOR,
    });
  }

  return events;
}

export function indexBySlot(events: AgendaEvent[]): Map<string, AgendaEvent[]> {
  const map = new Map<string, AgendaEvent[]>();
  for (const e of events) {
    if (e.kind === 'closure') continue;
    const k = `${e.date}__${e.time}`;
    (map.get(k) ?? map.set(k, []).get(k)!).push(e);
  }
  return map;
}

/* ── Day board model (court lanes of bookable slots) ────────── */

export type SlotStatus = 'free' | 'mine' | 'pending' | 'reserved' | 'weekly';

export interface BoardSlot {
  time: string;
  status: SlotStatus;
  label: string;
  color: EventColor;
  booking?: Booking;
}

export interface CourtLane {
  court: string;
  color: EventColor;
  slots: BoardSlot[];
  freeCount: number;
}

export interface DayBoard {
  closed: boolean;
  closureReason?: string;
  lanes: CourtLane[];
}

export function buildBoard(opts: {
  date: Date;
  slots: string[];
  courts: string[];
  ownBookings: Booking[];
  busy: CalendarEntry[];
  weeklyEvents: WeeklyEvent[];
  closures: GymClosure[];
  /** Quando informado, horários já passados (no dia de hoje) são ocultados. */
  now?: Date;
}): DayBoard {
  const { date, slots, courts, ownBookings, busy, weeklyEvents, closures, now } = opts;
  const ymd = toYMD(date);
  const dow = date.getDay();

  const closure = closures.find((c) => c.date === ymd);
  if (closure) return { closed: true, closureReason: closure.reason, lanes: [] };

  const visibleSlots = now ? slots.filter((time) => !slotHasPassed(ymd, time, now)) : slots;

  const lanes: CourtLane[] = courts.map((court) => {
    const color = courtColor(court, courts);
    const laneSlots: BoardSlot[] = visibleSlots.map((time) => {
      const mine = ownBookings.find(
        (b) => b.date === ymd && b.court === court && b.time === time &&
          (b.status === 'accepted' || b.status === 'pending'),
      );
      if (mine) {
        return mine.status === 'pending'
          ? { time, status: 'pending', label: 'Sua solicitação', color: PENDING_COLOR, booking: mine }
          : { time, status: 'mine', label: 'Sua reserva', color, booking: mine };
      }
      const weekly = weeklyEvents.find((w) => w.dayOfWeek === dow && w.court === court && w.time === time);
      if (weekly) return { time, status: 'weekly', label: weekly.title, color: WEEKLY_COLOR };

      const reserved = busy.find((b) => b.date === ymd && b.court === court && b.time === time);
      if (reserved) return { time, status: 'reserved', label: reserved.userName || 'Reservado', color };

      return { time, status: 'free', label: 'Livre', color };
    });
    return { court, color, slots: laneSlots, freeCount: laneSlots.filter((s) => s.status === 'free').length };
  });

  return { closed: false, lanes };
}

export function indexByDay(events: AgendaEvent[]): Map<string, AgendaEvent[]> {
  const map = new Map<string, AgendaEvent[]>();
  for (const e of events) {
    (map.get(e.date) ?? map.set(e.date, []).get(e.date)!).push(e);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      if (a.kind === 'closure') return -1;
      if (b.kind === 'closure') return 1;
      return a.time.localeCompare(b.time);
    });
  }
  return map;
}
