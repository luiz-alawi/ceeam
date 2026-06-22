import { prisma } from '@/lib/prisma';
import type { BookingSettings } from '@/types';

const DEFAULTS: BookingSettings = {
  maxPerUserPerWeek: 3,
  minAdvanceHours: 0,
  maxAdvanceDays: 30,
  waitlistEnabled: true,
};

/** Lê as regras de agendamento, criando o documento padrão se não existir. */
export async function getBookingSettings(): Promise<BookingSettings> {
  let row = await prisma.settings.findFirst();
  if (!row) {
    row = await prisma.settings.create({ data: DEFAULTS });
  }
  return {
    maxPerUserPerWeek: row.maxPerUserPerWeek,
    minAdvanceHours: row.minAdvanceHours,
    maxAdvanceDays: row.maxAdvanceDays,
    waitlistEnabled: row.waitlistEnabled,
  };
}

/** Extrai o horário inicial ("09:00") de um slot "09:00 - 10:00". */
function slotStart(time: string): string {
  return time.split('-')[0].trim();
}

// O servidor de produção (Vercel) roda em UTC. Toda a lógica de "hoje" e
// "horário já passou" precisa ser no fuso de Brasília, senão um usuário
// agendando à noite recebe "data passada" indevidamente.
const TZ = 'America/Sao_Paulo';

/** Data de hoje (YYYY-MM-DD) no fuso de Brasília, independente do fuso do servidor. */
function todayInBrazil(): string {
  // 'en-CA' formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/**
 * Instante exato de um horário local de Brasília ("YYYY-MM-DD" + "HH:MM").
 * O Brasil não adota horário de verão desde 2019 → offset fixo -03:00.
 */
function brazilInstant(date: string, hhmm: string): Date {
  return new Date(`${date}T${hhmm}:00-03:00`);
}

/** Soma `days` dias a uma data YYYY-MM-DD (aritmética em UTC, livre de fuso). */
function addDaysYMD(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Início (segunda) e fim (domingo) da semana ISO de uma data YYYY-MM-DD. */
function weekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay(); // 0=Dom
  const diffToMonday = (dow + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const ymd = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  return { start: ymd(monday), end: ymd(sunday) };
}

/**
 * Valida as regras de agendamento configuráveis. Retorna uma mensagem de erro
 * ou null se estiver tudo certo. `skipMaxAdvance` é usado em ocorrências futuras
 * de agendamentos recorrentes.
 */
export async function validateBookingRules(
  userEmail: string,
  date: string,
  time: string,
  opts: { skipMaxAdvance?: boolean; skipWeeklyCap?: boolean } = {},
): Promise<string | null> {
  const settings = await getBookingSettings();
  const now = new Date();
  const today = todayInBrazil();

  if (date < today) {
    return 'Não é possível agendar em uma data passada.';
  }

  // Horário já passado no dia de hoje
  if (date === today) {
    const start = brazilInstant(date, slotStart(time));
    if (start.getTime() <= now.getTime()) {
      return 'Este horário já passou.';
    }
  }

  // Antecedência mínima
  if (settings.minAdvanceHours > 0) {
    const start = brazilInstant(date, slotStart(time));
    const minMs = settings.minAdvanceHours * 60 * 60 * 1000;
    if (start.getTime() - now.getTime() < minMs) {
      return `É necessário agendar com pelo menos ${settings.minAdvanceHours}h de antecedência.`;
    }
  }

  // Antecedência máxima
  if (!opts.skipMaxAdvance && settings.maxAdvanceDays > 0) {
    const limitYmd = addDaysYMD(today, settings.maxAdvanceDays);
    if (date > limitYmd) {
      return `Só é possível agendar com até ${settings.maxAdvanceDays} dias de antecedência.`;
    }
  }

  // Limite de reservas por semana
  if (!opts.skipWeeklyCap && settings.maxPerUserPerWeek > 0) {
    const { start, end } = weekRange(date);
    const count = await prisma.booking.count({
      where: {
        userEmail,
        date: { gte: start, lte: end },
        status: { in: ['pending', 'accepted', 'waitlisted'] },
      },
    });
    if (count >= settings.maxPerUserPerWeek) {
      return `Você atingiu o limite de ${settings.maxPerUserPerWeek} reservas nesta semana.`;
    }
  }

  return null;
}

/**
 * Quando um horário aceito é liberado (recusado/cancelado), promove o pedido
 * de lista de espera mais antigo daquele horário/quadra para "pending".
 * Retorna o e-mail do promovido, se houver.
 */
export async function promoteWaitlist(
  date: string,
  time: string,
  court: string,
): Promise<string | null> {
  const next = await prisma.booking.findFirst({
    where: { date, time, court, status: 'waitlisted' },
    orderBy: { createdAt: 'asc' },
  });
  if (!next) return null;

  await prisma.booking.update({
    where: { id: next.id },
    data: { status: 'pending' },
  });
  return next.userEmail;
}
