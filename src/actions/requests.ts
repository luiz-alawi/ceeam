'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { Request } from '@/types';

async function requireAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Acesso negado');
}

export async function getRequests(): Promise<Request[]> {
  await requireAdmin();

  const rows = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    userEmail: r.userEmail,
    date: r.date,
    time: r.time,
    court: r.court,
    equipment: r.equipment,
    players: r.players,
    status: r.status as Request['status'],
    requestDate: r.createdAt.toISOString(),
  }));
}

const ALLOWED_STATUSES = ['accepted', 'rejected', 'cancelled'] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function updateRequestStatus(id: string, status: AllowedStatus): Promise<Request> {
  await requireAdmin();

  const row = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  return {
    id: row.id,
    userName: row.userName,
    userEmail: row.userEmail,
    date: row.date,
    time: row.time,
    court: row.court,
    equipment: row.equipment,
    players: row.players,
    status: row.status as Request['status'],
    requestDate: row.createdAt.toISOString(),
  };
}
