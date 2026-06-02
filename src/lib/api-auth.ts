import { getSession, SessionData } from './session';
import { NextResponse } from 'next/server';

type AuthedSession = SessionData & Required<Pick<SessionData, 'userId' | 'email' | 'name'>>;

export async function requireAuth(): Promise<AuthedSession | NextResponse> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || !session.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  return session as AuthedSession;
}

export async function requireAdmin(): Promise<AuthedSession | NextResponse> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin || !session.userId || !session.email) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  return session as AuthedSession;
}
