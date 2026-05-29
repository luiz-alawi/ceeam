'use client';

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Package, Users, Plus } from 'lucide-react';
import { COURTS, TIME_SLOTS, EQUIPMENT } from '@/data/mockData';
import type { WeeklyEvent } from '@/types';

interface BookingModalProps {
  onClose: () => void;
  onSubmit: (booking: { date: string; time: string; court: string; equipment: string[]; players: string[] }) => Promise<void>;
  weeklyEvents?: WeeklyEvent[];
  initialDate?: string; // YYYY-MM-DD
}

export default function BookingModal({ onClose, onSubmit, weeklyEvents = [], initialDate }: BookingModalProps) {
  const [date, setDate] = useState(initialDate ?? '');
  const [time, setTime] = useState('');
  const [court, setCourt] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const blockedTimes = new Set(
    court && date
      ? weeklyEvents
          .filter((we) => we.court === court && we.dayOfWeek === new Date(date + 'T12:00:00').getDay())
          .map((we) => we.time)
      : [],
  );

  const toggleEquipment = (item: string) =>
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );

  const addPlayer = () => {
    const name = playerInput.trim();
    if (!name || players.includes(name)) return;
    setPlayers((prev) => [...prev, name]);
    setPlayerInput('');
  };

  const removePlayer = (name: string) =>
    setPlayers((prev) => prev.filter((p) => p !== name));

  const handlePlayerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addPlayer(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !court) return;
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ date, time, court, equipment, players });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Novo Agendamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quadra */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <MapPin className="w-4 h-4 text-blue-600" /> Quadra
            </label>
            <div className="flex gap-2">
              {COURTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCourt(c)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    court === c
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-4 h-4 text-blue-600" /> Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Horário */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="w-4 h-4 text-blue-600" /> Horário
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Escolha um horário...</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t} disabled={blockedTimes.has(t)}>
                  {t}{blockedTimes.has(t) ? ' — reservado (evento fixo)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Jogadores */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Users className="w-4 h-4 text-blue-600" /> Jogadores
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={handlePlayerKeyDown}
                placeholder="Nome do jogador..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addPlayer}
                disabled={!playerInput.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {players.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {players.map((p) => (
                  <span
                    key={p}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
                  >
                    {p}
                    <button
                      type="button"
                      onClick={() => removePlayer(p)}
                      className="hover:text-blue-900 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {players.length === 0 && (
              <p className="text-xs text-gray-400">Nenhum jogador adicionado.</p>
            )}
          </div>

          {/* Equipamentos */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 text-blue-600" /> Equipamentos (opcional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT.map((item) => {
                const checked = equipment.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleEquipment(item)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                      checked
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                      checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !court || !date || !time}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : 'Solicitar Agendamento'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-gray-400 text-center">
          Sua solicitação será analisada pelo administrador.
        </p>
      </div>
    </div>
  );
}
