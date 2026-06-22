'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import type { GymClosure } from '@/types';

async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Acesso negado');
  return session.email!;
}

export async function createClosure(date: string, reason: string): Promise<GymClosure> {
  const actor = await requireAdmin();
  const row = await prisma.gymClosure.create({ data: { date, reason } });
  await logAudit(actor, 'closure:create', date, reason);
  return { id: row.id, date: row.date, reason: row.reason };
}

export async function deleteClosure(id: string): Promise<void> {
  const actor = await requireAdmin();
  const row = await prisma.gymClosure.findUnique({ where: { id } });
  await prisma.gymClosure.delete({ where: { id } });
  await logAudit(actor, 'closure:delete', row?.date ?? id, row?.reason ?? null);
}
