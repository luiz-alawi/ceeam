'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  CheckCircle, XCircle, MessageSquare, Calendar, Clock, User,
  Trash2, Loader2, CalendarOff, Plus, X, Repeat, ListOrdered, UserCheck, UserX, MessageSquareText, Search,
} from 'lucide-react';
import TopAppBar from '@/components/agenda/TopAppBar';
import ChatModal from '@/components/ChatModal';
import AdminCalendarTab from '@/components/AdminCalendarTab';
import AdminReportsTab from '@/components/AdminReportsTab';
import AdminUsersTab from '@/components/AdminUsersTab';
import AdminAuditTab from '@/components/AdminAuditTab';
import AdminSettingsTab from '@/components/AdminSettingsTab';
import BookingDetailModal from '@/components/BookingDetailModal';
import { getRequests, updateRequestStatus, updateRecurringGroupStatus, setAttendance } from '@/actions/requests';
import { getCalendarData } from '@/actions/calendar';
import { createClosure, deleteClosure } from '@/actions/closures';
import { createWeeklyEvent, deleteWeeklyEvent } from '@/actions/weeklyEvents';
import { getReportData } from '@/actions/reports';
import { formatDatePtBR } from '@/utils/dateUtils';
import { toYMD, parseYMD } from '@/lib/calendar';
import { COURTS, TIME_SLOTS } from '@/data/mockData';
import type { Request, GymClosure, WeeklyEvent, CalendarEntry } from '@/types';
import type { ReportData } from '@/actions/reports';

type Tab = 'gestao' | 'calendario' | 'relatorios' | 'usuarios' | 'config' | 'auditoria';

const TABS: { key: Tab; label: string }[] = [
  { key: 'gestao', label: 'Gestão' },
  { key: 'calendario', label: 'Calendário' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'usuarios', label: 'Usuários' },
  { key: 'config', label: 'Regras' },
  { key: 'auditoria', label: 'Auditoria' },
];

const TAB_META: Record<Tab, { title: string; desc: string }> = {
  gestao: { title: 'Gestão de reservas', desc: 'Aprove solicitações e acompanhe os agendamentos' },
  calendario: { title: 'Calendário das quadras', desc: 'Visão geral da disponibilidade por dia' },
  relatorios: { title: 'Relatórios', desc: 'Indicadores de uso, presença e demanda' },
  usuarios: { title: 'Usuários', desc: 'Gerencie quem pode acessar o sistema' },
  config: { title: 'Regras de agendamento', desc: 'Limites, antecedência e lista de espera' },
  auditoria: { title: 'Auditoria', desc: 'Histórico das ações administrativas' },
};

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

/** Ordena por data e, em empate, por horário (mais próximo primeiro). */
const byDateTime = (a: { date: string; time: string }, b: { date: string; time: string }) =>
  a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

/** Diferença em dias entre `date` (YMD) e hoje. Negativo = no passado. */
function dayDiffFromToday(date: string): number {
  const target = parseYMD(date); target.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

/** Selo de urgência para datas próximas/atrasadas. Some quando a data está distante. */
function UrgencyChip({ date }: { date: string }) {
  const d = dayDiffFromToday(date);
  let label: string | null = null;
  let cls = '';
  if (d < 0) { label = 'Atrasado'; cls = 'bg-[#fdecec] text-[#b91c1c]'; }
  else if (d === 0) { label = 'Hoje'; cls = 'bg-[#fdecec] text-[#b91c1c]'; }
  else if (d === 1) { label = 'Amanhã'; cls = 'bg-[#fdf2e3] text-[#b45309]'; }
  else if (d <= 3) { label = `Em ${d} dias`; cls = 'bg-[#fdf2e3] text-[#b45309]'; }
  if (!label) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      <Clock className="w-3 h-3" /> {label}
    </span>
  );
}

/** Cabeçalho de seção padronizado, com contador opcional. */
function SectionTitle({ icon, children, count }: { icon?: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-[15px] font-semibold text-[var(--ink)]">{children}</h2>
      {typeof count === 'number' && count > 0 && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--paper)] text-[var(--muted)] text-[11px] font-bold">{count}</span>
      )}
    </div>
  );
}

/** Card de solicitação reutilizável: cabeçalho com usuário/urgência/data e slot de ações. */
function QueueCard({
  req, onOpen, badge, borderCls = 'border-[var(--line)]', accent = 'text-[var(--brand)]', children,
}: {
  req: Request;
  onOpen: () => void;
  badge?: React.ReactNode;
  borderCls?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div onClick={onOpen} className={`bg-white rounded-3xl border ${borderCls} p-4 cursor-pointer shadow-[0_1px_3px_rgba(10,22,38,.06)] hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <User className="w-4 h-4 text-[var(--muted)] shrink-0" />
            <span className="font-medium text-[var(--ink)] text-[14px] truncate">{req.userName}</span>
            {badge}
            <UrgencyChip date={req.date} />
          </div>
          <div className="text-[12px] text-[var(--muted)] ml-6">{req.userEmail}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[12px] text-[var(--muted)]">
            <span className="flex items-center gap-1"><Calendar className={`w-3.5 h-3.5 ${accent}`} />{formatDatePtBR(req.date, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Clock className={`w-3.5 h-3.5 ${accent}`} />{req.time}</span>
            <span className="font-medium text-[var(--ink)]">{req.court}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, currentUser, currentName, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('gestao');
  const [requests, setRequests] = useState<Request[]>([]);
  const [closures, setClosures] = useState<GymClosure[]>([]);
  const [calendarBookings, setCalendarBookings] = useState<CalendarEntry[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState<WeeklyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<{ name: string; email: string } | null>(null);
  const [detailRequest, setDetailRequest] = useState<Request | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  const [closureDate, setClosureDate] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [savingClosure, setSavingClosure] = useState(false);

  const [weDay, setWeDay] = useState('');
  const [weTime, setWeTime] = useState('');
  const [weCourt, setWeCourt] = useState('');
  const [weTitle, setWeTitle] = useState('');
  const [savingWE, setSavingWE] = useState(false);

  const [historyQuery, setHistoryQuery] = useState('');
  const [historyLimit, setHistoryLimit] = useState(5);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) { router.replace('/login'); return; }
  }, [isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    setLoading(true);
    setError(null);
    Promise.all([getRequests(), getCalendarData()])
      .then(([reqs, calData]) => {
        setRequests(reqs);
        setClosures(calData.closures);
        setCalendarBookings(calData.bookings);
        setWeeklyEvents(calData.weeklyEvents);
      })
      .catch(() => setError('Falha ao carregar dados'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated || !isAdmin) return null;

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'relatorios' && !reportData) {
      setLoadingReports(true);
      try { setReportData(await getReportData()); }
      finally { setLoadingReports(false); }
    }
  };

  const updateStatus = async (id: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    const prev = requests.find((r) => r.id === id);
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await updateRequestStatus(id, status);
    } catch (err) {
      if (prev) setRequests((list) => list.map((r) => (r.id === id ? { ...r, status: prev.status } : r)));
      alert(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  };

  const handleAttendance = async (id: string, attended: boolean | null) => {
    const prev = requests.find((r) => r.id === id);
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, attended } : r)));
    try {
      await setAttendance(id, attended);
    } catch (err) {
      if (prev) setRequests((list) => list.map((r) => (r.id === id ? { ...r, attended: prev.attended } : r)));
      alert(err instanceof Error ? err.message : 'Erro ao registrar presença');
    }
  };

  const handleCreateClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureDate || !closureReason.trim()) return;
    setSavingClosure(true);
    try {
      const newClosure = await createClosure(closureDate, closureReason.trim());
      setClosures((prev) => [...prev, newClosure].sort((a, b) => a.date.localeCompare(b.date)));
      setClosureDate(''); setClosureReason('');
    } finally {
      setSavingClosure(false);
    }
  };

  const handleDeleteClosure = async (id: string) => {
    setClosures((prev) => prev.filter((c) => c.id !== id));
    try { await deleteClosure(id); }
    catch { getCalendarData().then((d) => setClosures(d.closures)); }
  };

  const handleCreateWeeklyEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weDay || !weTime || !weCourt || !weTitle.trim()) return;
    setSavingWE(true);
    try {
      const ev = await createWeeklyEvent({
        dayOfWeek: parseInt(weDay), time: weTime, court: weCourt, title: weTitle.trim(),
      });
      setWeeklyEvents((prev) =>
        [...prev, ev].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.time.localeCompare(b.time)));
      setWeDay(''); setWeTime(''); setWeCourt(''); setWeTitle('');
    } finally {
      setSavingWE(false);
    }
  };

  const handleDeleteWeeklyEvent = async (id: string) => {
    setWeeklyEvents((prev) => prev.filter((e) => e.id !== id));
    try { await deleteWeeklyEvent(id); }
    catch { getCalendarData().then((d) => setWeeklyEvents(d.weeklyEvents)); }
  };

  // Pedidos avulsos (não recorrentes), ordenados por proximidade da data (mais perto primeiro)
  const pendingRequests = requests.filter((r) => r.status === 'pending' && !r.recurringGroupId).sort(byDateTime);
  const acceptedRequests = requests.filter((r) => r.status === 'accepted').sort(byDateTime);
  const waitlistedRequests = requests.filter((r) => r.status === 'waitlisted' && !r.recurringGroupId).sort(byDateTime);
  // Histórico: mais recente primeiro
  const historyRequests = requests.filter((r) => r.status === 'rejected' || r.status === 'cancelled').sort((a, b) => byDateTime(b, a));
  const historyQ = historyQuery.trim().toLowerCase();
  const filteredHistory = historyQ
    ? historyRequests.filter((r) => r.userName.toLowerCase().includes(historyQ) || r.userEmail.toLowerCase().includes(historyQ))
    : historyRequests;
  const visibleHistory = filteredHistory.slice(0, historyLimit);

  // Pedidos de horário fixo agrupados por recurringGroupId (apenas os ainda em aberto)
  const recurringGroups = (() => {
    const map = new Map<string, { groupId: string; reason: string | null; userName: string; userEmail: string; time: string; court: string; items: Request[] }>();
    for (const r of requests) {
      if (!r.recurringGroupId) continue;
      if (r.status !== 'pending' && r.status !== 'waitlisted') continue;
      const g = map.get(r.recurringGroupId);
      if (g) g.items.push(r);
      else map.set(r.recurringGroupId, { groupId: r.recurringGroupId, reason: r.reason ?? null, userName: r.userName, userEmail: r.userEmail, time: r.time, court: r.court, items: [r] });
    }
    return [...map.values()]
      .map((g) => ({ ...g, items: g.items.sort((a, b) => a.date.localeCompare(b.date)) }))
      .sort((a, b) => a.items[0].date.localeCompare(b.items[0].date));
  })();

  const handleGroupStatus = async (groupId: string, items: Request[], status: 'accepted' | 'rejected') => {
    const ids = new Set(items.map((i) => i.id));
    setRequests((list) => list.map((r) => (ids.has(r.id) ? { ...r, status } : r)));
    try {
      await updateRecurringGroupStatus(groupId, status);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar pedido');
    }
    // Ressincroniza (datas com conflito podem ter sido puladas).
    getRequests().then(setRequests).catch(() => {});
  };

  const fieldCls =
    'px-3.5 py-2 bg-[var(--paper)] border border-transparent rounded-lg text-[14px] text-[var(--ink)] focus:outline-none focus:bg-white focus:border-[var(--brand)] transition';

  const card = 'bg-white rounded-3xl border border-[var(--line)] p-5 shadow-[0_1px_3px_rgba(10,22,38,.06)]';

  const heroDate = formatDatePtBR(toYMD(new Date()), { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)]">
      <TopAppBar title="Painel" subtitle={currentName} userName={currentName} userEmail={currentUser} onLogout={logout} badge="admin" />

      {/* ── Hero band ── */}
      <div className="bg-[var(--ink)] court-lines text-white px-4 sm:px-6 pt-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-300)]">
                Painel administrativo
              </p>
              <h1 className="font-display text-[26px] sm:text-[32px] font-bold leading-tight mt-1">
                {TAB_META[activeTab].title}
              </h1>
              <p className="text-[13px] text-white/70 mt-1">{TAB_META[activeTab].desc}</p>
            </div>
            <p className="text-[13px] text-white/60 capitalize hidden sm:block">{heroDate}</p>
          </div>

          {/* Tabs (pílulas) */}
          <nav className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`shrink-0 px-4 py-2.5 rounded-t-xl text-[13px] font-semibold transition-colors ${
                    active
                      ? 'bg-[var(--paper)] text-[var(--ink)]'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--muted)]">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-[14px]">Carregando…</span>
          </div>
        ) : error ? (
          <div className="bg-[#fdecec] text-[#b91c1c] rounded-2xl p-6 text-center">{error}</div>
        ) : (
          <>
            {/* ── Gestão ── */}
            {activeTab === 'gestao' && (
              <div className="anim-rise space-y-8">
                {/* Resumo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'section-pending', n: pendingRequests.length, label: 'Pendentes', sub: 'Aguardando aprovação', bg: '#fdf2e3', tx: '#b45309' },
                    { id: 'section-waitlist', n: waitlistedRequests.length, label: 'Lista de espera', sub: 'Aguardando vaga', bg: '#ede9fe', tx: '#6d28d9' },
                    { id: 'section-active', n: acceptedRequests.length, label: 'Ativos', sub: 'Quadras reservadas', bg: '#e7f6ec', tx: '#1f7a44' },
                    { id: 'section-closures', n: closures.length, label: 'Dias fechados', sub: 'Eventos / manutenção', bg: '#fdecec', tx: '#b91c1c' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="rounded-3xl border border-[var(--line)] p-4 flex items-center gap-3 text-left shadow-[0_1px_3px_rgba(10,22,38,.06)] hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[16px] shrink-0" style={{ background: s.bg, color: s.tx }}>
                        {s.n}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--ink)] text-[14px]">{s.label}</div>
                        <div className="text-[12px] text-[var(--muted)] truncate">{s.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* ════ Solicitações (precisam de ação), ordenadas por urgência ════ */}

                {/* Pedidos de horário fixo (recorrentes) */}
                {recurringGroups.length > 0 && (
                  <section id="section-recurring">
                    <SectionTitle icon={<Repeat className="w-4 h-4 text-[#6d28d9]" />} count={recurringGroups.length}>
                      Pedidos de horário fixo
                    </SectionTitle>
                    <div className="space-y-2">
                      {recurringGroups.map((g) => {
                        const weekday = DAY_NAMES[new Date(g.items[0].date + 'T12:00:00').getDay()];
                        const first = g.items[0].date;
                        const last = g.items[g.items.length - 1].date;
                        return (
                          <div key={g.groupId} onClick={() => setDetailRequest(g.items[0])}
                            className="bg-white rounded-3xl border border-[#ddd6fe] p-4 cursor-pointer shadow-[0_1px_3px_rgba(10,22,38,.06)] hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <User className="w-4 h-4 text-[var(--muted)] shrink-0" />
                                  <span className="font-medium text-[var(--ink)] text-[14px] truncate">{g.userName}</span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ede9fe] text-[#6d28d9] rounded-full text-[10px] font-medium"><Repeat className="w-3 h-3" /> {g.items.length} datas</span>
                                  <UrgencyChip date={first} />
                                </div>
                                <div className="text-[12px] text-[var(--muted)] ml-6">{g.userEmail}</div>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[12px] text-[var(--muted)]">
                                  <span className="flex items-center gap-1"><Repeat className="w-3.5 h-3.5 text-[#6d28d9]" />Toda {weekday}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#6d28d9]" />{g.time}</span>
                                  <span className="font-medium text-[var(--ink)]">{g.court}</span>
                                  <span>{formatDatePtBR(first, { day: '2-digit', month: 'short' })} → {formatDatePtBR(last, { day: '2-digit', month: 'short' })}</span>
                                </div>
                                {g.reason && (
                                  <div className="mt-2 bg-[#f5f3ff] border border-[#ede9fe] rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#6d28d9] mb-0.5">
                                      <MessageSquareText className="w-3 h-3" /> Motivo
                                    </div>
                                    <p className="text-[12px] text-[var(--ink)] leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {g.reason}
                                    </p>
                                    <span className="text-[11px] text-[#6d28d9] font-medium">Clique para ver tudo →</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleGroupStatus(g.groupId, g.items, 'accepted')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f7a44] text-white rounded-lg text-[12px] font-medium hover:bg-[#196437] transition-colors"><CheckCircle className="w-3.5 h-3.5" /> Aceitar todos</button>
                                <button onClick={() => handleGroupStatus(g.groupId, g.items, 'rejected')} className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] text-[var(--ink)] rounded-lg text-[12px] font-medium hover:bg-[var(--paper)] transition-colors"><XCircle className="w-3.5 h-3.5" /> Recusar todos</button>
                                <button onClick={() => setChatUser({ name: g.userName, email: g.userEmail })} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand)] text-white rounded-lg text-[12px] font-medium hover:bg-[var(--brand-700)] transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Chat</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Pendentes */}
                <section id="section-pending">
                  <SectionTitle icon={<Clock className="w-4 h-4 text-[#b45309]" />} count={pendingRequests.length}>
                    Solicitações pendentes
                  </SectionTitle>
                  <div className="space-y-2">
                    {pendingRequests.length === 0 ? (
                      <div className={`${card} text-center`}>
                        <CheckCircle className="w-10 h-10 text-[#1f7a44] mx-auto mb-2" />
                        <p className="text-[14px] text-[var(--muted)]">Nenhuma solicitação pendente</p>
                      </div>
                    ) : (
                      pendingRequests.map((req) => (
                        <QueueCard key={req.id} req={req} onOpen={() => setDetailRequest(req)}>
                          <button onClick={() => updateStatus(req.id, 'accepted')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f7a44] text-white rounded-lg text-[12px] font-medium hover:bg-[#196437] transition-colors"><CheckCircle className="w-3.5 h-3.5" /> Aceitar</button>
                          <button onClick={() => updateStatus(req.id, 'rejected')} className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] text-[var(--ink)] rounded-lg text-[12px] font-medium hover:bg-[var(--paper)] transition-colors"><XCircle className="w-3.5 h-3.5" /> Recusar</button>
                          <button onClick={() => setChatUser({ name: req.userName, email: req.userEmail })} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand)] text-white rounded-lg text-[12px] font-medium hover:bg-[var(--brand-700)] transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Chat</button>
                        </QueueCard>
                      ))
                    )}
                  </div>
                </section>

                {/* Lista de espera */}
                {waitlistedRequests.length > 0 && (
                  <section id="section-waitlist">
                    <SectionTitle icon={<ListOrdered className="w-4 h-4 text-[#6d28d9]" />} count={waitlistedRequests.length}>
                      Lista de espera
                    </SectionTitle>
                    <div className="space-y-2">
                      {waitlistedRequests.map((req) => (
                        <QueueCard
                          key={req.id} req={req} onOpen={() => setDetailRequest(req)}
                          borderCls="border-[#ddd6fe]" accent="text-[#6d28d9]"
                          badge={<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ede9fe] text-[#6d28d9] rounded-full text-[10px] font-medium"><ListOrdered className="w-3 h-3" /> Aguardando vaga</span>}
                        >
                          <button onClick={() => updateStatus(req.id, 'accepted')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f7a44] text-white rounded-lg text-[12px] font-medium hover:bg-[#196437] transition-colors"><CheckCircle className="w-3.5 h-3.5" /> Aceitar</button>
                          <button onClick={() => updateStatus(req.id, 'rejected')} className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] text-[var(--ink)] rounded-lg text-[12px] font-medium hover:bg-[var(--paper)] transition-colors"><XCircle className="w-3.5 h-3.5" /> Recusar</button>
                        </QueueCard>
                      ))}
                    </div>
                  </section>
                )}

                {/* Ativos */}
                {acceptedRequests.length > 0 && (
                  <section id="section-active">
                    <SectionTitle icon={<CheckCircle className="w-4 h-4 text-[#1f7a44]" />} count={acceptedRequests.length}>
                      Agendamentos ativos
                    </SectionTitle>
                    <div className="space-y-2">
                      {acceptedRequests.map((req) => (
                        <QueueCard
                          key={req.id} req={req} onOpen={() => setDetailRequest(req)}
                          borderCls="border-2 border-[#bfe6cd]" accent="text-[#1f7a44]"
                          badge={<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e7f6ec] text-[#1f7a44] rounded-full text-[10px] font-medium"><CheckCircle className="w-3 h-3" /> Reservado</span>}
                        >
                          <div className="flex gap-1.5">
                            <button onClick={() => handleAttendance(req.id, req.attended === true ? null : true)} title="Compareceu"
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${req.attended === true ? 'bg-[#1f7a44] text-white' : 'border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--paper)]'}`}>
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAttendance(req.id, req.attended === false ? null : false)} title="Faltou"
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${req.attended === false ? 'bg-[#dc2626] text-white' : 'border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--paper)]'}`}>
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button onClick={() => updateStatus(req.id, 'cancelled')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#dc2626] text-white rounded-lg text-[12px] font-medium hover:bg-[#b91c1c] transition-colors"><Trash2 className="w-3.5 h-3.5" /> Cancelar</button>
                          <button onClick={() => setChatUser({ name: req.userName, email: req.userEmail })} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand)] text-white rounded-lg text-[12px] font-medium hover:bg-[var(--brand-700)] transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Chat</button>
                        </QueueCard>
                      ))}
                    </div>
                  </section>
                )}

                {/* ════ Configuração do ginásio ════ */}
                <section className="border-t border-[var(--line)] pt-6">
                  <SectionTitle>Configuração do ginásio</SectionTitle>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Fechar ginásio */}
                    <div id="section-closures" className={card}>
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarOff className="w-4 h-4 text-[#dc2626]" />
                        <h3 className="text-[15px] font-medium text-[var(--ink)]">Fechar ginásio / marcar evento</h3>
                      </div>
                      <form onSubmit={handleCreateClosure} className="flex flex-wrap gap-2 mb-4">
                        <input type="date" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} min={toYMD(new Date())} required className={fieldCls} />
                        <input type="text" value={closureReason} onChange={(e) => setClosureReason(e.target.value)} placeholder="Motivo (ex: Formatura, Manutenção)" required className={`${fieldCls} flex-1 min-w-48`} />
                        <button type="submit" disabled={savingClosure} className="flex items-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg text-[14px] font-medium hover:bg-[#b91c1c] transition-colors disabled:opacity-60">
                          <Plus className="w-4 h-4" /> {savingClosure ? 'Salvando…' : 'Bloquear dia'}
                        </button>
                      </form>
                      {closures.length === 0 ? (
                        <p className="text-[13px] text-[var(--muted)]">Nenhum dia bloqueado.</p>
                      ) : (
                        <div className="space-y-2">
                          {closures.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-[#fdecec] rounded-lg">
                              <div className="text-[13px]">
                                <span className="font-medium text-[var(--ink)]">{formatDatePtBR(c.date, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                <span className="text-[var(--muted)] ml-2">— {c.reason}</span>
                              </div>
                              <button onClick={() => handleDeleteClosure(c.id)} className="p-1.5 hover:bg-[#f7c9c4] rounded-full text-[#b91c1c]">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Horários fixos */}
                    <div className={card}>
                      <div className="flex items-center gap-2 mb-4">
                        <Repeat className="w-4 h-4 text-[#475569]" />
                        <h3 className="text-[15px] font-medium text-[var(--ink)]">Horários fixos semanais</h3>
                      </div>
                      <form onSubmit={handleCreateWeeklyEvent} className="flex flex-wrap gap-2 mb-4">
                        <select value={weDay} onChange={(e) => setWeDay(e.target.value)} required className={fieldCls}>
                          <option value="">Dia da semana</option>
                          {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                        <select value={weCourt} onChange={(e) => setWeCourt(e.target.value)} required className={fieldCls}>
                          <option value="">Quadra</option>
                          {COURTS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={weTime} onChange={(e) => setWeTime(e.target.value)} required className={fieldCls}>
                          <option value="">Horário</option>
                          {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="text" value={weTitle} onChange={(e) => setWeTitle(e.target.value)} placeholder="Descrição (ex: Treino de vôlei)" required className={`${fieldCls} flex-1 min-w-48`} />
                        <button type="submit" disabled={savingWE} className="flex items-center gap-2 px-4 py-2 bg-[#475569] text-white rounded-lg text-[14px] font-medium hover:bg-[#334155] transition-colors disabled:opacity-60">
                          <Plus className="w-4 h-4" /> {savingWE ? 'Salvando…' : 'Adicionar'}
                        </button>
                      </form>
                      {weeklyEvents.length === 0 ? (
                        <p className="text-[13px] text-[var(--muted)]">Nenhum horário fixo cadastrado.</p>
                      ) : (
                        <div className="space-y-2">
                          {weeklyEvents.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between p-3 bg-[#eef2f7] rounded-lg">
                              <div className="text-[13px]">
                                <span className="font-medium text-[var(--ink)]">{DAY_NAMES[ev.dayOfWeek]}</span>
                                <span className="text-[var(--muted)] mx-2">·</span><span className="text-[var(--ink)]">{ev.time}</span>
                                <span className="text-[var(--muted)] mx-2">·</span><span className="text-[var(--muted)]">{ev.court}</span>
                                <span className="text-[#334155] ml-2 font-medium">— {ev.title}</span>
                              </div>
                              <button onClick={() => handleDeleteWeeklyEvent(ev.id)} className="p-1.5 hover:bg-[#dde4ec] rounded-full text-[#334155]">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Histórico */}
                {historyRequests.length > 0 && (
                  <section className="border-t border-[var(--line)] pt-6">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <SectionTitle count={historyRequests.length}>Histórico</SectionTitle>
                      <div className="flex items-center gap-2 w-full sm:w-64 px-3.5 bg-[var(--paper)] border border-transparent rounded-lg focus-within:bg-white focus-within:border-[var(--brand)] transition-colors">
                        <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
                        <input
                          type="text" value={historyQuery}
                          onChange={(e) => { setHistoryQuery(e.target.value); setHistoryLimit(5); }}
                          placeholder="Buscar por usuário…"
                          className="flex-1 min-w-0 bg-transparent py-2 text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
                        />
                      </div>
                    </div>
                    {filteredHistory.length === 0 ? (
                      <p className="text-[13px] text-[var(--muted)]">Nenhum resultado para “{historyQuery}”.</p>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          {visibleHistory.map((req) => (
                            <div key={req.id} onClick={() => setDetailRequest(req)} className="bg-white rounded-2xl border border-[var(--line)] p-3 opacity-70 hover:opacity-100 cursor-pointer transition-opacity">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                                    <span className="font-medium text-[var(--ink)] text-[13px] truncate">{req.userName}</span>
                                  </div>
                                  <div className="text-[12px] text-[var(--muted)] mt-0.5 ml-5">{formatDatePtBR(req.date, { day: '2-digit', month: 'short' })} · {req.time} · {req.court}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => updateStatus(req.id, 'accepted')} className="flex items-center gap-1 px-2 py-1 bg-[#1f7a44] text-white rounded-lg text-[12px] font-medium hover:bg-[#196437]" title="Aceitar pedido"><CheckCircle className="w-3.5 h-3.5" /></button>
                                  <span className={`px-2.5 py-1 rounded-lg text-[12px] font-medium ${req.status === 'rejected' ? 'bg-[#fdecec] text-[#b91c1c]' : 'bg-[var(--paper)] text-[var(--muted)]'}`}>
                                    {req.status === 'rejected' ? 'Recusado' : 'Cancelado'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {visibleHistory.length < filteredHistory.length && (
                          <button
                            onClick={() => setHistoryLimit((n) => n + 5)}
                            className="mt-3 w-full py-2.5 rounded-2xl border border-[var(--line)] bg-white text-[13px] font-semibold text-[var(--ink)] hover:bg-[var(--paper)] transition-colors"
                          >
                            Carregar mais ({filteredHistory.length - visibleHistory.length} restantes)
                          </button>
                        )}
                      </>
                    )}
                  </section>
                )}
              </div>
            )}

            {/* ── Calendário ── */}
            {activeTab === 'calendario' && (
              <AdminCalendarTab
                calendarBookings={calendarBookings}
                closures={closures}
                weeklyEvents={weeklyEvents}
                requests={requests}
                onUpdateStatus={updateStatus}
                onChat={setChatUser}
              />
            )}

            {/* ── Relatórios ── */}
            {activeTab === 'relatorios' && (
              loadingReports ? (
                <div className="flex items-center justify-center py-16 text-[var(--muted)]">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-[14px]">Carregando relatórios…</span>
                </div>
              ) : reportData ? <AdminReportsTab data={reportData} /> : null
            )}

            {/* ── Usuários ── */}
            {activeTab === 'usuarios' && <AdminUsersTab />}

            {/* ── Regras ── */}
            {activeTab === 'config' && <AdminSettingsTab />}

            {/* ── Auditoria ── */}
            {activeTab === 'auditoria' && <AdminAuditTab />}
          </>
        )}
      </main>

      {chatUser && <ChatModal userName={chatUser.name} userEmail={chatUser.email} onClose={() => setChatUser(null)} />}

      {detailRequest && (
        <BookingDetailModal
          booking={{
            id: detailRequest.id, court: detailRequest.court, date: detailRequest.date, time: detailRequest.time,
            players: detailRequest.players, equipment: detailRequest.equipment, status: detailRequest.status,
            userName: detailRequest.userName, userEmail: detailRequest.userEmail, requestDate: detailRequest.requestDate,
            recurringGroupId: detailRequest.recurringGroupId, reason: detailRequest.reason,
          }}
          onClose={() => setDetailRequest(null)}
          onAccept={() => { updateStatus(detailRequest.id, 'accepted'); setDetailRequest(null); }}
          onReject={() => { updateStatus(detailRequest.id, 'rejected'); setDetailRequest(null); }}
          onRestore={() => { updateStatus(detailRequest.id, 'accepted'); setDetailRequest(null); }}
          onAdminCancel={() => { updateStatus(detailRequest.id, 'cancelled'); setDetailRequest(null); }}
          onChat={() => { setChatUser({ name: detailRequest.userName, email: detailRequest.userEmail }); setDetailRequest(null); }}
        />
      )}
    </div>
  );
}
