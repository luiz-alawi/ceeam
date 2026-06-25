'use client';

import { useState } from 'react';
import { Loader2, ArrowRight, MailCheck } from 'lucide-react';
import { loginAction, registerAction, resendVerification } from '@/actions/auth';
import { validateEmailFormat } from '@/utils/emailValidation';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // E-mail aguardando confirmação: exibe a tela de "confirme seu e-mail".
  const [pendingEmail, setPendingEmail] = useState('');
  // Mostra o botão "reenviar" quando o login falha por falta de confirmação.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next); setError(''); setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
    setPendingEmail(''); setNeedsVerification(false); setResent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNeedsVerification(false); setResent(false);
    if (mode === 'register') {
      const emailErr = validateEmailFormat(email);
      if (emailErr) { setError(emailErr); return; }
      if (password !== confirmPassword) { setError('As senhas não coincidem'); return; }
      if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const result = await registerAction(name, email, password);
        if ('error' in result) { setError(result.error); return; }
        setPendingEmail(result.email);
        return;
      }
      const result = await loginAction(email, password);
      if ('error' in result) {
        setError(result.error);
        if (result.needsVerification) setNeedsVerification(true);
        return;
      }
      window.location.href = result.isAdmin ? '/admin' : '/dashboard';
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification(email || pendingEmail);
      setResent(true);
    } finally { setLoading(false); }
  };

  const field =
    'w-full px-4 py-3 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 disabled:opacity-50 transition';

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[var(--ink)] court-lines text-white p-12 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white grid place-items-center">
            <img src="/logo.png" alt="AMF" className="h-8 w-8 object-contain" />
          </div>
          <span className="font-display font-semibold text-[17px]">Centro Esportivo Educacional Antonio Meneghetti</span>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-300)] mb-3">Agendamentos Esportivos</p>
          <h1 className="font-display text-[42px] font-bold leading-[1.05]">
            Reserve a quadra<br />em <span className="text-[var(--brand-300)]">segundos</span>.
          </h1>
          <p className="text-[15px] text-white/60 mt-4 max-w-sm">
            Veja a disponibilidade do dia, escolha o horário e pronto. Simples, rápido e organizado.
          </p>
        </div>
        <p className="text-[12px] text-white/40">Antônio Meneghetti Faculdade</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-10 bg-white">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/logo.png" alt="AMF" className="h-14 w-14 object-contain" />
          </div>

          {pendingEmail ? (
            /* Tela pós-cadastro: aguardando confirmação do e-mail. */
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-[var(--brand-tint)] grid place-items-center mx-auto mb-5">
                <MailCheck className="w-7 h-7 text-[var(--brand)]" />
              </div>
              <h2 className="font-display text-[26px] font-bold text-[var(--ink)]">Confirme seu e-mail</h2>
              <p className="text-[14px] text-[var(--muted)] mt-2">
                Enviamos um link de confirmação para<br />
                <span className="font-semibold text-[var(--ink)]">{pendingEmail}</span>.
                Clique nele para ativar sua conta e poder entrar.
              </p>
              {resent && (
                <p className="text-[13px] text-[#15803d] bg-[#eafaf0] rounded-xl px-4 py-2.5 mt-5">
                  E-mail reenviado. Verifique sua caixa de entrada e o spam.
                </p>
              )}
              <button type="button" onClick={handleResend} disabled={loading}
                className="w-full bg-[var(--brand)] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[var(--brand-700)] transition-all disabled:opacity-60 mt-6 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Reenviando…' : 'Reenviar e-mail'}
              </button>
              <button type="button" onClick={() => switchMode('login')}
                className="text-[14px] text-[var(--brand)] font-semibold hover:underline mt-5">
                Voltar para o login
              </button>
            </div>
          ) : (
          <>
          <h2 className="font-display text-[28px] font-bold text-[var(--ink)]">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h2>
          <p className="text-[14px] text-[var(--muted)] mt-1 mb-7">
            {mode === 'login' ? 'Acesse a Agendamentos Esportivos' : 'Preencha os dados para se cadastrar'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} autoFocus placeholder="Nome completo" className={field} />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoFocus={mode === 'login'} placeholder="E-mail" className={field} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} placeholder="Senha" className={field} />
            {mode === 'register' && (
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} placeholder="Confirmar senha" className={field} />
            )}

            {mode === 'login' && (
              <div className="text-right">
                <a href="/forgot-password" className="text-[13px] text-[var(--brand)] font-semibold hover:underline">Esqueci minha senha</a>
              </div>
            )}

            {error && <p className="text-[13px] text-[#b91c1c] bg-[#fdecec] rounded-xl px-4 py-2.5">{error}</p>}

            {needsVerification && (
              <button type="button" onClick={handleResend} disabled={loading}
                className="w-full border border-[var(--brand)] text-[var(--brand)] py-2.5 rounded-xl font-semibold text-[13px] hover:bg-[var(--brand-tint)] transition-all disabled:opacity-60">
                {resent ? 'E-mail reenviado ✓' : 'Reenviar e-mail de confirmação'}
              </button>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[var(--brand)] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[var(--brand-700)] active:scale-[0.99] transition-all disabled:opacity-60 mt-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? (mode === 'login' ? 'Entrando…' : 'Criando…') : mode === 'login' ? 'Entrar' : 'Criar conta'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-[14px] text-[var(--muted)] mt-6">
            {mode === 'login' ? (
              <>Não tem uma conta?{' '}
                <button type="button" onClick={() => switchMode('register')} className="text-[var(--brand)] font-semibold hover:underline">Cadastre-se</button></>
            ) : (
              <>Já tem uma conta?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-[var(--brand)] font-semibold hover:underline">Entrar</button></>
            )}
          </p>
          </>
          )}

          <div className="mt-6 text-center">
            <a href="/about" className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors">Sobre o projeto →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
