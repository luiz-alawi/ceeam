'use client';

import { useRouter } from 'next/navigation';
import { CalendarDays, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const FEATURES = [
  { icon: CalendarDays, title: 'Reserva por dia', desc: 'Escolha o dia na régua, veja as quadras lado a lado e reserve o horário livre com um clique.' },
  { icon: Clock, title: 'Status em tempo real', desc: 'Acompanhe suas reservas, o histórico e a situação de cada solicitação sem complicação.' },
  { icon: Users, title: 'Conversa direta', desc: 'Chat integrado entre usuários e administradores para resolver tudo na hora.' },
  { icon: CheckCircle, title: 'Aprovação ágil', desc: 'Administradores aprovam ou recusam solicitações com transparência e organização.' },
];

export default function AboutPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();

  const goToApp = () => {
    if (isAuthenticated) router.push(isAdmin ? '/admin' : '/dashboard');
    else router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[var(--line)] sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AMF" className="h-10 w-10 object-contain" />
            <span className="font-display font-semibold text-[16px] text-[var(--ink)]">Centro Esportivo Educacional</span>
          </div>
          <button onClick={goToApp} className="px-5 py-2 bg-[var(--brand)] text-white rounded-xl text-[14px] font-semibold hover:bg-[var(--brand-700)] transition-colors">
            {isAuthenticated ? 'Ir para a agenda' : 'Entrar'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[var(--ink)] court-lines text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <span className="inline-block text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-300)] mb-5">
            Antônio Meneghetti Faculdade
          </span>
          <h1 className="font-display text-[44px] sm:text-[60px] leading-[1.04] font-bold mb-5">
            A quadra livre,<br /><span className="text-[var(--brand-300)]">na palma da mão.</span>
          </h1>
          <p className="text-[18px] text-white/65 max-w-2xl mx-auto mb-9">
            Uma nova forma de agendar as quadras do Centro Esportivo Educacional — rápida,
            visual e transparente para toda a comunidade acadêmica.
          </p>
          <button onClick={goToApp}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--brand)] text-white rounded-2xl text-[15px] font-semibold hover:bg-[var(--brand-700)] shadow-[0_10px_30px_rgba(18,115,194,.4)] transition-colors">
            Acessar a agenda <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6">
        <section className="grid sm:grid-cols-2 gap-5 py-16">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl border border-[var(--line)] p-7 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[var(--brand-tint)] grid place-items-center mb-4">
                <f.icon className="w-6 h-6 text-[var(--brand)]" />
              </div>
              <h3 className="font-display text-[19px] font-semibold text-[var(--ink)] mb-2">{f.title}</h3>
              <p className="text-[14px] text-[var(--muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] bg-[var(--brand)] text-white px-8 py-14 text-center mb-16 relative overflow-hidden">
          <div className="absolute inset-0 court-lines opacity-40" />
          <div className="relative">
            <h2 className="font-display text-[32px] font-bold mb-3">Pronto para começar?</h2>
            <p className="text-[17px] text-white/85 mb-7 max-w-xl mx-auto">Acesse o sistema e faça seu agendamento de forma rápida e prática.</p>
            <button onClick={goToApp} className="px-7 py-3.5 bg-white text-[var(--brand-700)] rounded-2xl text-[15px] font-semibold hover:bg-white/90 transition-colors">
              Ir para o sistema de agendamento
            </button>
          </div>
        </section>

        <section className="border-t border-[var(--line)] py-14 text-center">
          <h3 className="font-display text-[22px] font-semibold text-[var(--ink)] mb-3">Sobre o projeto</h3>
          <p className="text-[15px] text-[var(--muted)] mb-6 max-w-2xl mx-auto leading-relaxed">
            Sistema desenvolvido para modernizar e facilitar o agendamento das instalações esportivas
            da Antônio Meneghetti Faculdade, com uma experiência mais eficiente e organizada para todos.
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-full text-[14px]">
            <span className="text-[var(--muted)]">Desenvolvido por</span>
            <a href="https://luiz-alawi.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--brand)] hover:underline">Luiz Alawi</a>
            <span className="text-[#94a3b8]">e</span>
            <a href="https://github.com/henrygodoi" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--brand)] hover:underline">Henry Godoi</a>
          </div>
        </section>
      </main>
    </div>
  );
}
