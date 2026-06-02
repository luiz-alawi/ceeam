import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

// Public
export async function GET() {
  const rows = await prisma.gymClosure.findMany({ orderBy: { date: 'asc' } });
  return NextResponse.json(rows.map((r) => ({ id: r.id, date: r.date, reason: r.reason })));
}

// Admin only
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.date || !body?.reason) {
    return NextResponse.json({ error: 'Data e motivo são obrigatórios' }, { status: 400 });
  }

  const row = await prisma.gymClosure.create({ data: { date: body.date, reason: body.reason } });
  return NextResponse.json({ id: row.id, date: row.date, reason: row.reason }, { status: 201 });
}
