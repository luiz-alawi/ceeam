'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { CalendarEntry, GymClosure, WeeklyEvent } from '@/types';

export async function getCalendarData(): Promise<{
  bookings: CalendarEntry[];
  closures: GymClosure[];
  weeklyEvents: WeeklyEvent[];
}> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Não autenticado');

  const [rows, closureRows, weeklyRows] = await Promise.all([
    prisma.booking.findMany({
      where: { status: 'accepted' },
      select: { date: true, court: true, time: true, userName: true },
    }),
    prisma.gymClosure.findMany({ orderBy: { date: 'asc' } }),
    prisma.weeklyEvent.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }] }),
  ]);

  return {
    bookings: rows,
    closures: closureRows.map((r) => ({ id: r.id, date: r.date, reason: r.reason })),
    weeklyEvents: weeklyRows.map((r) => ({
      id: r.id,
      dayOfWeek: r.dayOfWeek,
      time: r.time,
      court: r.court,
      title: r.title,
    })),
  };
}
