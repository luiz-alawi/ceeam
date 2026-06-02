import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  const fromDate = from.toISOString().split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];

  const bookings = await prisma.booking.findMany({ where: { date: { gte: fromDate } } });

  const total     = bookings.length;
  const accepted  = bookings.filter((b) => b.status === 'accepted').length;
  const rejected  = bookings.filter((b) => b.status === 'rejected').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  const pending   = bookings.filter((b) => b.status === 'pending').length;

  const courtMap = new Map<string, number>();
  bookings.forEach((b) => courtMap.set(b.court, (courtMap.get(b.court) ?? 0) + 1));
  const byCourt = [...courtMap.entries()]
    .map(([court, count]) => ({ court, count }))
    .sort((a, b) => b.count - a.count);

  const timeMap = new Map<string, number>();
  bookings.forEach((b) => timeMap.set(b.time, (timeMap.get(b.time) ?? 0) + 1));
  const topTimeSlots = [...timeMap.entries()]
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const dowMap = new Map<number, number>();
  bookings.forEach((b) => {
    const dow = new Date(b.date + 'T12:00:00').getDay();
    dowMap.set(dow, (dowMap.get(dow) ?? 0) + 1);
  });
  const byDayOfWeek = Array.from({ length: 7 }, (_, i) => ({ day: i, count: dowMap.get(i) ?? 0 }));

  const userMap = new Map<string, { name: string; count: number }>();
  bookings.forEach((b) => {
    if (!userMap.has(b.userEmail)) userMap.set(b.userEmail, { name: b.userName, count: 0 });
    userMap.get(b.userEmail)!.count++;
  });
  const topUsers = [...userMap.entries()]
    .map(([email, { name, count }]) => ({ email, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const eqMap = new Map<string, number>();
  bookings.forEach((b) => b.equipment.forEach((eq) => eqMap.set(eq, (eqMap.get(eq) ?? 0) + 1)));
  const byEquipment = [...eqMap.entries()]
    .map(([equipment, count]) => ({ equipment, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    period: { from: fromDate, to: toDate },
    total, accepted, rejected, cancelled, pending,
    acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    byCourt, topTimeSlots, byDayOfWeek, topUsers, byEquipment,
  });
}
