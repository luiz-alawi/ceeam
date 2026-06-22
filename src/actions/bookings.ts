'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { validateBookingRules, getBookingSettings, promoteWaitlist } from '@/lib/booking-rules';
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
    attended: r.attended,
    recurringGroupId: r.recurringGroupId,
    reason: r.reason,
  }));
}

/** Verifica se um horário/quadra está bloqueado por fechamento ou treino fixo. */
async function checkBlocked(date: string, time: string, court: string): Promise<string | null> {
  const closure = await prisma.gymClosure.findFirst({ where: { date } });
  if (closure) return `O ginásio está fechado neste dia: ${closure.reason}`;

  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const weeklyConflict = await prisma.weeklyEvent.findFirst({
    where: { dayOfWeek, time, court },
  });
  if (weeklyConflict) return `Este horário está reservado para: ${weeklyConflict.title}`;

  return null;
}

/** Cria um agendamento individual. Retorna a reserva (pode ficar em lista de espera). */
async function createOne(
  data: {
    userName: string;
    userEmail: string;
    date: string;
    time: string;
    court: string;
    equipment: string[];
    players: string[];
  },
  recurringGroupId?: string,
  ruleOpts?: { skipMaxAdvance?: boolean; skipWeeklyCap?: boolean },
  reason?: string,
): Promise<Booking> {
  const blocked = await checkBlocked(data.date, data.time, data.court);
  if (blocked) throw new Error(blocked);

  const ruleError = await validateBookingRules(data.userEmail, data.date, data.time, ruleOpts);
  if (ruleError) throw new Error(ruleError);

  // Horário já reservado → lista de espera (se habilitada) ou erro.
  const taken = await prisma.booking.findFirst({
    where: { date: data.date, time: data.time, court: data.court, status: 'accepted' },
  });

  let status: Booking['status'] = 'pending';
  if (taken) {
    const settings = await getBookingSettings();
    if (!settings.waitlistEnabled) {
      throw new Error('Este horário já está reservado para esta quadra.');
    }
    status = 'waitlisted';
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
      status,
      recurringGroupId: recurringGroupId ?? null,
      reason: reason ?? null,
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
    attended: row.attended,
    recurringGroupId: row.recurringGroupId,
    reason: row.reason,
  };
}

/**
 * Resultado de criação. Erros de validação são RETORNADOS (não lançados):
 * o Next.js mascara mensagens de exceções de Server Actions em produção,
 * então retornar preserva a mensagem amigável para o usuário.
 */
export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: string };

export async function createBooking(data: {
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  court: string;
  equipment: string[];
  players: string[];
  playerCount: number;
}): Promise<CreateBookingResult> {
  const session = await getSession();
  if (!session.isLoggedIn) return { ok: false, error: 'Não autenticado' };

  if (!Number.isInteger(data.playerCount) || data.playerCount < 1) {
    return { ok: false, error: 'Informe quantas pessoas vão jogar.' };
  }
  const players = data.players.map((p) => p.trim()).filter(Boolean);
  if (new Set(players).size !== players.length) {
    return { ok: false, error: 'Há jogadores repetidos na lista.' };
  }
  if (players.length !== data.playerCount) {
    return { ok: false, error: `A lista deve ter exatamente ${data.playerCount} jogador(es).` };
  }

  const { playerCount: _ignored, ...rest } = data;
  try {
    const booking = await createOne({ ...rest, players });
    return { ok: true, booking };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao criar agendamento' };
  }
}

/**
 * Cria um agendamento recorrente semanal por `weeks` semanas (incluindo a
 * primeira). Ocorrências em datas bloqueadas/cheias são puladas. Retorna as
 * reservas criadas e quantas foram puladas.
 */
export async function createRecurringBooking(
  data: {
    userName: string;
    userEmail: string;
    date: string;
    time: string;
    court: string;
    equipment: string[];
    players: string[];
    reason: string;
  },
  weeks: number,
): Promise<
  | { ok: true; created: Booking[]; skipped: number }
  | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session.isLoggedIn) return { ok: false, error: 'Não autenticado' };

  if (!data.reason || data.reason.trim().length < 15) {
    return { ok: false, error: 'Informe a justificativa do horário fixo (mínimo 15 caracteres).' };
  }

  const total = Math.min(Math.max(weeks, 1), 12);
  const groupId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const base = new Date(data.date + 'T12:00:00');

  const created: Booking[] = [];
  let skipped = 0;
  let firstError: string | null = null;

  for (let i = 0; i < total; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i * 7);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    try {
      const booking = await createOne(
        { ...data, date: ymd },
        groupId,
        { skipMaxAdvance: true, skipWeeklyCap: true },
        data.reason.trim(),
      );
      created.push(booking);
    } catch (e) {
      skipped++;
      if (!firstError) firstError = e instanceof Error ? e.message : 'erro';
    }
  }

  if (created.length === 0) {
    return { ok: false, error: firstError ?? 'Nenhuma data disponível para a recorrência.' };
  }

  return { ok: true, created, skipped };
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

  const wasAccepted = booking.status === 'accepted';
  await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } });

  // Liberou um horário confirmado → promove a lista de espera.
  if (wasAccepted) {
    await promoteWaitlist(booking.date, booking.time, booking.court);
  }
}
