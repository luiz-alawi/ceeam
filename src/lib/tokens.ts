import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export type TokenType = 'email_verify' | 'password_reset';

// Tempo de validade por tipo de token.
const TTL_MS: Record<TokenType, number> = {
  email_verify: 24 * 60 * 60 * 1000, // 24h
  password_reset: 60 * 60 * 1000, // 1h
};

/** Hash determinístico (SHA-256) usado para guardar o token sem o valor em claro. */
function hash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Cria um token de uso único para o e-mail/tipo informado e devolve o valor
 * em claro (que vai no link enviado por e-mail). Tokens pendentes anteriores
 * do mesmo tipo/e-mail são invalidados para evitar links órfãos válidos.
 */
export async function createToken(email: string, type: TokenType): Promise<string> {
  await prisma.token.deleteMany({ where: { email, type, usedAt: null } });

  const raw = crypto.randomBytes(32).toString('hex');
  await prisma.token.create({
    data: {
      type,
      tokenHash: hash(raw),
      email,
      expiresAt: new Date(Date.now() + TTL_MS[type]),
    },
  });
  return raw;
}

/**
 * Valida e consome um token. Retorna o e-mail associado se o token existir,
 * for do tipo certo, não estiver usado nem expirado; caso contrário, null.
 * O token é marcado como usado na mesma operação (uso único).
 */
export async function consumeToken(raw: string, type: TokenType): Promise<string | null> {
  if (!raw) return null;

  const row = await prisma.token.findUnique({ where: { tokenHash: hash(raw) } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) {
    return null;
  }

  await prisma.token.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return row.email;
}
