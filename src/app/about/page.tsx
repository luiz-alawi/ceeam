'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AboutPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();

  const goToApp = () => {
    if (isAuthenticated) {
      router.push(isAdmin ? '/admin' : '/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-12" />
            <span className="font-bold text-gray-900">Centro Esportivo Educacional</span>
          </div>
          <button
            onClick={goToApp}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {isAuthenticated ? 'Ir para o sistema' : 'Entrar'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sistema de Agendamento de Quadras
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Facilitando e organizando o agendamento das quadras do Centro Esportivo Educacional
            da Antônio Meneghetti Faculdade.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-blue-50 p-8 rounded-xl">
            <Calendar className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Agendamento Simples</h3>
            <p className="text-gray-600">
              Visualize a disponibilidade das quadras em um calendário interativo e faça
              seu agendamento em poucos cliques.
            </p>
          </div>

          <div className="bg-blue-50 p-8 rounded-xl">
            <Clock className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Gestão de Horários</h3>
            <p className="text-gray-600">
              Acompanhe seus agendamentos, visualize o histórico e receba atualizações
              sobre o status das suas solicitações.
            </p>
          </div>

          <div className="bg-blue-50 p-8 rounded-xl">
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Comunicação Direta</h3>
            <p className="text-gray-600">
              Sistema de mensagens integrado permite comunicação rápida entre usuários
              e administradores para resolver dúvidas.
            </p>
          </div>

          <div className="bg-blue-50 p-8 rounded-xl">
            <CheckCircle className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Aprovação Rápida</h3>
            <p className="text-gray-600">
              Administradores podem aprovar ou recusar solicitações com facilidade,
              mantendo o processo organizado e transparente.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-12 text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Acesse o sistema e faça seu agendamento de forma rápida e prática.
          </p>
          <button
            onClick={goToApp}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            Ir para o sistema de agendamento
          </button>
        </div>

        <div className="border-t border-gray-200 pt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Sobre o Projeto</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Este sistema foi desenvolvido para modernizar e facilitar o processo de agendamento
            das instalações esportivas da Antônio Meneghetti Faculdade, proporcionando uma
            experiência mais eficiente e organizada para toda a comunidade acadêmica.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-lg">
            <span className="text-gray-700 font-medium">Desenvolvido por</span>
            <span className="font-bold text-blue-600">Luiz Alawi</span>
            <span className="text-gray-400">e</span>
            <span className="font-bold text-blue-600">Henry Godoi</span>
          </div>
        </div>
      </main>
    </div>
  );
}
