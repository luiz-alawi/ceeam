'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '@/actions/auth';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    if (password !== confirm) { setError('As senhas não coincidem'); return; }
    setLoading(true);
    try {
      const result = await resetPassword(token, password);
      if ('error' in result) { setError(result.error); return; }
      setDone(true);
    } finally { setLoading(false); }
  };

  const field =
    'w-full px-4 py-3 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 disabled:opacity-50 transition';

  if (done) {
    return (
      <div className="text-center">
        <div className="h-14 w-14 rounded-2xl bg-[#eafaf0] grid place-items-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-[#15803d]" />
        </div>
        <h1 className="font-display text-[24px] font-bold text-[var(--ink)]">Senha redefinida!</h1>
        <p className="text-[14px] text-[var(--muted)] mt-2">
          Sua senha foi atualizada. Use a nova senha para entrar.
        </p>
        <Link href="/login"
          className="inline-block w-full bg-[var(--brand)] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[var(--brand-700)] transition-all mt-6">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-[26px] font-bold text-[var(--ink)]">Nova senha</h1>
      <p className="text-[14px] text-[var(--muted)] mt-1 mb-6">Escolha uma nova senha para sua conta.</p>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} autoFocus placeholder="Nova senha" className={field} />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required disabled={loading} placeholder="Confirmar nova senha" className={field} />
        {error && <p className="text-[13px] text-[#b91c1c] bg-[#fdecec] rounded-xl px-4 py-2.5">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-[var(--brand)] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[var(--brand-700)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Salvando…' : 'Redefinir senha'}
        </button>
      </form>
      <div className="text-center mt-6">
        <Link href="/login" className="text-[14px] text-[var(--brand)] font-semibold hover:underline">Voltar para o login</Link>
      </div>
    </>
  );
}
