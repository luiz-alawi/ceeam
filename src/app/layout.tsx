import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider, AuthUser } from '@/lib/auth-context';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'CEEAM – Sistema de Agendamento',
  description: 'Centro Esportivo Educacional da Antônio Meneghetti Faculdade',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const initialSession: AuthUser | null = session.isLoggedIn
    ? { email: session.email!, name: session.name!, isAdmin: session.isAdmin! }
    : null;

  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider initialSession={initialSession}>{children}</AuthProvider>
      </body>
    </html>
  );
}
