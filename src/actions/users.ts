'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import type { AdminUser, UserStats } from '@/types';

async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Acesso negado');
  return session.email!;
}

/**
 * Histórico/estatísticas de um usuário, agregados a partir dos seus agendamentos:
 * quantos fez, aceitos, negados, cancelados, pendentes, lista de espera, além de
 * presença (compareceu / faltou) entre os que tiveram presença registrada.
 */
export async function getUserStats(userEmail: string): Promise<UserStats> {
  await requireAdmin();

  const bookings = await prisma.booking.findMany({
    where: { userEmail },
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
  });

  const total      = bookings.length;
  const accepted   = bookings.filter((b) => b.status === 'accepted').length;
  const rejected   = bookings.filter((b) => b.status === 'rejected').length;
  const cancelled  = bookings.filter((b) => b.status === 'cancelled').length;
  const pending    = bookings.filter((b) => b.status === 'pending').length;
  const waitlisted = bookings.filter((b) => b.status === 'waitlisted').length;

  // Presença: só conta entre os agendamentos com presença registrada.
  const attended = bookings.filter((b) => b.attended === true).length;
  const absent   = bookings.filter((b) => b.attended === false).length;

  // Decididos = aceitos + negados (base da taxa de aprovação).
  const decided = accepted + rejected;
  const presence = attended + absent;

  return {
    total, accepted, rejected, cancelled, pending, waitlisted, attended, absent,
    acceptanceRate: decided > 0 ? Math.round((accepted / decided) * 100) : 0,
    noShowRate: presence > 0 ? Math.round((absent / presence) * 100) : 0,
    recent: bookings.slice(0, 12).map((b) => ({
      id: b.id,
      date: b.date,
      time: b.time,
      court: b.court,
      status: b.status as UserStats['recent'][number]['status'],
      attended: b.attended ?? null,
    })),
  };
}

export async function getUsers(): Promise<AdminUser[]> {
  await requireAdmin();
  const rows = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt.toISOString(),
  }));
}

/** Gera uma senha temporária legível. */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Redefine a senha de um usuário. Se `newPassword` não for informada, gera uma
 * senha temporária e a retorna em texto puro (para o admin repassar).
 */
export async function adminResetPassword(
  userId: string,
  newPassword?: string,
): Promise<{ tempPassword: string }> {
  const actor = await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado');

  const password = newPassword && newPassword.length >= 6 ? newPassword : generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await logAudit(actor, 'user:reset-password', user.email);

  return { tempPassword: password };
}
