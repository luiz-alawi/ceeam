'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { validateEmailFormat } from '@/utils/emailValidation';

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error: string } | { isAdmin: boolean; name: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: 'E-mail ou senha inválidos' };
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

export async function registerAction(
  name: string,
  email: string,
  password: string,
): Promise<{ error: string } | { isAdmin: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();

  const emailErr = validateEmailFormat(normalizedEmail);
  if (emailErr) return { error: emailErr };

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return { error: 'Este e-mail já está cadastrado' };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash, isAdmin: false },
  });

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.isAdmin = user.isAdmin;
  await session.save();

  return { isAdmin: false };
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
