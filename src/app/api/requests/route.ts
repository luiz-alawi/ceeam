import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

// Admin only — returns all bookings as requests
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const rows = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      userName: r.userName,
      userEmail: r.userEmail,
      date: r.date,
      time: r.time,
      court: r.court,
      equipment: r.equipment,
      players: r.players,
      status: r.status,
      requestDate: r.createdAt.toISOString(),
    })),
  );
}
