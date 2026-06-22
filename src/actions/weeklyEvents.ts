'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import type { WeeklyEvent } from '@/types';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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

  await logAudit(
    session.email!,
    'weeklyEvent:create',
    data.title,
    `${DAY_NAMES[data.dayOfWeek]} · ${data.time} · ${data.court}`,
  );

  return { id: row.id, dayOfWeek: row.dayOfWeek, time: row.time, court: row.court, title: row.title };
}

export async function deleteWeeklyEvent(id: string): Promise<void> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Sem permissão');

  const row = await prisma.weeklyEvent.findUnique({ where: { id } });
  await prisma.weeklyEvent.delete({ where: { id } });
  await logAudit(session.email!, 'weeklyEvent:delete', row?.title ?? id, row ? `${DAY_NAMES[row.dayOfWeek]} · ${row.time} · ${row.court}` : null);
}
