'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { validateEmailFormat } from '@/utils/emailValidation';
import { createToken, consumeToken } from '@/lib/tokens';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email';

export type LoginResult =
  | { error: string; needsVerification?: boolean }
  | { isAdmin: boolean; name: string };

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: 'E-mail ou senha inválidos' };
  }

  // Confirmação de e-mail é obrigatória para entrar.
  if (!user.emailVerified) {
    return {
      error: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
      needsVerification: true,
    };
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.isAdmin = user.isAdmin;
  await session.save();

  return { isAdmin: user.isAdmin, name: user.name };
}

export type RegisterResult = { error: string } | { pendingVerification: true; email: string };

export async function registerAction(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const emailErr = validateEmailFormat(normalizedEmail);
  if (emailErr) return { error: emailErr };

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return { error: 'Este e-mail já está cadastrado' };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash, isAdmin: false, emailVerified: false },
  });

  // Não cria sessão: o usuário precisa confirmar o e-mail antes de entrar.
  const token = await createToken(user.email, 'email_verify');
  await sendVerificationEmail(user.email, user.name, token);

  return { pendingVerification: true, email: user.email };
}

/** Reenvia o e-mail de confirmação. Resposta genérica para não revelar contas. */
export async function resendVerification(email: string): Promise<{ ok: true }> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user && !user.emailVerified) {
    const token = await createToken(user.email, 'email_verify');
    await sendVerificationEmail(user.email, user.name, token);
  }

  return { ok: true };
}

/**
 * Confirma o e-mail a partir do token do link. Retorna o resultado para a
 * página de verificação exibir sucesso/erro.
 */
export async function verifyEmailAction(token: string): Promise<{ ok: boolean }> {
  const email = await consumeToken(token, 'email_verify');
  if (!email) return { ok: false };

  await prisma.user.updateMany({ where: { email }, data: { emailVerified: true } });
  return { ok: true };
}

/** Inicia a redefinição de senha. Resposta genérica para não revelar contas. */
export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    const token = await createToken(user.email, 'password_reset');
    await sendPasswordResetEmail(user.email, user.name, token);
  }

  return { ok: true };
}

/** Conclui a redefinição de senha a partir do token do link. */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres' };
  }

  const email = await consumeToken(token, 'password_reset');
  if (!email) {
    return { error: 'Link inválido ou expirado. Solicite um novo.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.updateMany({ where: { email }, data: { passwordHash } });

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
