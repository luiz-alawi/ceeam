import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public — no auth required
export async function GET() {
  const [bookings, closures, weeklyEvents] = await Promise.all([
    prisma.booking.findMany({
      where: { status: 'accepted' },
      select: { date: true, court: true, time: true, userName: true },
    }),
    prisma.gymClosure.findMany({ orderBy: { date: 'asc' } }),
    prisma.weeklyEvent.findMany({ orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }] }),
  ]);

  return NextResponse.json({
    bookings,
    closures: closures.map((r) => ({ id: r.id, date: r.date, reason: r.reason })),
    weeklyEvents: weeklyEvents.map((r) => ({
      id: r.id,
      dayOfWeek: r.dayOfWeek,
      time: r.time,
      court: r.court,
      title: r.title,
    })),
  });
}
