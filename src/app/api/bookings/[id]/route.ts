import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// Cancel a booking (owner only)
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  if (booking.userEmail !== auth.email) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  if (booking.status === 'rejected' || booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Este agendamento não pode ser cancelado' }, { status: 409 });
  }

  const updated = await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
