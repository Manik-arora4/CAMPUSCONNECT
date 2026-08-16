import { prisma } from '../lib/prisma.js';

export async function connectDB() {
  await prisma.$connect();
  console.log('[db] Connected to PostgreSQL (Supabase)');
  return { ephemeral: false };
}

export async function disconnectDB() {
  await prisma.$disconnect();
}
