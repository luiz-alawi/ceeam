import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateEmailFormat } from '@/utils/emailValidation';
import { createToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 });
  }

  const normalizedEmail = body.email.toLowerCase().trim();
  const emailErr = validateEmailFormat(normalizedEmail);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 409 });

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: { name: body.name.trim(), email: normalizedEmail, passwordHash, isAdmin: false, emailVerified: false },
  });

  // Não cria sessão: é necessário confirmar o e-mail antes de entrar.
  const token = await createToken(user.email, 'email_verify');
  await sendVerificationEmail(user.email, user.name, token);

  return NextResponse.json({ pendingVerification: true, email: user.email }, { status: 201 });
}
