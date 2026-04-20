// prisma/index.ts — Prisma singleton for AWS RDS
// Using a singleton prevents Prisma from opening a new connection pool
// on every module evaluation (which happens on hot-reloads in Next.js dev).
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Store in all environments — not just dev — so the singleton survives
// Next.js module re-evaluation in both dev hot-reloads and edge cold-starts.
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}