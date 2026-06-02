import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// Returns bookings for the authenticated user
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const rows = await prisma.booking.findMany({
    where: { userEmail: auth.email },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      date: r.date,
      time: r.time,
      court: r.court,
      equipment: r.equipment,
      players: r.players,
      status: r.status,
    })),
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.date || !body?.time || !body?.court) {
    return NextResponse.json({ error: 'date, time e court são obrigatórios' }, { status: 400 });
  }

  const closure = await prisma.gymClosure.findFirst({ where: { date: body.date } });
  if (closure) {
    return NextResponse.json({ error: `O ginásio está fechado neste dia: ${closure.reason}` }, { status: 409 });
  }

  const dayOfWeek = new Date(body.date + 'T12:00:00').getDay();
  const weeklyConflict = await prisma.weeklyEvent.findFirst({
    where: { dayOfWeek, time: body.time, court: body.court },
  });
  if (weeklyConflict) {
    return NextResponse.json(
      { error: `Este horário está reservado para: ${weeklyConflict.title}` },
      { status: 409 },
    );
  }

  const bookingConflict = await prisma.booking.findFirst({
    where: { date: body.date, time: body.time, court: body.court, status: 'accepted' },
  });
  if (bookingConflict) {
    return NextResponse.json({ error: 'Este horário já está reservado para esta quadra.' }, { status: 409 });
  }

  const row = await prisma.booking.create({
    data: {
      userName: auth.name,
      userEmail: auth.email,
      date: body.date,
      time: body.time,
      court: body.court,
      equipment: body.equipment ?? [],
      players: body.players ?? [],
      status: 'pending',
    },
  });

  return NextResponse.json(
    {
      id: row.id,
      date: row.date,
      time: row.time,
      court: row.court,
      equipment: row.equipment,
      players: row.players,
      status: row.status,
    },
    { status: 201 },
  );
}
