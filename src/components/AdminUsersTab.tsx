'use client';

import { useEffect, useState } from 'react';
import { Loader2, KeyRound, ShieldCheck, User, Copy, Check, History } from 'lucide-react';
import { getUsers, adminResetPassword } from '@/actions/users';
import { formatDatePtBR } from '@/utils/dateUtils';
import UserHistoryModal from '@/components/UserHistoryModal';
import type { AdminUser } from '@/types';

const card = 'bg-white rounded-2xl border border-[var(--line)] p-5';

export default function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<{ user: AdminUser; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState('');
  const [historyFor, setHistoryFor] = useState<AdminUser | null>(null);

  useEffect(() => {
    getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

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
                <button onClick={() => setHistoryFor(u)}
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
        <UserHistoryModal user={{ name: historyFor.name, email: historyFor.email }} onClose={() => setHistoryFor(null)} />
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
