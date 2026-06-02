import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { validateEmailFormat } from '@/utils/emailValidation';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
  }

  const emailErr = validateEmailFormat(body.email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase().trim() },
  });

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.isAdmin = user.isAdmin;
  await session.save();

  return NextResponse.json({ name: user.name, email: user.email, isAdmin: user.isAdmin });
}
