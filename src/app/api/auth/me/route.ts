import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    userId: auth.userId,
    name: auth.name,
    email: auth.email,
    isAdmin: auth.isAdmin ?? false,
  });
}
