import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.weeklyEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

  await prisma.weeklyEvent.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
