import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider, AuthUser } from '@/lib/auth-context';
import { getSession } from '@/lib/session';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CEEAM · Agenda das Quadras',
  description: 'Centro Esportivo Educacional da Antônio Meneghetti Faculdade',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const initialSession: AuthUser | null = session.isLoggedIn
    ? { email: session.email!, name: session.name!, isAdmin: session.isAdmin! }
    : null;

  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body>
        <AuthProvider initialSession={initialSession}>{children}</AuthProvider>
      </body>
    </html>
  );
}
