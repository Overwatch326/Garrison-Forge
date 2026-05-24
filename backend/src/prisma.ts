import { PrismaClient } from '@prisma/client';

// Singleton Prisma client for the backend.
// In a real deployment you may want to tune this for serverless, etc.
export const prisma = new PrismaClient();
