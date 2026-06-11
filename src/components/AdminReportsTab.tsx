'use client';

import { CalendarDays, TrendingUp, Clock, Users, Package, BarChart2 } from 'lucide-react';
import { formatDatePtBR } from '@/utils/dateUtils';
import type { ReportData } from '@/actions/reports';

const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function HBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="w-32 text-right text-[var(--muted)] truncate shrink-0">{label}</span>
      <div className="flex-1 bg-[var(--paper)] rounded-full h-3.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-6 text-right font-medium text-[var(--ink)] shrink-0">{count}</span>
    </div>
  );
}

const card = 'bg-white rounded-2xl border border-[var(--line)] p-5';

export default function AdminReportsTab({ data }: { data: ReportData }) {
  const maxCourt = Math.max(...data.byCourt.map((c) => c.count), 1);
  const maxTime = Math.max(...data.topTimeSlots.map((t) => t.count), 1);
  const maxDow = Math.max(...data.byDayOfWeek.map((d) => d.count), 1);
  const noData = data.total === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
        <CalendarDays className="w-3.5 h-3.5" />
        Período analisado:{' '}
        <strong className="text-[var(--ink)] font-medium">
          {formatDatePtBR(data.period.from, { day: '2-digit', month: 'long' })} —{' '}
          {formatDatePtBR(data.period.to, { day: '2-digit', month: 'long', year: 'numeric' })}
        </strong>
      </div>

      {noData && (
        <div className={`${card} text-center text-[var(--muted)]`}>
          <BarChart2 className="w-10 h-10 mx-auto mb-2 text-[var(--line)]" />
          <p className="text-[14px]">Nenhum dado disponível para o período.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Solicitações', value: data.total, bg: '#fff', tx: 'var(--ink)' },
          { label: 'Taxa aprovação', value: `${data.acceptanceRate}%`, bg: '#e7f6ec', tx: '#1f7a44' },
          { label: 'Aceitos', value: data.accepted, bg: '#e8f1fb', tx: 'var(--brand-700)' },
          { label: 'Pendentes', value: data.pending, bg: '#fdf2e3', tx: '#b45309' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] p-4 text-center" style={{ background: s.bg }}>
            <div className="text-[26px] font-bold" style={{ color: s.tx }}>{s.value}</div>
            <div className="text-[12px] mt-0.5 text-[var(--muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {!noData && (
        <div className={card}>
          <h3 className="text-[14px] font-medium text-[var(--ink)] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--brand)]" /> Distribuição por status
          </h3>
          <div className="flex rounded-full overflow-hidden h-5 mb-3 bg-[var(--paper)]">
            {[
              { count: data.accepted, c: '#1f7a44' },
              { count: data.rejected, c: '#dc2626' },
              { count: data.cancelled, c: '#94a3b8' },
              { count: data.pending, c: '#d97706' },
            ].filter((s) => s.count > 0).map((s, i) => (
              <div key={i} className="flex items-center justify-center text-[10px] font-semibold text-white" style={{ width: `${(s.count / data.total) * 100}%`, background: s.c }}>
                {s.count}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-[12px] text-[var(--muted)]">
            {[
              { c: '#1f7a44', label: 'Aceitos', count: data.accepted },
              { c: '#dc2626', label: 'Recusados', count: data.rejected },
              { c: '#94a3b8', label: 'Cancelados', count: data.cancelled },
              { c: '#d97706', label: 'Pendentes', count: data.pending },
            ].map((s) => (
              <span key={s.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: s.c }} /> {s.label} ({s.count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <div className={card}>
          <h3 className="text-[14px] font-medium text-[var(--ink)] mb-3">Agendamentos por quadra</h3>
          {data.byCourt.length > 0 ? (
            <div className="space-y-2">
              {data.byCourt.map((c) => <HBar key={c.court} label={c.court} count={c.count} max={maxCourt} color="var(--brand)" />)}
            </div>
          ) : <p className="text-[12px] text-[var(--muted)]">Sem dados.</p>}
        </div>

        <div className={card}>
          <h3 className="text-[14px] font-medium text-[var(--ink)] mb-3">Por dia da semana</h3>
          <div className="space-y-2">
            {data.byDayOfWeek.map((d) => <HBar key={d.day} label={DAY_SHORT[d.day]} count={d.count} max={maxDow} color="#475569" />)}
          </div>
        </div>

        <div className={card}>
          <h3 className="text-[14px] font-medium text-[var(--ink)] mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[var(--brand)]" /> Horários mais populares
          </h3>
          {data.topTimeSlots.length > 0 ? (
            <div className="space-y-2">
              {data.topTimeSlots.map((t) => <HBar key={t.time} label={t.time} count={t.count} max={maxTime} color="#1f7a44" />)}
            </div>
          ) : <p className="text-[12px] text-[var(--muted)]">Sem dados.</p>}
        </div>

        <div className={card}>
          <h3 className="text-[14px] font-medium text-[var(--ink)] mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[var(--brand)]" /> Usuários mais ativos
          </h3>
          {data.topUsers.length > 0 ? (
            <div className="space-y-2">
              {data.topUsers.map((u, i) => (
                <div key={u.email} className="flex items-center gap-2 text-[12px]">
                  <span className="w-4 text-center font-bold text-[#94a3b8]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--ink)] truncate">{u.name}</div>
                    <div className="text-[var(--muted)] truncate">{u.email}</div>
                  </div>
                  <span className="font-bold text-[var(--brand)] shrink-0">{u.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[12px] text-[var(--muted)]">Sem dados.</p>}
        </div>

        {data.byEquipment.length > 0 && (
          <div className={`${card} md:col-span-2`}>
            <h3 className="text-[14px] font-medium text-[var(--ink)] mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-[var(--brand)]" /> Equipamentos mais solicitados
            </h3>
            <div className="flex flex-wrap gap-3">
              {data.byEquipment.map((eq) => (
                <div key={eq.equipment} className="flex items-center gap-2 bg-[#e8f1fb] rounded-lg px-3 py-2 text-[12px]">
                  <span className="text-[var(--brand-700)] font-medium">{eq.equipment}</span>
                  <span className="bg-[var(--brand)] text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">{eq.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
