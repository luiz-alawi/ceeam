'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { Booking } from '@/types';

export async function getBookings(userEmail: string): Promise<Booking[]> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Não autenticado');

  const rows = await prisma.booking.findMany({
    where: { userEmail },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    time: r.time,
    court: r.court,
    equipment: r.equipment,
    players: r.players,
    status: r.status as Booking['status'],
  }));
}

export async function createBooking(data: {
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  court: string;
  equipment: string[];
  players: string[];
}): Promise<Booking> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Não autenticado');

  const closure = await prisma.gymClosure.findFirst({ where: { date: data.date } });
  if (closure) {
    throw new Error(`O ginásio está fechado neste dia: ${closure.reason}`);
  }

  const dayOfWeek = new Date(data.date + 'T12:00:00').getDay();
  const weeklyConflict = await prisma.weeklyEvent.findFirst({
    where: { dayOfWeek, time: data.time, court: data.court },
  });
  if (weeklyConflict) {
    throw new Error(`Este horário está reservado para: ${weeklyConflict.title}`);
  }

  const bookingConflict = await prisma.booking.findFirst({
    where: { date: data.date, time: data.time, court: data.court, status: 'accepted' },
  });
  if (bookingConflict) {
    throw new Error('Este horário já está reservado para esta quadra.');
  }

  const row = await prisma.booking.create({
    data: {
      userName: data.userName,
      userEmail: data.userEmail,
      date: data.date,
      time: data.time,
      court: data.court,
      equipment: data.equipment,
      players: data.players,
      status: 'pending',
    },
  });

  return {
    id: row.id,
    date: row.date,
    time: row.time,
    court: row.court,
    equipment: row.equipment,
    players: row.players,
    status: row.status as Booking['status'],
  };
}

export async function cancelBooking(id: string): Promise<void> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Não autenticado');

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error('Agendamento não encontrado');
  if (booking.userEmail !== session.email) throw new Error('Sem permissão');
  if (booking.status === 'rejected' || booking.status === 'cancelled') {
    throw new Error('Este agendamento não pode ser cancelado');
  }

  await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } });
}
