import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

const ALLOWED_STATUSES = ['accepted', 'rejected', 'cancelled'] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.status || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status deve ser um de: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const { id } = await params;
  const status = body.status as AllowedStatus;

  if (status === 'accepted') {
    const target = await prisma.booking.findUnique({ where: { id } });
    if (target) {
      const conflict = await prisma.booking.findFirst({
        where: { date: target.date, time: target.time, court: target.court, status: 'accepted', NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: 'Já existe um agendamento aceito neste horário e quadra.' },
          { status: 409 },
        );
      }
    }
  }

  const row = await prisma.booking.update({ where: { id }, data: { status } });

  return NextResponse.json({
    id: row.id,
    userName: row.userName,
    userEmail: row.userEmail,
    date: row.date,
    time: row.time,
    court: row.court,
    equipment: row.equipment,
    players: row.players,
    status: row.status,
    requestDate: row.createdAt.toISOString(),
  });
}
