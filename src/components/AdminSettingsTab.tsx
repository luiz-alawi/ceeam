'use client';

import { useEffect, useState } from 'react';
import { Loader2, SlidersHorizontal, Save, CheckCircle } from 'lucide-react';
import { getSettings, updateSettings } from '@/actions/settings';
import type { BookingSettings } from '@/types';

const card = 'bg-white rounded-2xl border border-[var(--line)] p-5';

export default function AdminSettingsTab() {
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true); setSaved(false);
    try {
      const next = await updateSettings(settings);
      setSettings(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--muted)]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> <span className="text-[14px]">Carregando…</span>
      </div>
    );
  }

  const numField = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    hint: string,
    min = 0,
    max = 365,
  ) => (
    <div>
      <label className="block text-[13px] font-medium text-[var(--ink)] mb-1">{label}</label>
      <input
        type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 px-3 py-2 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-[14px] focus:outline-none focus:border-[var(--brand)]"
      />
      <p className="text-[12px] text-[var(--muted)] mt-1">{hint}</p>
    </div>
  );

  return (
    <div className={`${card} max-w-lg space-y-5`}>
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-[var(--brand)]" />
        <h2 className="text-[15px] font-medium text-[var(--ink)]">Regras de agendamento</h2>
      </div>

      {numField('Máximo de reservas por usuário / semana', settings.maxPerUserPerWeek,
        (v) => setSettings({ ...settings, maxPerUserPerWeek: v }), '0 = sem limite.', 0, 50)}

      {numField('Antecedência mínima (horas)', settings.minAdvanceHours,
        (v) => setSettings({ ...settings, minAdvanceHours: v }), 'Tempo mínimo entre a solicitação e o horário. 0 = liberado.', 0, 168)}

      {numField('Antecedência máxima (dias)', settings.maxAdvanceDays,
        (v) => setSettings({ ...settings, maxAdvanceDays: v }), 'Com quantos dias de folga é possível reservar. 0 = sem limite.', 0, 365)}

      <label className="flex items-center justify-between gap-3 py-2 border-t border-[var(--line)] pt-4">
        <div>
          <span className="text-[13px] font-medium text-[var(--ink)]">Lista de espera</span>
          <p className="text-[12px] text-[var(--muted)]">Permite entrar na fila quando o horário já está reservado.</p>
        </div>
        <button type="button" onClick={() => setSettings({ ...settings, waitlistEnabled: !settings.waitlistEnabled })}
          className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${settings.waitlistEnabled ? 'bg-[var(--brand)]' : 'bg-[#c4d2e3]'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${settings.waitlistEnabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand)] text-white rounded-lg text-[14px] font-medium hover:bg-[var(--brand-700)] transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando…' : 'Salvar regras'}
        </button>
        {saved && <span className="flex items-center gap-1 text-[13px] text-[#1f7a44]"><CheckCircle className="w-4 h-4" /> Salvo!</span>}
      </div>
    </div>
  );
}
