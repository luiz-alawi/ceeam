'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import type { AdminUser } from '@/types';

async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Acesso negado');
  return session.email!;
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
