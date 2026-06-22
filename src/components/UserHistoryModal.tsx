'use client';

import { useEffect, useState } from 'react';
import { Loader2, X, CheckCircle2, XCircle } from 'lucide-react';
import { getUserStats } from '@/actions/users';
import { formatDatePtBR } from '@/utils/dateUtils';
import type { UserStats, BookingStatus } from '@/types';

const STATUS_META: Record<BookingStatus, { label: string; bg: string; tx: string }> = {
  pending:    { label: 'Pendente',        bg: '#fdf2e3', tx: '#b45309' },
  accepted:   { label: 'Aceito',          bg: '#e7f6ec', tx: '#1f7a44' },
  rejected:   { label: 'Negado',          bg: '#fdeaea', tx: '#c0392b' },
  cancelled:  { label: 'Cancelado',       bg: 'var(--paper)', tx: 'var(--muted)' },
  waitlisted: { label: 'Lista de espera', bg: '#eef0fb', tx: '#4f46e5' },
};

interface UserHistoryModalProps {
  user: { name: string; email: string };
  onClose: () => void;
}

export default function UserHistoryModal({ user, onClose }: UserHistoryModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getUserStats(user.email)
      .then((s) => active && setStats(s))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Erro ao carregar histórico'));
    return () => { active = false; };
  }, [user.email]);

  return (
    <div className="fixed inset-0 bg-[var(--ink)]/55 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onClose}>
      <div className="anim-pop bg-white rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display text-[18px] font-bold text-[var(--ink)] truncate">{user.name}</h3>
            <p className="text-[12px] text-[var(--muted)] truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--paper)] rounded-lg text-[var(--muted)] shrink-0">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {error ? (
          <div className="text-[13px] text-[#c0392b] text-center py-10">{error}</div>
        ) : !stats ? (
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
  );
}
