'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { getBookingSettings } from '@/lib/booking-rules';
import type { BookingSettings } from '@/types';

async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Acesso negado');
  return session.email!;
}

export async function getSettings(): Promise<BookingSettings> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Não autenticado');
  return getBookingSettings();
}

export async function updateSettings(data: BookingSettings): Promise<BookingSettings> {
  const actor = await requireAdmin();

  const clean: BookingSettings = {
    maxPerUserPerWeek: Math.max(0, Math.min(50, Math.round(data.maxPerUserPerWeek))),
    minAdvanceHours: Math.max(0, Math.min(168, Math.round(data.minAdvanceHours))),
    maxAdvanceDays: Math.max(0, Math.min(365, Math.round(data.maxAdvanceDays))),
    waitlistEnabled: !!data.waitlistEnabled,
  };

  const existing = await prisma.settings.findFirst();
  const row = existing
    ? await prisma.settings.update({ where: { id: existing.id }, data: clean })
    : await prisma.settings.create({ data: clean });

  await logAudit(
    actor,
    'settings:update',
    null,
    `máx/semana=${clean.maxPerUserPerWeek}, antec.mín=${clean.minAdvanceHours}h, antec.máx=${clean.maxAdvanceDays}d, espera=${clean.waitlistEnabled ? 'on' : 'off'}`,
  );

  return {
    maxPerUserPerWeek: row.maxPerUserPerWeek,
    minAdvanceHours: row.minAdvanceHours,
    maxAdvanceDays: row.maxAdvanceDays,
    waitlistEnabled: row.waitlistEnabled,
  };
}
