import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public — returns only non-sensitive fields
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  return NextResponse.json(user);
}
