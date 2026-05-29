'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { WeeklyEvent } from '@/types';

export async function getWeeklyEvents(): Promise<WeeklyEvent[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Não autenticado');

  const rows = await prisma.weeklyEvent.findMany({
    orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
  });

  return rows.map((r) => ({
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    time: r.time,
    court: r.court,
    title: r.title,
  }));
}

export async function createWeeklyEvent(data: {
  dayOfWeek: number;
  time: string;
  court: string;
  title: string;
}): Promise<WeeklyEvent> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Sem permissão');

  const row = await prisma.weeklyEvent.create({ data });

  return { id: row.id, dayOfWeek: row.dayOfWeek, time: row.time, court: row.court, title: row.title };
}

export async function deleteWeeklyEvent(id: string): Promise<void> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Sem permissão');

  await prisma.weeklyEvent.delete({ where: { id } });
}
