import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { validateEmailFormat } from '@/utils/emailValidation';

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
    data: { name: body.name.trim(), email: normalizedEmail, passwordHash, isAdmin: false },
  });

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.isAdmin = false;
  await session.save();

  return NextResponse.json({ name: user.name, email: user.email, isAdmin: false }, { status: 201 });
}
