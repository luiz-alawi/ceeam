import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

// Public
export async function GET() {
  const rows = await prisma.weeklyEvent.findMany({
    orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
  });
  return NextResponse.json(
    rows.map((r) => ({ id: r.id, dayOfWeek: r.dayOfWeek, time: r.time, court: r.court, title: r.title })),
  );
}

// Admin only
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (body?.dayOfWeek == null || !body?.time || !body?.court || !body?.title) {
    return NextResponse.json({ error: 'dayOfWeek, time, court e title são obrigatórios' }, { status: 400 });
  }

  const row = await prisma.weeklyEvent.create({
    data: { dayOfWeek: body.dayOfWeek, time: body.time, court: body.court, title: body.title },
  });

  return NextResponse.json(
    { id: row.id, dayOfWeek: row.dayOfWeek, time: row.time, court: row.court, title: row.title },
    { status: 201 },
  );
}
