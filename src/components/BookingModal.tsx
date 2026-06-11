'use client';

import { useState } from 'react';
import { X, CalendarDays, Clock, MapPin, Package, Users, Plus } from 'lucide-react';
import { COURTS, TIME_SLOTS, EQUIPMENT } from '@/data/mockData';
import { courtColor } from '@/lib/calendar';
import type { WeeklyEvent } from '@/types';

interface BookingModalProps {
  onClose: () => void;
  onSubmit: (booking: { date: string; time: string; court: string; equipment: string[]; players: string[] }) => Promise<void>;
  weeklyEvents?: WeeklyEvent[];
  initialDate?: string;
  initialTime?: string;
  initialCourt?: string;
}

export default function BookingModal({
  onClose, onSubmit, weeklyEvents = [], initialDate, initialTime, initialCourt,
}: BookingModalProps) {
  const [date, setDate] = useState(initialDate ?? '');
  const [time, setTime] = useState(initialTime ?? '');
  const [court, setCourt] = useState(initialCourt ?? '');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const blockedTimes = new Set(
    court && date
      ? weeklyEvents.filter((we) => we.court === court && we.dayOfWeek === new Date(date + 'T12:00:00').getDay()).map((we) => we.time)
      : [],
  );

  const toggleEquipment = (item: string) =>
    setEquipment((prev) => (prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]));

  const addPlayer = () => {
    const name = playerInput.trim();
    if (!name || players.includes(name)) return;
    setPlayers((prev) => [...prev, name]);
    setPlayerInput('');
  };
  const removePlayer = (name: string) => setPlayers((prev) => prev.filter((p) => p !== name));
  const handlePlayerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addPlayer(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !court) return;
    setError(''); setSubmitting(true);
    try { await onSubmit({ date, time, court, equipment, players }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao criar agendamento'); }
    finally { setSubmitting(false); }
  };

  const field =
    'w-full px-3.5 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 transition';

  const labelCls = 'flex items-center gap-2 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wide mb-2';

  return (
    <div className="fixed inset-0 bg-[var(--ink)]/55 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="anim-pop bg-white sm:rounded-3xl rounded-t-3xl max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto nice-scroll">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--line)]">
          <h2 className="font-display text-[20px] font-bold text-[var(--ink)]">Novo agendamento</h2>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-[var(--paper)] rounded-full transition-colors">
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>
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
              <label className={labelCls}><CalendarDays className="w-4 h-4 text-[var(--brand)]" /> Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required className={field} />
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
            <label className={labelCls}><Users className="w-4 h-4 text-[var(--brand)]" /> Jogadores</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={playerInput} onChange={(e) => setPlayerInput(e.target.value)} onKeyDown={handlePlayerKeyDown} placeholder="Nome do jogador…" className={field} />
              <button type="button" onClick={addPlayer} disabled={!playerInput.trim()} className="px-3 bg-[var(--brand)] text-white rounded-xl hover:bg-[var(--brand-700)] transition-colors disabled:opacity-40 flex items-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {players.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {players.map((p) => (
                  <span key={p} className="flex items-center gap-1 px-2.5 py-1 bg-[var(--brand-tint)] text-[var(--brand-700)] rounded-full text-[12px] font-semibold">
                    {p}<button type="button" onClick={() => removePlayer(p)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            ) : <p className="text-[12px] text-[var(--muted)]">Nenhum jogador adicionado.</p>}
          </div>

          <div>
            <label className={labelCls}><Package className="w-4 h-4 text-[var(--brand)]" /> Equipamentos (opcional)</label>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT.map((item) => {
                const checked = equipment.includes(item);
                return (
                  <button key={item} type="button" onClick={() => toggleEquipment(item)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] transition-colors text-left ${checked ? 'bg-[var(--brand-tint)] border-[var(--brand)] text-[var(--brand-700)]' : 'bg-white border-[var(--line)] text-[var(--muted)] hover:bg-[var(--paper)]'}`}>
                    <span className={`w-4 h-4 rounded border grid place-items-center shrink-0 ${checked ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[#c4d2e3]'}`}>
                      {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>{item}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-[13px] text-[#b91c1c] bg-[#fdecec] rounded-xl px-4 py-2.5">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-[var(--muted)] hover:bg-[var(--paper)] transition-colors">Cancelar</button>
            <button type="submit" disabled={submitting || !court || !date || !time}
              className="px-6 py-2.5 bg-[var(--brand)] text-white rounded-xl text-[14px] font-semibold hover:bg-[var(--brand-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Enviando…' : 'Solicitar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
