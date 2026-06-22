'use client';

import { useEffect, useState } from 'react';
import { Loader2, KeyRound, ShieldCheck, User, Copy, Check, History, X, CheckCircle2, XCircle } from 'lucide-react';
import { getUsers, adminResetPassword, getUserStats } from '@/actions/users';
import { formatDatePtBR } from '@/utils/dateUtils';
import type { AdminUser, UserStats, BookingStatus } from '@/types';

const card = 'bg-white rounded-2xl border border-[var(--line)] p-5';

const STATUS_META: Record<BookingStatus, { label: string; bg: string; tx: string }> = {
  pending:    { label: 'Pendente',        bg: '#fdf2e3', tx: '#b45309' },
  accepted:   { label: 'Aceito',          bg: '#e7f6ec', tx: '#1f7a44' },
  rejected:   { label: 'Negado',          bg: '#fdeaea', tx: '#c0392b' },
  cancelled:  { label: 'Cancelado',       bg: 'var(--paper)', tx: 'var(--muted)' },
  waitlisted: { label: 'Lista de espera', bg: '#eef0fb', tx: '#4f46e5' },
};

export default function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<{ user: AdminUser; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState('');
  const [historyFor, setHistoryFor] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  const openHistory = async (u: AdminUser) => {
    setHistoryFor(u);
    setStats(null);
    setLoadingStats(true);
    try {
      setStats(await getUserStats(u.email));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao carregar histórico');
      setHistoryFor(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleReset = async (u: AdminUser) => {
    if (!confirm(`Gerar uma nova senha temporária para ${u.name}?`)) return;
    setBusyId(u.id);
    try {
      const { tempPassword } = await adminResetPassword(u.id);
      setResult({ user: u, password: tempPassword });
      setCopied(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao redefinir senha');
    } finally {
      setBusyId(null);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard?.writeText(result.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--muted)]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> <span className="text-[14px]">Carregando…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou e-mail…"
        className="w-full sm:w-80 px-3.5 py-2 bg-white border border-[var(--line)] rounded-lg text-[14px] focus:outline-none focus:border-[var(--brand)]"
      />

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className={`${card} text-center text-[var(--muted)] text-[14px]`}>Nenhum usuário encontrado.</div>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-[var(--line)] p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[var(--paper)] grid place-items-center shrink-0">
                  {u.isAdmin ? <ShieldCheck className="w-4 h-4 text-[var(--brand)]" /> : <User className="w-4 h-4 text-[var(--muted)]" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--ink)] text-[14px] truncate">{u.name}</span>
                    {u.isAdmin && <span className="px-1.5 py-0.5 bg-[var(--brand-tint)] text-[var(--brand-700)] rounded text-[10px] font-bold uppercase">Admin</span>}
                  </div>
                  <div className="text-[12px] text-[var(--muted)] truncate">{u.email}</div>
                  <div className="text-[11px] text-[var(--muted)]">Desde {formatDatePtBR(u.createdAt.split('T')[0], { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openHistory(u)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] text-[var(--ink)] rounded-lg text-[12px] font-medium hover:bg-[var(--paper)] transition-colors">
                  <History className="w-3.5 h-3.5" />
                  Histórico
                </button>
                <button onClick={() => handleReset(u)} disabled={busyId === u.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] text-[var(--ink)] rounded-lg text-[12px] font-medium hover:bg-[var(--paper)] transition-colors disabled:opacity-60">
                  {busyId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  Redefinir senha
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {historyFor && (
        <div className="fixed inset-0 bg-[var(--ink)]/55 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setHistoryFor(null)}>
          <div className="anim-pop bg-white rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-display text-[18px] font-bold text-[var(--ink)] truncate">{historyFor.name}</h3>
                <p className="text-[12px] text-[var(--muted)] truncate">{historyFor.email}</p>
              </div>
              <button onClick={() => setHistoryFor(null)} className="p-1.5 hover:bg-[var(--paper)] rounded-lg text-[var(--muted)] shrink-0">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {loadingStats || !stats ? (
              <div className="flex items-center justify-center py-12 text-[var(--muted)]">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> <span className="text-[14px]">Carregando histórico…</span>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Resumo principal */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Agendamentos', value: stats.total, bg: '#fff', tx: 'var(--ink)' },
                    { label: 'Aceitos', value: stats.accepted, bg: '#e7f6ec', tx: '#1f7a44' },
                    { label: 'Negados', value: stats.rejected, bg: '#fdeaea', tx: '#c0392b' },
                    { label: 'Taxa aprovação', value: `${stats.acceptanceRate}%`, bg: '#e8f1fb', tx: 'var(--brand-700)' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-[var(--line)] p-3 text-center" style={{ background: s.bg }}>
                      <div className="text-[22px] font-bold" style={{ color: s.tx }}>{s.value}</div>
                      <div className="text-[11px] mt-0.5 text-[var(--muted)]">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Detalhamento por status */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Pendentes', value: stats.pending },
                    { label: 'Cancelados', value: stats.cancelled },
                    { label: 'Lista de espera', value: stats.waitlisted },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-[var(--line)] p-3 text-center">
                      <div className="text-[18px] font-bold text-[var(--ink)]">{s.value}</div>
                      <div className="text-[11px] mt-0.5 text-[var(--muted)]">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Presença */}
                <div>
                  <div className="text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Presença</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl border border-[var(--line)] p-3 text-center" style={{ background: '#e7f6ec' }}>
                      <div className="flex items-center justify-center gap-1 text-[18px] font-bold" style={{ color: '#1f7a44' }}>
                        <CheckCircle2 className="w-4 h-4" />{stats.attended}
                      </div>
                      <div className="text-[11px] mt-0.5 text-[var(--muted)]">Compareceu</div>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] p-3 text-center" style={{ background: '#fdeaea' }}>
                      <div className="flex items-center justify-center gap-1 text-[18px] font-bold" style={{ color: '#c0392b' }}>
                        <XCircle className="w-4 h-4" />{stats.absent}
                      </div>
                      <div className="text-[11px] mt-0.5 text-[var(--muted)]">Faltou</div>
                    </div>
                    <div className="rounded-xl border border-[var(--line)] p-3 text-center">
                      <div className="text-[18px] font-bold text-[var(--ink)]">{stats.noShowRate}%</div>
                      <div className="text-[11px] mt-0.5 text-[var(--muted)]">Taxa de falta</div>
                    </div>
                  </div>
                </div>

                {/* Histórico recente */}
                <div>
                  <div className="text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Agendamentos recentes</div>
                  {stats.recent.length === 0 ? (
                    <div className="text-[13px] text-[var(--muted)] text-center py-4">Nenhum agendamento registrado.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {stats.recent.map((b) => {
                        const meta = STATUS_META[b.status];
                        return (
                          <div key={b.id} className="flex items-center justify-between gap-3 bg-[var(--paper)] rounded-xl px-3.5 py-2.5">
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-[var(--ink)]">
                                {formatDatePtBR(b.date, { day: '2-digit', month: 'short' })} · {b.time}
                              </div>
                              <div className="text-[11px] text-[var(--muted)] truncate">{b.court}</div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {b.attended === true && <CheckCircle2 className="w-4 h-4 text-[#1f7a44]" />}
                              {b.attended === false && <XCircle className="w-4 h-4 text-[#c0392b]" />}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: meta.bg, color: meta.tx }}>
                                {meta.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 bg-[var(--ink)]/55 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setResult(null)}>
          <div className="anim-pop bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-tint)] grid place-items-center mb-3">
              <KeyRound className="w-6 h-6 text-[var(--brand)]" />
            </div>
            <h3 className="font-display text-[18px] font-bold text-[var(--ink)]">Senha temporária gerada</h3>
            <p className="text-[13px] text-[var(--muted)] mt-1 mb-4">
              Repasse a nova senha para <strong className="text-[var(--ink)]">{result.user.name}</strong>. Ela poderá entrar e trocá-la depois.
            </p>
            <div className="flex items-center gap-2 bg-[var(--paper)] rounded-xl px-4 py-3">
              <code className="flex-1 text-[18px] font-bold tracking-wider text-[var(--ink)]">{result.password}</code>
              <button onClick={copy} className="p-2 hover:bg-white rounded-lg transition-colors text-[var(--brand)]">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => setResult(null)} className="w-full mt-4 py-2.5 bg-[var(--brand)] text-white rounded-xl text-[14px] font-semibold hover:bg-[var(--brand-700)] transition-colors">
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
