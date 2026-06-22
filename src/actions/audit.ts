'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { AuditEntry } from '@/types';

export async function getAuditLogs(limit = 100): Promise<AuditEntry[]> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) throw new Error('Acesso negado');

  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 500),
  });

  const emails = new Set<string>();
  for (const r of rows) {
    emails.add(r.actorEmail);
    if (r.target && r.target.includes('@')) emails.add(r.target);
  }
  const users = await prisma.user.findMany({
    where: { email: { in: [...emails] } },
    select: { email: true, name: true },
  });
  const nameByEmail = new Map(users.map((u) => [u.email, u.name]));

  return rows.map((r) => ({
    id: r.id,
    actorEmail: r.actorEmail,
    actorName: nameByEmail.get(r.actorEmail) ?? null,
    action: r.action,
    target: r.target,
    targetName: r.target ? nameByEmail.get(r.target) ?? null : null,
    details: r.details,
    createdAt: r.createdAt.toISOString(),
  }));
}
