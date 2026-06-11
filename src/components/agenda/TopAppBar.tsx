'use client';

import { useState } from 'react';
import { LogOut, Shield } from 'lucide-react';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  userEmail: string;
  onLogout: () => void;
  badge?: 'admin';
  right?: React.ReactNode;
}

const initial = (email: string) => (email[0] ?? '?').toUpperCase();

export default function TopAppBar({ title, subtitle, userEmail, onLogout, badge, right }: TopAppBarProps) {
  const [menu, setMenu] = useState(false);

  return (
    <header className="h-16 shrink-0 sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 bg-white border-b border-[var(--line)]">
      <img src="/logo.png" alt="AMF" className="h-10 w-10 object-contain shrink-0" />
      <div className="leading-tight min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-[18px] font-semibold tracking-tight text-[var(--ink)] truncate">{title}</span>
          {badge === 'admin' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-tint)] text-[var(--brand-700)] text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5">
              <Shield className="w-3 h-3" /> Admin
            </span>
          )}
        </div>
        {subtitle && <div className="text-[12px] text-[var(--muted)] truncate">{subtitle}</div>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {right}
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            onBlur={() => setTimeout(() => setMenu(false), 150)}
            className="w-9 h-9 rounded-full bg-[var(--brand)] text-white text-[15px] font-semibold flex items-center justify-center ring-2 ring-transparent hover:ring-[var(--brand)]/25 transition-all"
          >
            {initial(userEmail)}
          </button>
          {menu && (
            <div className="anim-pop absolute right-0 mt-2 w-64 bg-white text-[var(--ink)] rounded-2xl border border-[var(--line)] shadow-2xl py-2 z-40">
              <div className="px-4 py-2.5 flex items-center gap-3 border-b border-[var(--line)]">
                <div className="w-10 h-10 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-semibold">
                  {initial(userEmail)}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{userEmail}</div>
                  <div className="text-[11px] text-[var(--muted)]">{badge === 'admin' ? 'Administrador' : 'Usuário'}</div>
                </div>
              </div>
              <button
                onMouseDown={(e) => { e.preventDefault(); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-[var(--paper)]"
              >
                <LogOut className="w-4 h-4 text-[var(--muted)]" /> Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
