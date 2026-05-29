'use client';

import { CalendarDays, TrendingUp, Clock, Users, Package, BarChart2 } from 'lucide-react';
import { formatDatePtBR } from '@/utils/dateUtils';
import type { ReportData } from '@/actions/reports';

const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function HBar({ label, count, max, color = 'bg-blue-500' }: {
  label: string; count: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 text-right text-gray-600 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right font-semibold text-gray-700 shrink-0">{count}</span>
    </div>
  );
}

export default function AdminReportsTab({ data }: { data: ReportData }) {
  const maxCourt = Math.max(...data.byCourt.map((c) => c.count), 1);
  const maxTime  = Math.max(...data.topTimeSlots.map((t) => t.count), 1);
  const maxDow   = Math.max(...data.byDayOfWeek.map((d) => d.count), 1);

  const noData = data.total === 0;

  return (
    <div className="space-y-5">
      {/* Period */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <CalendarDays className="w-3.5 h-3.5" />
        Período analisado:{' '}
        <strong className="text-gray-700">
          {formatDatePtBR(data.period.from, { day: '2-digit', month: 'long' })} —{' '}
          {formatDatePtBR(data.period.to,   { day: '2-digit', month: 'long', year: 'numeric' })}
        </strong>
      </div>

      {noData && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <BarChart2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">Nenhum dado disponível para o período.</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Solicitações',    value: data.total,           bg: 'bg-white',        text: 'text-gray-900',  sub: 'text-gray-400'  },
          { label: 'Taxa aprovação',  value: `${data.acceptanceRate}%`, bg: 'bg-green-50', text: 'text-green-700', sub: 'text-green-500' },
          { label: 'Aceitos',         value: data.accepted,         bg: 'bg-blue-50',      text: 'text-blue-700',  sub: 'text-blue-400'  },
          { label: 'Pendentes',       value: data.pending,          bg: 'bg-yellow-50',    text: 'text-yellow-700',sub: 'text-yellow-500'},
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className={`text-xs mt-0.5 ${s.sub}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      {!noData && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Distribuição por status
          </h3>
          <div className="flex rounded-full overflow-hidden h-5 mb-3 bg-gray-100">
            {[
              { count: data.accepted,  cls: 'bg-green-500'  },
              { count: data.rejected,  cls: 'bg-red-400'    },
              { count: data.cancelled, cls: 'bg-gray-300'   },
              { count: data.pending,   cls: 'bg-yellow-400' },
            ].filter((s) => s.count > 0).map((s, i) => (
              <div
                key={i}
                className={`${s.cls} flex items-center justify-center text-[10px] font-semibold text-white`}
                style={{ width: `${(s.count / data.total) * 100}%` }}
              >
                {s.count}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            {[
              { color: 'bg-green-500',  label: 'Aceitos',    count: data.accepted  },
              { color: 'bg-red-400',    label: 'Recusados',  count: data.rejected  },
              { color: 'bg-gray-300',   label: 'Cancelados', count: data.cancelled },
              { color: 'bg-yellow-400', label: 'Pendentes',  count: data.pending   },
            ].map((s) => (
              <span key={s.label} className="flex items-center gap-1">
                <span className={`w-2 h-2 ${s.color} rounded-full`} />
                {s.label} ({s.count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Por quadra */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Agendamentos por quadra</h3>
          {data.byCourt.length > 0 ? (
            <div className="space-y-2">
              {data.byCourt.map((c) => (
                <HBar key={c.court} label={c.court} count={c.count} max={maxCourt} color="bg-blue-500" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Sem dados.</p>
          )}
        </div>

        {/* Por dia da semana */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Por dia da semana</h3>
          <div className="space-y-2">
            {data.byDayOfWeek.map((d) => (
              <HBar key={d.day} label={DAY_SHORT[d.day]} count={d.count} max={maxDow} color="bg-purple-500" />
            ))}
          </div>
        </div>

        {/* Horários populares */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Horários mais populares
          </h3>
          {data.topTimeSlots.length > 0 ? (
            <div className="space-y-2">
              {data.topTimeSlots.map((t) => (
                <HBar key={t.time} label={t.time} count={t.count} max={maxTime} color="bg-indigo-500" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Sem dados.</p>
          )}
        </div>

        {/* Top usuários */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-600" /> Usuários mais ativos
          </h3>
          {data.topUsers.length > 0 ? (
            <div className="space-y-2">
              {data.topUsers.map((u, i) => (
                <div key={u.email} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-center font-bold text-gray-300">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{u.name}</div>
                    <div className="text-gray-400 truncate">{u.email}</div>
                  </div>
                  <span className="font-bold text-blue-600 shrink-0">{u.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Sem dados.</p>
          )}
        </div>

        {/* Equipamentos */}
        {data.byEquipment.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-blue-600" /> Equipamentos mais solicitados
            </h3>
            <div className="flex flex-wrap gap-3">
              {data.byEquipment.map((eq) => (
                <div key={eq.equipment} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs">
                  <span className="text-blue-700 font-medium">{eq.equipment}</span>
                  <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">{eq.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
