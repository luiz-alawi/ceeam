'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export interface ReportData {
  period: { from: string; to: string };
  total: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  pending: number;
  acceptanceRate: number;
  byCourt: { court: string; count: number }[];
  topTimeSlots: { time: string; count: number }[];
  byDayOfWeek: { day: number; count: number }[];
  topUsers: { email: string; name: string; count: number }[];
  byEquipment: { equipment: string; count: number }[];
}

export async function getReportData(): Promise<ReportData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Sem permissão');

  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  const fromDate = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
  const toDate = new Date().toISOString().split('T')[0];

  const bookings = await prisma.booking.findMany({
    where: { date: { gte: fromDate } },
  });

  const total     = bookings.length;
  const accepted  = bookings.filter((b) => b.status === 'accepted').length;
  const rejected  = bookings.filter((b) => b.status === 'rejected').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  const pending   = bookings.filter((b) => b.status === 'pending').length;

  // Por quadra
  const courtMap = new Map<string, number>();
  bookings.forEach((b) => courtMap.set(b.court, (courtMap.get(b.court) ?? 0) + 1));
  const byCourt = [...courtMap.entries()]
    .map(([court, count]) => ({ court, count }))
    .sort((a, b) => b.count - a.count);

  // Horários mais populares
  const timeMap = new Map<string, number>();
  bookings.forEach((b) => timeMap.set(b.time, (timeMap.get(b.time) ?? 0) + 1));
  const topTimeSlots = [...timeMap.entries()]
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Por dia da semana
  const dowMap = new Map<number, number>();
  bookings.forEach((b) => {
    const dow = new Date(b.date + 'T12:00:00').getDay();
    dowMap.set(dow, (dowMap.get(dow) ?? 0) + 1);
  });
  const byDayOfWeek = Array.from({ length: 7 }, (_, i) => ({ day: i, count: dowMap.get(i) ?? 0 }));

  // Top usuários
  const userMap = new Map<string, { name: string; count: number }>();
  bookings.forEach((b) => {
    if (!userMap.has(b.userEmail)) userMap.set(b.userEmail, { name: b.userName, count: 0 });
    userMap.get(b.userEmail)!.count++;
  });
  const topUsers = [...userMap.entries()]
    .map(([email, { name, count }]) => ({ email, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Equipamentos
  const eqMap = new Map<string, number>();
  bookings.forEach((b) => b.equipment.forEach((eq) => eqMap.set(eq, (eqMap.get(eq) ?? 0) + 1)));
  const byEquipment = [...eqMap.entries()]
    .map(([equipment, count]) => ({ equipment, count }))
    .sort((a, b) => b.count - a.count);

  return {
    period: { from: fromDate, to: toDate },
    total, accepted, rejected, cancelled, pending,
    acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    byCourt, topTimeSlots, byDayOfWeek, topUsers, byEquipment,
  };
}
