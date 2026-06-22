'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { promoteWaitlist } from '@/lib/booking-rules';
import type { Request } from '@/types';

async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Acesso negado');
  return session.email!;
}

function toRequest(r: {
  id: string; userName: string; userEmail: string; date: string; time: string;
  court: string; equipment: string[]; players: string[]; status: string;
  attended: boolean | null; recurringGroupId: string | null; reason: string | null; createdAt: Date;
}): Request {
  return {
    id: r.id,
    userName: r.userName,
    userEmail: r.userEmail,
    date: r.date,
    time: r.time,
    court: r.court,
    equipment: r.equipment,
    players: r.players,
    status: r.status as Request['status'],
    attended: r.attended,
    recurringGroupId: r.recurringGroupId,
    reason: r.reason,
    requestDate: r.createdAt.toISOString(),
  };
}

export async function getRequests(): Promise<Request[]> {
  await requireAdmin();

  const rows = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return rows.map(toRequest);
}

const ALLOWED_STATUSES = ['accepted', 'rejected', 'cancelled'] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function updateRequestStatus(id: string, status: AllowedStatus): Promise<Request> {
  const actor = await requireAdmin();

  const target = await prisma.booking.findUnique({ where: { id } });
  if (!target) throw new Error('Agendamento não encontrado');

  if (status === 'accepted') {
    const conflict = await prisma.booking.findFirst({
      where: { date: target.date, time: target.time, court: target.court, status: 'accepted', NOT: { id } },
    });
    if (conflict) throw new Error('Já existe um agendamento aceito neste horário e quadra.');
  }

  const row = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  await logAudit(
    actor,
    `booking:${status}`,
    target.userEmail,
    `${target.court} · ${target.date} ${target.time}`,
  );

  // Liberou um horário confirmado → promove a lista de espera.
  if (target.status === 'accepted' && (status === 'rejected' || status === 'cancelled')) {
    await promoteWaitlist(target.date, target.time, target.court);
  }

  return toRequest(row);
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/**
 * Aceita ou recusa um pedido de horário fixo (recorrente) por inteiro.
 * Gera UM único registro de auditoria descrevendo a recorrência (dia da semana
 * e datas ocupadas), em vez de um por ocorrência.
 */
export async function updateRecurringGroupStatus(
  groupId: string,
  status: 'accepted' | 'rejected',
): Promise<Request[]> {
  const actor = await requireAdmin();

  const items = await prisma.booking.findMany({
    where: { recurringGroupId: groupId, status: { in: ['pending', 'waitlisted'] } },
    orderBy: { date: 'asc' },
  });
  if (items.length === 0) throw new Error('Pedido recorrente não encontrado');

  const changed: typeof items = [];
  for (const it of items) {
    if (status === 'accepted') {
      const conflict = await prisma.booking.findFirst({
        where: { date: it.date, time: it.time, court: it.court, status: 'accepted', NOT: { id: it.id } },
      });
      if (conflict) continue; // pula datas já reservadas por outro pedido
    }
    await prisma.booking.update({ where: { id: it.id }, data: { status } });
    changed.push(it);
  }

  const sample = items[0];
  const weekday = WEEKDAYS[new Date(sample.date + 'T12:00:00').getDay()];
  const fmt = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const skipped = items.length - changed.length;
  const dates = changed.map((c) => fmt(c.date)).join(', ');
  const detail =
    `Toda ${weekday} · ${sample.court} · ${sample.time} · ` +
    `ocupa ${changed.length} data(s)${dates ? `: ${dates}` : ''}` +
    (skipped > 0 ? ` (${skipped} pulada(s) por conflito)` : '');

  await logAudit(
    actor,
    status === 'accepted' ? 'recurring:accepted' : 'recurring:rejected',
    sample.userEmail,
    detail,
  );

  const updated = await prisma.booking.findMany({ where: { recurringGroupId: groupId } });
  return updated.map(toRequest);
}

/** Registra a presença (ou falta) em um agendamento confirmado. */
export async function setAttendance(id: string, attended: boolean | null): Promise<Request> {
  const actor = await requireAdmin();

  const target = await prisma.booking.findUnique({ where: { id } });
  if (!target) throw new Error('Agendamento não encontrado');

  const row = await prisma.booking.update({ where: { id }, data: { attended } });

  await logAudit(
    actor,
    attended === null ? 'attendance:clear' : attended ? 'attendance:present' : 'attendance:absent',
    target.userEmail,
    `${target.court} · ${target.date} ${target.time}`,
  );

  return toRequest(row);
}
