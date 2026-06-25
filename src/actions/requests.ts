'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { promoteWaitlist } from '@/lib/booking-rules';
import { sendBookingStatusEmail } from '@/lib/email';
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

/** Dados do agendamento que já ocupa o horário (para o modal de substituição). */
export interface SlotConflict {
  id: string;
  userName: string;
  date: string;
  time: string;
  court: string;
}

/**
 * Resultado das ações de status. Erros de validação são RETORNADOS (não
 * lançados): o Next.js mascara mensagens de exceções de Server Actions em
 * produção, então retornar preserva a mensagem amigável para o admin.
 * Quando o conflito é um horário já ocupado, `conflict` traz quem o ocupa,
 * permitindo oferecer a substituição.
 */
export type StatusResult =
  | { ok: true }
  | { ok: false; error: string; conflict?: SlotConflict };

export async function updateRequestStatus(id: string, status: AllowedStatus): Promise<StatusResult> {
  try {
    const actor = await requireAdmin();

    const target = await prisma.booking.findUnique({ where: { id } });
    if (!target) return { ok: false, error: 'Agendamento não encontrado' };

    if (status === 'accepted') {
      const conflict = await prisma.booking.findFirst({
        where: { date: target.date, time: target.time, court: target.court, status: 'accepted', NOT: { id } },
      });
      if (conflict) {
        return {
          ok: false,
          error: 'Já existe um agendamento aceito neste horário e quadra.',
          conflict: {
            id: conflict.id,
            userName: conflict.userName,
            date: conflict.date,
            time: conflict.time,
            court: conflict.court,
          },
        };
      }
    }

    await prisma.booking.update({ where: { id }, data: { status } });

    await logAudit(
      actor,
      `booking:${status}`,
      target.userEmail,
      `${target.court} · ${target.date} ${target.time}`,
    );

    // Notifica o usuário sobre a decisão (não bloqueia em caso de falha).
    await sendBookingStatusEmail(target.userEmail, target.userName, status, {
      court: target.court,
      date: target.date,
      time: target.time,
    });

    // Liberou um horário confirmado → promove a lista de espera e avisa o promovido.
    if (target.status === 'accepted' && (status === 'rejected' || status === 'cancelled')) {
      const promoted = await promoteWaitlist(target.date, target.time, target.court);
      if (promoted) {
        const next = await prisma.booking.findFirst({
          where: { userEmail: promoted, date: target.date, time: target.time, court: target.court, status: 'pending' },
        });
        if (next) {
          await sendBookingStatusEmail(next.userEmail, next.userName, 'promoted', {
            court: next.court,
            date: next.date,
            time: next.time,
          });
        }
      }
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao atualizar status' };
  }
}

/**
 * Aceita um pedido SUBSTITUINDO o agendamento que já ocupa o horário/quadra:
 * cancela o aceito atual e aceita este. Usado após o admin confirmar a troca.
 */
export async function acceptRequestOverride(id: string): Promise<StatusResult> {
  try {
    const actor = await requireAdmin();

    const target = await prisma.booking.findUnique({ where: { id } });
    if (!target) return { ok: false, error: 'Agendamento não encontrado' };

    // Cancela o agendamento que ocupa o mesmo horário/quadra (sem promover a
    // lista de espera — a vaga vai direto para este pedido).
    const current = await prisma.booking.findFirst({
      where: { date: target.date, time: target.time, court: target.court, status: 'accepted', NOT: { id } },
    });
    if (current) {
      await prisma.booking.update({ where: { id: current.id }, data: { status: 'cancelled' } });
      await logAudit(
        actor,
        'booking:cancelled',
        current.userEmail,
        `${current.court} · ${current.date} ${current.time} (substituído por outro pedido)`,
      );
      await sendBookingStatusEmail(current.userEmail, current.userName, 'cancelled', {
        court: current.court,
        date: current.date,
        time: current.time,
      });
    }

    await prisma.booking.update({ where: { id }, data: { status: 'accepted' } });
    await logAudit(
      actor,
      'booking:accepted',
      target.userEmail,
      `${target.court} · ${target.date} ${target.time} (substituiu agendamento anterior)`,
    );
    await sendBookingStatusEmail(target.userEmail, target.userName, 'accepted', {
      court: target.court,
      date: target.date,
      time: target.time,
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao substituir agendamento' };
  }
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
): Promise<StatusResult> {
  try {
    const actor = await requireAdmin();

    const items = await prisma.booking.findMany({
      where: { recurringGroupId: groupId, status: { in: ['pending', 'waitlisted'] } },
      orderBy: { date: 'asc' },
    });
    if (items.length === 0) return { ok: false, error: 'Pedido recorrente não encontrado' };

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

    // Um único e-mail resumindo a decisão do horário fixo. Para "aceito" só
    // avisa se ao menos uma data foi efetivada.
    if (status === 'rejected' || changed.length > 0) {
      const first = changed[0] ?? sample;
      await sendBookingStatusEmail(sample.userEmail, sample.userName, status, {
        court: first.court,
        date: first.date,
        time: `${first.time} · horário fixo (toda ${weekday})`,
      });
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao atualizar pedido' };
  }
}

/** Registra a presença (ou falta) em um agendamento confirmado. */
export async function setAttendance(id: string, attended: boolean | null): Promise<StatusResult> {
  try {
    const actor = await requireAdmin();

    const target = await prisma.booking.findUnique({ where: { id } });
    if (!target) return { ok: false, error: 'Agendamento não encontrado' };

    await prisma.booking.update({ where: { id }, data: { attended } });

    await logAudit(
      actor,
      attended === null ? 'attendance:clear' : attended ? 'attendance:present' : 'attendance:absent',
      target.userEmail,
      `${target.court} · ${target.date} ${target.time}`,
    );

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao registrar presença' };
  }
}
