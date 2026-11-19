import { PrismaClient } from '@prisma/client';
import { env } from './env';

process.env.MONGODB_URI ??= env.MONGODB_URI;

export const prisma = new PrismaClient();

export async function connectDatabase() {
  await prisma.$connect();
  console.log('MongoDB connected successfully via Prisma');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
