'use client';

import { useState } from 'react';
import { X, CalendarDays, Clock, MapPin, Repeat, MessageSquareText } from 'lucide-react';
import { COURTS, TIME_SLOTS } from '@/data/mockData';
import { courtColor, toYMD } from '@/lib/calendar';
import type { WeeklyEvent } from '@/types';

interface RecurringModalProps {
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    time: string;
    court: string;
    weeks: number;
    reason: string;
  }) => Promise<void>;
  weeklyEvents?: WeeklyEvent[];
}

const MIN_REASON = 15;

export default function RecurringModal({ onClose, onSubmit, weeklyEvents = [] }: RecurringModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [court, setCourt] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const blockedTimes = new Set(
    court && date
      ? weeklyEvents.filter((we) => we.court === court && we.dayOfWeek === new Date(date + 'T12:00:00').getDay()).map((we) => we.time)
      : [],
  );

  const weekdayLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !court) return;
    if (reason.trim().length < MIN_REASON) {
      setError(`Explique o motivo do horário fixo (mínimo ${MIN_REASON} caracteres).`);
      return;
    }
    setError(''); setSubmitting(true);
    try { await onSubmit({ date, time, court, weeks, reason: reason.trim() }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao enviar pedido'); }
    finally { setSubmitting(false); }
  };

  const field =
    'w-full px-3.5 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 transition';
  const labelCls = 'flex items-center gap-2 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wide mb-2';

  return (
    <div className="fixed inset-0 bg-[var(--ink)]/55 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="anim-pop bg-white sm:rounded-3xl rounded-t-3xl max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto nice-scroll">
        <div className="px-6 pt-5 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-xl bg-[#ede9fe] grid place-items-center"><Repeat className="w-5 h-5 text-[#6d28d9]" /></span>
              <h2 className="font-display text-[20px] font-bold text-[var(--ink)]">Pedir horário fixo</h2>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 hover:bg-[var(--paper)] rounded-full transition-colors">
              <X className="w-5 h-5 text-[var(--muted)]" />
            </button>
          </div>
          <p className="text-[13px] text-[var(--muted)] mt-2">
            Reserva o mesmo horário toda semana. Como ocupa a quadra com frequência, o pedido é enviado para análise do administrador — explique o motivo abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className={labelCls}><MapPin className="w-4 h-4 text-[var(--brand)]" /> Quadra</label>
            <div className="flex gap-2">
              {COURTS.map((c) => {
                const col = courtColor(c, COURTS);
                const active = court === c;
                return (
                  <button key={c} type="button" onClick={() => setCourt(c)}
                    className="flex-1 py-2.5 rounded-xl border text-[14px] font-semibold transition-all flex items-center justify-center gap-2"
                    style={active ? { background: col.bg, borderColor: col.dot, color: col.text } : { background: '#fff', borderColor: 'var(--line)', color: 'var(--ink)' }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot }} /> {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}><CalendarDays className="w-4 h-4 text-[var(--brand)]" /> A partir de</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={toYMD(new Date())} required className={field} />
            </div>
            <div>
              <label className={labelCls}><Clock className="w-4 h-4 text-[var(--brand)]" /> Horário</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} required className={field}>
                <option value="">Selecione…</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t} disabled={blockedTimes.has(t)}>{t}{blockedTimes.has(t) ? ' — ocupado (fixo)' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}><Repeat className="w-4 h-4 text-[var(--brand)]" /> Repetir por</label>
            <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className={field}>
              {[2, 3, 4, 6, 8, 12].map((w) => <option key={w} value={w}>{w} semanas</option>)}
            </select>
            {weekdayLabel && (
              <p className="text-[12px] text-[var(--muted)] mt-1.5 capitalize">
                Toda <strong className="text-[var(--ink)]">{weekdayLabel}</strong> · datas ocupadas serão puladas.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}><MessageSquareText className="w-4 h-4 text-[var(--brand)]" /> Por que você precisa deste horário fixo?</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3}
              placeholder="Ex: treino semanal da equipe de vôlei, aula recorrente, projeto de extensão…"
              className={`${field} resize-none`} />
            <p className="text-[11px] text-[var(--muted)] mt-1 text-right">{reason.trim().length}/{MIN_REASON} mín.</p>
          </div>

          {error && <p className="text-[13px] text-[#b91c1c] bg-[#fdecec] rounded-xl px-4 py-2.5">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-[var(--muted)] hover:bg-[var(--paper)] transition-colors">Cancelar</button>
            <button type="submit" disabled={submitting || !court || !date || !time || reason.trim().length < MIN_REASON}
              className="px-6 py-2.5 bg-[#6d28d9] text-white rounded-xl text-[14px] font-semibold hover:bg-[#5b21b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Enviando…' : 'Enviar pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
