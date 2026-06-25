'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { requestPasswordReset } from '@/actions/auth';
import { validateEmailFormat } from '@/utils/emailValidation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailErr = validateEmailFormat(email);
    if (emailErr) { setError(emailErr); return; }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } finally { setLoading(false); }
  };

  const field =
    'w-full px-4 py-3 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 disabled:opacity-50 transition';

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--paper)] px-5 py-10">
      <div className="w-full max-w-[400px] bg-white border border-[var(--line)] rounded-2xl p-8">
        <img src="/logo.png" alt="AMF" className="h-12 w-12 object-contain mx-auto mb-6" />

        {sent ? (
          <div className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-[var(--brand-tint)] grid place-items-center mx-auto mb-5">
              <MailCheck className="w-7 h-7 text-[var(--brand)]" />
            </div>
            <h1 className="font-display text-[24px] font-bold text-[var(--ink)]">Verifique seu e-mail</h1>
            <p className="text-[14px] text-[var(--muted)] mt-2">
              Se houver uma conta com <span className="font-semibold text-[var(--ink)]">{email}</span>,
              enviamos um link para redefinir a senha. O link expira em 1 hora.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-[26px] font-bold text-[var(--ink)]">Esqueci minha senha</h1>
            <p className="text-[14px] text-[var(--muted)] mt-1 mb-6">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoFocus placeholder="E-mail" className={field} />
              {error && <p className="text-[13px] text-[#b91c1c] bg-[#fdecec] rounded-xl px-4 py-2.5">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-[var(--brand)] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[var(--brand-700)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Enviando…' : 'Enviar link'}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-6">
          <Link href="/login" className="text-[14px] text-[var(--brand)] font-semibold hover:underline">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
