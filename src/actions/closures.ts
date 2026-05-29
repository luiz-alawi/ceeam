'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { GymClosure } from '@/types';

async function requireAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Acesso negado');
}

export async function createClosure(date: string, reason: string): Promise<GymClosure> {
  await requireAdmin();
  const row = await prisma.gymClosure.create({ data: { date, reason } });
  return { id: row.id, date: row.date, reason: row.reason };
}

export async function deleteClosure(id: string): Promise<void> {
  await requireAdmin();
  await prisma.gymClosure.delete({ where: { id } });
}
