import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider, AuthUser } from '@/lib/auth-context';
import { getSession } from '@/lib/session';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

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
  title: 'CEEAM · Agendamentos Esportivos',
  description: 'Centro Esportivo Educacional Antonio Meneghetti da Antônio Meneghetti Faculdade',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CEEAM',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0e1726',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const initialSession: AuthUser | null = session.isLoggedIn
    ? { email: session.email!, name: session.name!, isAdmin: session.isAdmin! }
    : null;

  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body>
        <ServiceWorkerRegister />
        <AuthProvider initialSession={initialSession}>{children}</AuthProvider>
      </body>
    </html>
  );
}
