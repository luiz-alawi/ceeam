'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LogOut, Shield, CheckCircle, XCircle, MessageSquare, Calendar,
  Clock, User, Trash2, Loader2, CalendarOff, Plus, X, Repeat,
} from 'lucide-react';
import ChatModal from '@/components/ChatModal';
import AdminCalendarTab from '@/components/AdminCalendarTab';
import AdminReportsTab from '@/components/AdminReportsTab';
import BookingDetailModal from '@/components/BookingDetailModal';
import { getRequests, updateRequestStatus } from '@/actions/requests';
import { getCalendarData } from '@/actions/calendar';
import { createClosure, deleteClosure } from '@/actions/closures';
import { createWeeklyEvent, deleteWeeklyEvent } from '@/actions/weeklyEvents';
import { getReportData } from '@/actions/reports';
import { formatDatePtBR, formatDateTimePtBR } from '@/utils/dateUtils';
import { COURTS, TIME_SLOTS } from '@/data/mockData';
import type { Request, GymClosure, WeeklyEvent } from '@/types';
import type { ReportData } from '@/actions/reports';

type Tab = 'gestao' | 'calendario' | 'relatorios';

const TABS: { key: Tab; label: string }[] = [
  { key: 'gestao',     label: 'Gestão'     },
  { key: 'calendario', label: 'Calendário' },
  { key: 'relatorios', label: 'Relatórios' },
];

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('gestao');
  const [requests, setRequests] = useState<Request[]>([]);
  const [closures, setClosures] = useState<GymClosure[]>([]);
  const [calendarBookings, setCalendarBookings] = useState<import('@/types').CalendarEntry[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState<WeeklyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<{ name: string; email: string } | null>(null);
  const [detailRequest, setDetailRequest] = useState<Request | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Closure form state
  const [closureDate, setClosureDate] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [savingClosure, setSavingClosure] = useState(false);

  // Weekly event form state
  const [weDay, setWeDay] = useState('');
  const [weTime, setWeTime] = useState('');
  const [weCourt, setWeCourt] = useState('');
  const [weTitle, setWeTitle] = useState('');
  const [savingWE, setSavingWE] = useState(false);

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

  const handleLogout = () => { logout(); };

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'relatorios' && !reportData) {
      setLoadingReports(true);
      try { setReportData(await getReportData()); }
      finally { setLoadingReports(false); }
    }
  };

  const updateStatus = async (id: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await updateRequestStatus(id, status);
    } catch {
      getRequests().then(setRequests);
    }
  };

  const handleCreateClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureDate || !closureReason.trim()) return;
    setSavingClosure(true);
    try {
      const newClosure = await createClosure(closureDate, closureReason.trim());
      setClosures((prev) => [...prev, newClosure].sort((a, b) => a.date.localeCompare(b.date)));
      setClosureDate('');
      setClosureReason('');
    } finally {
      setSavingClosure(false);
    }
  };

  const handleDeleteClosure = async (id: string) => {
    setClosures((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteClosure(id);
    } catch {
      getCalendarData().then((d) => setClosures(d.closures));
    }
  };

  const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  const handleCreateWeeklyEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weDay || !weTime || !weCourt || !weTitle.trim()) return;
    setSavingWE(true);
    try {
      const ev = await createWeeklyEvent({
        dayOfWeek: parseInt(weDay),
        time: weTime,
        court: weCourt,
        title: weTitle.trim(),
      });
      setWeeklyEvents((prev) =>
        [...prev, ev].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.time.localeCompare(b.time)),
      );
      setWeDay(''); setWeTime(''); setWeCourt(''); setWeTitle('');
    } finally {
      setSavingWE(false);
    }
  };

  const handleDeleteWeeklyEvent = async (id: string) => {
    setWeeklyEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteWeeklyEvent(id);
    } catch {
      getCalendarData().then((d) => setWeeklyEvents(d.weeklyEvents));
    }
  };

  const pendingRequests  = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');
  const historyRequests  = requests.filter((r) => r.status === 'rejected' || r.status === 'cancelled');

  const EquipmentChips = ({ items }: { items: string[] }) =>
    items.length > 0 ? (
      <div className="flex flex-wrap gap-1 mt-1">
        {items.map((eq) => (
          <span key={eq} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium">
            {eq}
          </span>
        ))}
      </div>
    ) : null;

  const PlayerChips = ({ items }: { items: string[] }) =>
    items.length > 0 ? (
      <div className="flex flex-wrap gap-1 mt-1">
        {items.map((p) => (
          <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-medium">
            {p}
          </span>
        ))}
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="h-8" />
            <div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-sm text-gray-900">Painel Administrativo</span>
              </div>
              <div className="text-xs text-gray-500">{currentUser}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-5">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-sm text-gray-500">Gerencie agendamentos, solicitações e fechamentos do ginásio</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">{error}</div>
        ) : (
          <>
            {/* Tab navigation */}
            <div className="flex border-b border-gray-200 mb-5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Gestão ── */}
            {activeTab === 'gestao' && (
              <div className="space-y-5">
                {/* Stats */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById('section-pending')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 text-left hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <div className="bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {pendingRequests.length}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Pendentes</div>
                      <div className="text-xs text-gray-500">Aguardando aprovação</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('section-active')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3 text-left hover:bg-green-100 transition-colors cursor-pointer"
                  >
                    <div className="bg-green-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {acceptedRequests.length}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Ativos</div>
                      <div className="text-xs text-gray-500">Quadras reservadas</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('section-closures')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3 text-left hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <div className="bg-orange-500 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {closures.length}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Dias Fechados</div>
                      <div className="text-xs text-gray-500">Eventos / manutenção</div>
                    </div>
                  </button>
                </div>

                {/* Fechar ginásio */}
                <div id="section-closures" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarOff className="w-4 h-4 text-orange-500" />
                    <h2 className="text-sm font-bold text-gray-900">Fechar Ginásio / Marcar Evento</h2>
                  </div>

                  <form onSubmit={handleCreateClosure} className="flex flex-wrap gap-2 mb-3">
                    <input
                      type="date"
                      value={closureDate}
                      onChange={(e) => setClosureDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={closureReason}
                      onChange={(e) => setClosureReason(e.target.value)}
                      placeholder="Motivo (ex: Evento de Formatura, Manutenção)"
                      required
                      className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={savingClosure}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60"
                    >
                      <Plus className="w-4 h-4" />
                      {savingClosure ? 'Salvando...' : 'Bloquear dia'}
                    </button>
                  </form>

                  {closures.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum dia bloqueado.</p>
                  ) : (
                    <div className="space-y-2">
                      {closures.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg">
                          <div className="text-sm">
                            <span className="font-semibold text-gray-800">
                              {formatDatePtBR(c.date, { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-gray-500 ml-2">— {c.reason}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteClosure(c.id)}
                            className="p-1.5 hover:bg-orange-200 rounded-lg transition-colors text-orange-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Horários fixos semanais */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Repeat className="w-4 h-4 text-purple-600" />
                    <h2 className="text-sm font-bold text-gray-900">Horários Fixos Semanais</h2>
                  </div>

                  <form onSubmit={handleCreateWeeklyEvent} className="flex flex-wrap gap-2 mb-3">
                    <select
                      value={weDay}
                      onChange={(e) => setWeDay(e.target.value)}
                      required
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    >
                      <option value="">Dia da semana</option>
                      {DAY_NAMES.map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={weCourt}
                      onChange={(e) => setWeCourt(e.target.value)}
                      required
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    >
                      <option value="">Quadra</option>
                      {COURTS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={weTime}
                      onChange={(e) => setWeTime(e.target.value)}
                      required
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    >
                      <option value="">Horário</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={weTitle}
                      onChange={(e) => setWeTitle(e.target.value)}
                      placeholder="Descrição (ex: Treino de vôlei misto)"
                      required
                      className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={savingWE}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
                    >
                      <Plus className="w-4 h-4" />
                      {savingWE ? 'Salvando...' : 'Adicionar'}
                    </button>
                  </form>

                  {weeklyEvents.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum horário fixo cadastrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {weeklyEvents.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-100 rounded-lg">
                          <div className="text-sm">
                            <span className="font-semibold text-gray-800">{DAY_NAMES[ev.dayOfWeek]}</span>
                            <span className="text-gray-500 mx-2">·</span>
                            <span className="text-gray-700">{ev.time}</span>
                            <span className="text-gray-500 mx-2">·</span>
                            <span className="text-gray-600">{ev.court}</span>
                            <span className="text-purple-700 ml-2 font-medium">— {ev.title}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteWeeklyEvent(ev.id)}
                            className="p-1.5 hover:bg-purple-200 rounded-lg transition-colors text-purple-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pendentes */}
                <div id="section-pending">
                  <h2 className="text-sm font-bold text-gray-900 mb-3">Solicitações Pendentes</h2>
                  <div className="space-y-2">
                    {pendingRequests.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Nenhuma solicitação pendente</p>
                      </div>
                    ) : (
                      pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => setDetailRequest(req)}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <User className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-bold text-gray-900 text-sm truncate">{req.userName}</span>
                              </div>
                              <div className="text-xs text-gray-500 ml-6">{req.userEmail}</div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 ml-0 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                  {formatDatePtBR(req.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                  {req.time}
                                </span>
                                <span className="font-medium text-gray-700">{req.court}</span>
                              </div>
                              {req.players.length > 0 && (
                                <div className="text-[11px] text-indigo-600 mt-1">
                                  {req.players.length} jogador{req.players.length > 1 ? 'es' : ''}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => updateStatus(req.id, 'accepted')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> Aceitar
                              </button>
                              <button onClick={() => updateStatus(req.id, 'rejected')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors">
                                <XCircle className="w-3.5 h-3.5" /> Recusar
                              </button>
                              <button onClick={() => setChatUser({ name: req.userName, email: req.userEmail })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                                <MessageSquare className="w-3.5 h-3.5" /> Chat
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Ativos */}
                {acceptedRequests.length > 0 && (
                  <div id="section-active">
                    <h2 className="text-sm font-bold text-gray-900 mb-3">Agendamentos Ativos</h2>
                    <div className="space-y-2">
                      {acceptedRequests.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => setDetailRequest(req)}
                          className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-4 cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <User className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-bold text-gray-900 text-sm truncate">{req.userName}</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium shrink-0">
                                  <CheckCircle className="w-3 h-3" /> Reservado
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-green-500" />
                                  {formatDatePtBR(req.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-green-500" />
                                  {req.time}
                                </span>
                                <span className="font-medium text-gray-700">{req.court}</span>
                              </div>
                              {req.players.length > 0 && (
                                <div className="text-[11px] text-indigo-600 mt-1">
                                  {req.players.length} jogador{req.players.length > 1 ? 'es' : ''}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => updateStatus(req.id, 'cancelled')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Cancelar
                              </button>
                              <button onClick={() => setChatUser({ name: req.userName, email: req.userEmail })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                                <MessageSquare className="w-3.5 h-3.5" /> Chat
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Histórico */}
                {historyRequests.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 mb-3">Histórico</h2>
                    <div className="space-y-1.5">
                      {historyRequests.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => setDetailRequest(req)}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 opacity-60 hover:opacity-90 cursor-pointer transition-opacity"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="font-bold text-gray-900 text-xs truncate">{req.userName}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 ml-5">
                                {formatDatePtBR(req.date, { day: '2-digit', month: 'short' })} · {req.time} · {req.court}
                              </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${
                              req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {req.status === 'rejected' ? 'Recusado' : 'Cancelado'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
              />
            )}

            {/* ── Relatórios ── */}
            {activeTab === 'relatorios' && (
              loadingReports ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm">Carregando relatórios...</span>
                </div>
              ) : reportData ? (
                <AdminReportsTab data={reportData} />
              ) : null
            )}
          </>
        )}
      </main>

      {chatUser && (
        <ChatModal
          userName={chatUser.name}
          userEmail={chatUser.email}
          onClose={() => setChatUser(null)}
        />
      )}

      {detailRequest && (
        <BookingDetailModal
          booking={{
            id: detailRequest.id,
            court: detailRequest.court,
            date: detailRequest.date,
            time: detailRequest.time,
            players: detailRequest.players,
            equipment: detailRequest.equipment,
            status: detailRequest.status,
            userName: detailRequest.userName,
            userEmail: detailRequest.userEmail,
            requestDate: detailRequest.requestDate,
          }}
          onClose={() => setDetailRequest(null)}
          onAccept={() => { updateStatus(detailRequest.id, 'accepted'); setDetailRequest(null); }}
          onReject={() => { updateStatus(detailRequest.id, 'rejected'); setDetailRequest(null); }}
          onAdminCancel={() => { updateStatus(detailRequest.id, 'cancelled'); setDetailRequest(null); }}
          onChat={() => {
            setChatUser({ name: detailRequest.userName, email: detailRequest.userEmail });
            setDetailRequest(null);
          }}
        />
      )}
    </div>
  );
}
