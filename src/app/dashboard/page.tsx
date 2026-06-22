'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, MessageCircle, Plus, CalendarCheck2, CheckCircle2, Hourglass, XCircle, ListOrdered, Repeat } from 'lucide-react';
import TopAppBar from '@/components/agenda/TopAppBar';
import DayRail from '@/components/agenda/DayRail';
import CourtBoard from '@/components/agenda/CourtBoard';
import BookingModal from '@/components/BookingModal';
import RecurringModal from '@/components/RecurringModal';
import BookingDetailModal from '@/components/BookingDetailModal';
import ChatModal from '@/components/ChatModal';
import { getBookings, createBooking, createRecurringBooking, cancelBooking } from '@/actions/bookings';
import { getCalendarData } from '@/actions/calendar';
import { buildBoard, toYMD, courtColor } from '@/lib/calendar';
import { COURTS, TIME_SLOTS } from '@/data/mockData';
import { formatDatePtBR } from '@/utils/dateUtils';
import type { Booking, CalendarEntry, GymClosure, WeeklyEvent } from '@/types';

const STATUS_CHIP: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  accepted: { label: 'Confirmado', icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-[#e7f6ec] text-[#1f7a44]' },
  pending:  { label: 'Pendente',   icon: <Hourglass className="w-3.5 h-3.5" />,    cls: 'bg-[#fdf2e3] text-[#b45309]' },
  waitlisted:{ label: 'Lista de espera', icon: <ListOrdered className="w-3.5 h-3.5" />, cls: 'bg-[#ede9fe] text-[#6d28d9]' },
  rejected: { label: 'Recusado',   icon: <XCircle className="w-3.5 h-3.5" />,      cls: 'bg-[#fdecec] text-[#b91c1c]' },
  cancelled:{ label: 'Cancelado',  icon: <XCircle className="w-3.5 h-3.5" />,      cls: 'bg-[#eef2f7] text-[#5b6b80]' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, currentUser, currentName, logout } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState<CalendarEntry[]>([]);
  const [closures, setClosures] = useState<GymClosure[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState<WeeklyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [rangeStart, setRangeStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  // Relógio que avança ao longo do dia, para ocultar horários já passados.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [bookingPrefill, setBookingPrefill] = useState<{ date?: string; time?: string; court?: string } | null>(null);
  const [showRecurring, setShowRecurring] = useState(false);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true); setError(null);
    Promise.all([getBookings(currentUser), getCalendarData()])
      .then(([userBookings, calData]) => {
        setBookings(userBookings);
        setBusy(calData.bookings);
        setClosures(calData.closures);
        setWeeklyEvents(calData.weeklyEvents);
      })
      .catch(() => setError('Falha ao carregar dados'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const board = useMemo(
    () => buildBoard({ date: selectedDate, slots: TIME_SLOTS, courts: COURTS, ownBookings: bookings, busy, weeklyEvents, closures, now }),
    [selectedDate, bookings, busy, weeklyEvents, closures, now],
  );

  const closedDays = useMemo(() => new Set(closures.map((c) => c.date)), [closures]);
  const trainingDows = useMemo(() => new Set(weeklyEvents.map((w) => w.dayOfWeek)), [weeklyEvents]);
  const myDays = useMemo(
    () => new Set(bookings.filter((b) => b.status === 'accepted' || b.status === 'pending').map((b) => b.date)),
    [bookings],
  );

  const myUpcoming = useMemo(() => {
    const today = toYMD(new Date());
    return bookings
      .filter((b) => b.status !== 'cancelled' && b.status !== 'rejected' && b.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [bookings]);

  if (!isAuthenticated) return null;

  const handleNewBooking = async (data: { date: string; time: string; court: string; equipment: string[]; players: string[]; playerCount: number }) => {
    const booking = await createBooking({ ...data, userEmail: currentUser, userName: currentName || currentUser });
    setBookings((prev) => [booking, ...prev]);
    setBookingPrefill(null);
    setToast(
      booking.status === 'waitlisted'
        ? 'Horário ocupado — você entrou na lista de espera e será avisado se vagar.'
        : 'Solicitação enviada! Aguarde a confirmação.',
    );
  };

  const handleRecurringBooking = async (data: { date: string; time: string; court: string; weeks: number; reason: string }) => {
    const { weeks, ...rest } = data;
    const { created, skipped } = await createRecurringBooking(
      { ...rest, equipment: [], players: [], userEmail: currentUser, userName: currentName || currentUser },
      weeks,
    );
    setBookings((prev) => [...created, ...prev]);
    setShowRecurring(false);
    const waitlisted = created.filter((b) => b.status === 'waitlisted').length;
    let msg = `Pedido de horário fixo enviado: ${created.length} data(s) solicitada(s).`;
    if (waitlisted > 0) msg += ` ${waitlisted} em lista de espera.`;
    if (skipped > 0) msg += ` ${skipped} data(s) indisponível(is) foram puladas.`;
    setToast(msg);
  };

  const handleCancelBooking = async (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b)));
    try { await cancelBooking(id); }
    catch { getBookings(currentUser).then(setBookings); }
  };

  const heroDate = formatDatePtBR(toYMD(selectedDate), { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen flex flex-col">
      <TopAppBar title="Agenda das Quadras" userName={currentName} userEmail={currentUser} onLogout={logout} />

      {/* ── Hero band ── */}
      <div className="bg-[var(--ink)] court-lines text-white px-4 sm:px-6 pt-5 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-300)]">
                Disponibilidade das quadras
              </p>
              <h1 className="font-display text-[26px] sm:text-[32px] font-bold capitalize leading-tight mt-1">
                {heroDate}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const t = new Date(); t.setHours(0,0,0,0); setSelectedDate(t); setRangeStart(t); }}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={() => setShowRecurring(true)}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1.5 transition-colors"
                title="Reservar o mesmo horário toda semana (requer justificativa)"
              >
                <Repeat className="w-4 h-4" /> Horário fixo
              </button>
              <button
                onClick={() => setBookingPrefill({})}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-[var(--brand)] hover:bg-[var(--brand-700)] flex items-center gap-1.5 shadow-[0_6px_18px_rgba(18,115,194,.45)] transition-colors"
              >
                <Plus className="w-4 h-4" /> Novo agendamento
              </button>
            </div>
          </div>

          <DayRail
            selected={selectedDate}
            onSelect={setSelectedDate}
            rangeStart={rangeStart}
            days={21}
            onShift={(d) => setRangeStart((prev) => { const n = new Date(prev); n.setDate(n.getDate() + d); return n; })}
            closedDays={closedDays}
            myDays={myDays}
            trainingDows={trainingDows}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[var(--muted)]">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> <span className="text-[14px]">Carregando…</span>
          </div>
        ) : error ? (
          <div className="bg-[#fdecec] text-[#b91c1c] rounded-2xl px-6 py-4 text-[14px]">{error}</div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
            <CourtBoard
              board={board}
              onBook={(court, time) => setBookingPrefill({ date: toYMD(selectedDate), time, court })}
              onOpenBooking={setDetailBooking}
            />

            {/* Right rail */}
            <aside className="space-y-4">
              <div className="rounded-3xl bg-white border border-[var(--line)] p-4 shadow-[0_1px_3px_rgba(10,22,38,.06)]">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarCheck2 className="w-4 h-4 text-[var(--brand)]" />
                  <h2 className="font-display text-[15px] font-semibold">Minhas reservas</h2>
                </div>

                {myUpcoming.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="mx-auto w-11 h-11 rounded-2xl bg-[var(--brand-tint)] grid place-items-center mb-2">
                      <CalendarCheck2 className="w-5 h-5 text-[var(--brand)]" />
                    </div>
                    <p className="text-[13px] text-[var(--muted)]">Nenhuma reserva futura.</p>
                    <button onClick={() => setBookingPrefill({})} className="mt-2 text-[13px] font-semibold text-[var(--brand)] hover:underline">
                      Fazer um agendamento
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myUpcoming.map((b) => {
                      const chip = STATUS_CHIP[b.status] ?? STATUS_CHIP.pending;
                      const col = courtColor(b.court, COURTS);
                      return (
                        <button
                          key={b.id}
                          onClick={() => setDetailBooking(b)}
                          className="w-full text-left rounded-2xl border border-[var(--line)] p-3 hover:border-[var(--brand-300)] hover:shadow-sm transition-all flex gap-3"
                        >
                          <span className="w-1.5 rounded-full shrink-0" style={{ background: col.dot }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-display text-[14px] font-semibold truncate">{b.court}</span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${chip.cls}`}>
                                {chip.icon} {chip.label}
                              </span>
                            </div>
                            <div className="text-[12px] text-[var(--muted)] mt-0.5">
                              {formatDatePtBR(b.date, { day: '2-digit', month: 'short' })} · {b.time}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="rounded-3xl bg-white border border-[var(--line)] p-4 shadow-[0_1px_3px_rgba(10,22,38,.06)]">
                <h2 className="font-display text-[13px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2.5">Legenda</h2>
                <div className="space-y-1.5 text-[12px] text-[var(--ink)]">
                  {[
                    { c: '#1273c2', l: 'Horário livre / sua reserva' },
                    { c: '#6d4bd8', l: 'Treino fixo semanal' },
                    { c: '#d97706', l: 'Solicitação pendente' },
                    { c: '#dc2626', l: 'Ginásio fechado' },
                  ].map((x) => (
                    <div key={x.l} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.c }} /> {x.l}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {bookingPrefill && (
        <BookingModal
          onClose={() => setBookingPrefill(null)}
          onSubmit={handleNewBooking}
          weeklyEvents={weeklyEvents}
          initialDate={bookingPrefill.date}
          initialTime={bookingPrefill.time}
          initialCourt={bookingPrefill.court}
        />
      )}

      {showRecurring && (
        <RecurringModal
          onClose={() => setShowRecurring(false)}
          onSubmit={handleRecurringBooking}
          weeklyEvents={weeklyEvents}
        />
      )}

      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
          onCancel={() => { handleCancelBooking(detailBooking.id); setDetailBooking(null); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] anim-pop">
          <div className="bg-[var(--ink)] text-white rounded-2xl px-4 py-3 text-[13px] shadow-[0_10px_30px_rgba(10,22,38,.35)] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[var(--brand-300)]" />
            <span className="flex-1">{toast}</span>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100"><XCircle className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-5 right-5 h-14 px-5 bg-[var(--ink)] text-white rounded-2xl shadow-[0_10px_30px_rgba(10,22,38,.35)] hover:bg-[var(--ink-soft)] transition-colors flex items-center gap-2 z-40"
          title="Falar com o suporte"
        >
          <MessageCircle className="w-5 h-5" /> <span className="text-[13px] font-semibold hidden sm:inline">Suporte</span>
        </button>
      )}

      {showChat && currentUser && (
        <ChatModal userName="Suporte" userEmail={currentUser} onClose={() => setShowChat(false)} senderRole="user" />
      )}
    </div>
  );
}
