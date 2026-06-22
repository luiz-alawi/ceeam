'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2, History, CheckCircle, XCircle, Trash2, CalendarOff, Repeat,
  KeyRound, SlidersHorizontal, UserCheck, UserX, Search, ChevronRight, X, Clock, Shield, Target,
} from 'lucide-react';
import { getAuditLogs } from '@/actions/audit';
import { formatDateTimePtBR } from '@/utils/dateUtils';
import type { AuditEntry } from '@/types';

const card = 'bg-white rounded-2xl border border-[var(--line)] p-5';
const fieldCls =
  'px-3.5 py-2 bg-[var(--paper)] border border-transparent rounded-lg text-[14px] text-[var(--ink)] focus:outline-none focus:bg-white focus:border-[var(--brand)] transition';

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'booking:accepted':    { label: 'Agendamento aceito',       icon: <CheckCircle className="w-4 h-4" />, color: '#1f7a44' },
  'booking:rejected':    { label: 'Agendamento recusado',     icon: <XCircle className="w-4 h-4" />,     color: '#dc2626' },
  'booking:cancelled':   { label: 'Agendamento cancelado',    icon: <Trash2 className="w-4 h-4" />,      color: '#b45309' },
  'recurring:accepted':  { label: 'Horário fixo aceito',      icon: <Repeat className="w-4 h-4" />,      color: '#6d28d9' },
  'recurring:rejected':  { label: 'Horário fixo recusado',    icon: <Repeat className="w-4 h-4" />,      color: '#dc2626' },
  'attendance:present':  { label: 'Presença marcada',         icon: <UserCheck className="w-4 h-4" />,   color: '#1f7a44' },
  'attendance:absent':   { label: 'Falta marcada',            icon: <UserX className="w-4 h-4" />,       color: '#dc2626' },
  'attendance:clear':    { label: 'Presença removida',        icon: <History className="w-4 h-4" />,     color: '#5b6b80' },
  'closure:create':      { label: 'Dia bloqueado',            icon: <CalendarOff className="w-4 h-4" />, color: '#dc2626' },
  'closure:delete':      { label: 'Bloqueio removido',        icon: <CalendarOff className="w-4 h-4" />, color: '#5b6b80' },
  'weeklyEvent:create':  { label: 'Horário fixo criado',      icon: <Repeat className="w-4 h-4" />,      color: '#475569' },
  'weeklyEvent:delete':  { label: 'Horário fixo removido',    icon: <Repeat className="w-4 h-4" />,      color: '#5b6b80' },
  'user:reset-password': { label: 'Senha redefinida',         icon: <KeyRound className="w-4 h-4" />,    color: '#6d28d9' },
  'settings:update':     { label: 'Regra alterada',           icon: <SlidersHorizontal className="w-4 h-4" />, color: '#0e1726' },
};

export default function AdminAuditTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [limit, setLimit] = useState(15);
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  useEffect(() => {
    getAuditLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  // Ações realmente presentes nos logs, para popular o seletor.
  const actionOptions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return [...set].sort((a, b) =>
      (ACTION_META[a]?.label ?? a).localeCompare(ACTION_META[b]?.label ?? b, 'pt-BR'));
  }, [logs]);

  const q = userQuery.trim().toLowerCase();
  const filtered = logs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (!q) return true;
    return [log.actorName, log.actorEmail, log.targetName, log.target]
      .some((v) => v?.toLowerCase().includes(q));
  });
  const visible = filtered.slice(0, limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--muted)]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> <span className="text-[14px]">Carregando…</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={`${card} text-center text-[var(--muted)]`}>
        <History className="w-10 h-10 mx-auto mb-2 text-[var(--line)]" />
        <p className="text-[14px]">Nenhuma ação registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[var(--line)] p-3 shadow-[0_1px_3px_rgba(10,22,38,.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Busca */}
          <div className="flex items-center gap-2 flex-1 min-w-0 px-3.5 bg-[var(--paper)] border border-transparent rounded-lg focus-within:bg-white focus-within:border-[var(--brand)] transition-colors">
            <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
            <input
              type="text" value={userQuery}
              onChange={(e) => { setUserQuery(e.target.value); setLimit(15); }}
              placeholder="Buscar por usuário (admin ou afetado)…"
              className="flex-1 min-w-0 bg-transparent py-2 text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setLimit(15); }}
            className={`${fieldCls} sm:w-56`}
          >
            <option value="">Todas as ações</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>{ACTION_META[a]?.label ?? a}</option>
            ))}
          </select>
          {(q || actionFilter) && (
            <button
              onClick={() => { setUserQuery(''); setActionFilter(''); setLimit(15); }}
              className="self-start sm:self-auto px-3 py-2 rounded-lg text-[13px] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors shrink-0"
            >
              Limpar
            </button>
          )}
        </div>
        <p className="text-[12px] text-[var(--muted)] mt-2 px-1">
          Mostrando {visible.length} de {filtered.length}
          {filtered.length !== logs.length && ` (${logs.length} no total)`} ações
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className={`${card} text-center text-[var(--muted)]`}>
          <Search className="w-9 h-9 mx-auto mb-2 text-[var(--line)]" />
          <p className="text-[14px]">Nenhuma ação corresponde aos filtros.</p>
        </div>
      ) : (
        <>
        <div className="space-y-2">
      {visible.map((log) => {
        const meta = ACTION_META[log.action] ?? { label: log.action, icon: <History className="w-4 h-4" />, color: '#5b6b80' };
        const affected = log.targetName ?? log.target;
        return (
          <button
            key={log.id}
            onClick={() => setSelected(log)}
            className="w-full text-left bg-white rounded-xl border border-[var(--line)] p-3 flex items-center gap-3 hover:border-[var(--brand)]/40 hover:shadow-[0_1px_3px_rgba(10,22,38,.08)] transition"
          >
            <span className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background: `${meta.color}15`, color: meta.color }}>
              {meta.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-[var(--ink)] truncate">{meta.label}</span>
                {affected && (
                  <span className="hidden sm:inline-flex items-center max-w-[40%] px-2 py-0.5 rounded-full bg-[var(--paper)] text-[var(--muted)] text-[11px] font-medium truncate">
                    {affected}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[var(--muted)] truncate">
                por {log.actorName ?? log.actorEmail} · {formatDateTimePtBR(log.createdAt)}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--muted)] shrink-0" />
          </button>
        );
      })}
        </div>
        {visible.length < filtered.length && (
          <button
            onClick={() => setLimit((n) => n + 15)}
            className="w-full py-2.5 rounded-2xl border border-[var(--line)] bg-white text-[13px] font-semibold text-[var(--ink)] hover:bg-[var(--paper)] transition-colors"
          >
            Carregar mais ({filtered.length - visible.length} restantes)
          </button>
        )}
        </>
      )}

      {selected && <AuditDetailModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ── Modal de detalhes de uma ação ── */

function DetailRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string | null }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-[var(--line)] last:border-0">
      <span className="w-8 h-8 rounded-lg bg-[var(--paper)] grid place-items-center shrink-0 text-[var(--muted)]">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</div>
        <div className="text-[14px] text-[var(--ink)] leading-snug break-words">{value}</div>
        {sub && <div className="text-[12px] text-[var(--muted)] leading-snug break-words">{sub}</div>}
      </div>
    </div>
  );
}

function AuditDetailModal({ log, onClose }: { log: AuditEntry; onClose: () => void }) {
  const meta = ACTION_META[log.action] ?? { label: log.action, icon: <History className="w-4 h-4" />, color: '#5b6b80' };
  return (
    <div className="fixed inset-0 bg-[var(--ink)]/55 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50" onClick={onClose}>
      <div className="anim-pop bg-white sm:rounded-3xl rounded-t-3xl max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto nice-scroll" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--line)]">
          <span className="w-11 h-11 rounded-2xl grid place-items-center shrink-0" style={{ background: `${meta.color}15`, color: meta.color }}>
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[18px] font-bold text-[var(--ink)] leading-tight">{meta.label}</h2>
            <p className="text-[12px] text-[var(--muted)] mt-0.5 font-mono">{log.action}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-[var(--paper)] rounded-full transition-colors shrink-0">
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        <DetailRow icon={<Shield className="w-4 h-4" />} label="Realizado por" value={log.actorName ?? log.actorEmail} sub={log.actorName ? log.actorEmail : null} />

        {log.targetName && log.target && (
          <DetailRow icon={<UserCheck className="w-4 h-4" />} label="Usuário afetado" value={log.targetName} sub={log.target} />
        )}
        {log.target && !log.targetName && (
          <DetailRow icon={<Target className="w-4 h-4" />} label="Alvo" value={log.target} />
        )}
        {log.details && (
          <DetailRow icon={<History className="w-4 h-4" />} label="Detalhes" value={log.details} />
        )}

        <DetailRow icon={<Clock className="w-4 h-4" />} label="Data e hora" value={formatDateTimePtBR(log.createdAt)} />
      </div>
    </div>
  );
}
