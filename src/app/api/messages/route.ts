import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const rows = await prisma.message.findMany({
    where: { userEmail: auth.email },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    rows.map((r) => ({ id: r.id, text: r.text, sender: r.sender, timestamp: r.createdAt })),
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.text) {
    return NextResponse.json({ error: 'text é obrigatório' }, { status: 400 });
  }

  // Non-admins can only send as 'user'
  const sender = auth.isAdmin && body.sender === 'admin' ? 'admin' : 'user';

  const row = await prisma.message.create({
    data: { text: body.text, sender, userEmail: auth.email },
  });

  return NextResponse.json(
    { id: row.id, text: row.text, sender: row.sender, timestamp: row.createdAt },
    { status: 201 },
  );
}
