import { prisma } from '@/lib/prisma';

/**
 * Registra uma ação administrativa na trilha de auditoria.
 * Nunca lança erro para não quebrar a operação principal.
 */
export async function logAudit(
  actorEmail: string,
  action: string,
  target?: string | null,
  details?: string | null,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorEmail,
        action,
        target: target ?? null,
        details: details ?? null,
      },
    });
  } catch (e) {
    console.error('Falha ao registrar auditoria:', e);
  }
}
