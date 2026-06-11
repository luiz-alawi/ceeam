'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  CheckCircle, XCircle, MessageSquare, Calendar, Clock, User,
  Trash2, Loader2, CalendarOff, Plus, X, Repeat,
} from 'lucide-react';
import TopAppBar from '@/components/agenda/TopAppBar';
import ChatModal from '@/components/ChatModal';
import AdminCalendarTab from '@/components/AdminCalendarTab';
import AdminReportsTab from '@/components/AdminReportsTab';
import BookingDetailModal from '@/components/BookingDetailModal';
import { getRequests, updateRequestStatus } from '@/actions/requests';
import { getCalendarData } from '@/actions/calendar';
import { createClosure, deleteClosure } from '@/actions/closures';
import { createWeeklyEvent, deleteWeeklyEvent } from '@/actions/weeklyEvents';
import { getReportData } from '@/actions/reports';
import { formatDatePtBR } from '@/utils/dateUtils';
import { COURTS, TIME_SLOTS } from '@/data/mockData';
import type { Request, GymClosure, WeeklyEvent, CalendarEntry } from '@/types';
import type { ReportData } from '@/actions/reports';

type Tab = 'gestao' | 'calendario' | 'relatorios';

const TABS: { key: Tab; label: string }[] = [
  { key: 'gestao', label: 'Gestão' },
  { key: 'calendario', label: 'Calendário' },
  { key: 'relatorios', label: 'Relatórios' },
];

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, currentUser, logout } = useAuth();

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

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');
  const historyRequests = requests.filter((r) => r.status === 'rejected' || r.status === 'cancelled');

  const fieldCls =
    'px-3.5 py-2 bg-[var(--paper)] border border-transparent rounded-lg text-[14px] text-[var(--ink)] focus:outline-none focus:bg-white focus:border-[var(--brand)] transition';

  const card = 'bg-white rounded-2xl border border-[var(--line)] p-5';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)]">
      <TopAppBar title="Painel" subtitle={currentUser} userEmail={currentUser} onLogout={logout} badge="admin" />

      <main className="flex-1 w-full max-w-6xl mx-auto px-5 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--muted)]">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-[14px]">Carregando…</span>
          </div>
        ) : error ? (
          <div className="bg-[#fdecec] text-[#b91c1c] rounded-xl p-6 text-center">{error}</div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-[var(--line)] mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-5 py-3 text-[14px] font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key
                      ? 'border-[var(--brand)] text-[var(--brand)]'
                      : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
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
                  {[
                    { id: 'section-pending', n: pendingRequests.length, label: 'Pendentes', sub: 'Aguardando aprovação', dot: '#d97706', bg: '#fdf2e3', tx: '#b45309' },
                    { id: 'section-active', n: acceptedRequests.length, label: 'Ativos', sub: 'Quadras reservadas', dot: '#1f7a44', bg: '#e7f6ec', tx: '#1f7a44' },
                    { id: 'section-closures', n: closures.length, label: 'Dias fechados', sub: 'Eventos / manutenção', dot: '#dc2626', bg: '#fdecec', tx: '#b91c1c' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="rounded-2xl border border-[var(--line)] p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[16px] shrink-0" style={{ background: s.bg, color: s.tx }}>
                        {s.n}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--ink)] text-[14px]">{s.label}</div>
                        <div className="text-[12px] text-[var(--muted)]">{s.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Fechar ginásio */}
                <div id="section-closures" className={card}>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarOff className="w-4 h-4 text-[#dc2626]" />
                    <h2 className="text-[15px] font-medium text-[var(--ink)]">Fechar ginásio / marcar evento</h2>
                  </div>
                  <form onSubmit={handleCreateClosure} className="flex flex-wrap gap-2 mb-4">
                    <input type="date" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required className={fieldCls} />
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
                    <h2 className="text-[15px] font-medium text-[var(--ink)]">Horários fixos semanais</h2>
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

                {/* Pendentes */}
                <div id="section-pending">
                  <h2 className="text-[15px] font-medium text-[var(--ink)] mb-3">Solicitações pendentes</h2>
                  <div className="space-y-2">
                    {pendingRequests.length === 0 ? (
                      <div className={`${card} text-center`}>
                        <CheckCircle className="w-10 h-10 text-[#1f7a44] mx-auto mb-2" />
                        <p className="text-[14px] text-[var(--muted)]">Nenhuma solicitação pendente</p>
                      </div>
                    ) : (
                      pendingRequests.map((req) => (
                        <div key={req.id} onClick={() => setDetailRequest(req)} className="bg-white rounded-2xl border border-[var(--line)] p-4 cursor-pointer hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <User className="w-4 h-4 text-[var(--muted)] shrink-0" />
                                <span className="font-medium text-[var(--ink)] text-[14px] truncate">{req.userName}</span>
                              </div>
                              <div className="text-[12px] text-[var(--muted)] ml-6">{req.userEmail}</div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[12px] text-[var(--muted)]">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[var(--brand)]" />{formatDatePtBR(req.date, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--brand)]" />{req.time}</span>
                                <span className="font-medium text-[var(--ink)]">{req.court}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => updateStatus(req.id, 'accepted')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f7a44] text-white rounded-lg text-[12px] font-medium hover:bg-[#196437] transition-colors"><CheckCircle className="w-3.5 h-3.5" /> Aceitar</button>
                              <button onClick={() => updateStatus(req.id, 'rejected')} className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] text-[var(--ink)] rounded-lg text-[12px] font-medium hover:bg-[var(--paper)] transition-colors"><XCircle className="w-3.5 h-3.5" /> Recusar</button>
                              <button onClick={() => setChatUser({ name: req.userName, email: req.userEmail })} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand)] text-white rounded-lg text-[12px] font-medium hover:bg-[var(--brand-700)] transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Chat</button>
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
                    <h2 className="text-[15px] font-medium text-[var(--ink)] mb-3">Agendamentos ativos</h2>
                    <div className="space-y-2">
                      {acceptedRequests.map((req) => (
                        <div key={req.id} onClick={() => setDetailRequest(req)} className="bg-white rounded-2xl border-2 border-[#bfe6cd] p-4 cursor-pointer hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <User className="w-4 h-4 text-[var(--muted)] shrink-0" />
                                <span className="font-medium text-[var(--ink)] text-[14px] truncate">{req.userName}</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e7f6ec] text-[#1f7a44] rounded-full text-[10px] font-medium"><CheckCircle className="w-3 h-3" /> Reservado</span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[12px] text-[var(--muted)]">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#1f7a44]" />{formatDatePtBR(req.date, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#1f7a44]" />{req.time}</span>
                                <span className="font-medium text-[var(--ink)]">{req.court}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => updateStatus(req.id, 'cancelled')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#dc2626] text-white rounded-lg text-[12px] font-medium hover:bg-[#b91c1c] transition-colors"><Trash2 className="w-3.5 h-3.5" /> Cancelar</button>
                              <button onClick={() => setChatUser({ name: req.userName, email: req.userEmail })} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand)] text-white rounded-lg text-[12px] font-medium hover:bg-[var(--brand-700)] transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Chat</button>
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
                    <h2 className="text-[15px] font-medium text-[var(--ink)] mb-3">Histórico</h2>
                    <div className="space-y-1.5">
                      {historyRequests.map((req) => (
                        <div key={req.id} onClick={() => setDetailRequest(req)} className="bg-white rounded-xl border border-[var(--line)] p-3 opacity-70 hover:opacity-100 cursor-pointer transition-opacity">
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
