'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { Message } from '@/types';

async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Não autenticado');
}

export async function getMessages(userEmail: string): Promise<Message[]> {
  await requireAuth();

  const rows = await prisma.message.findMany({
    where: { userEmail },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    sender: r.sender as Message['sender'],
    timestamp: r.createdAt,
  }));
}

export async function sendMessage(data: {
  text: string;
  sender: 'admin' | 'user';
  userEmail: string;
}): Promise<Message> {
  await requireAuth();

  const row = await prisma.message.create({
    data: { text: data.text, sender: data.sender, userEmail: data.userEmail },
  });

  return {
    id: row.id,
    text: row.text,
    sender: row.sender as Message['sender'],
    timestamp: row.createdAt,
  };
}
