import { getPrismaClient } from "../../lib/prisma";

type CreateUrlRecordInput = {
  originalUrl: string;
  shortCode: string;
  expiresAt?: Date | null;
};

export async function createUrlRecord(input: CreateUrlRecordInput) {
  const prisma = getPrismaClient();

  const data = {
    shortCode: input.shortCode,
    originalUrl: input.originalUrl,
    isActive: true,
    ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
  };

  return prisma.url.create({
    data,
  });
}

export async function findUrlByShortCode(shortCode: string) {
  const prisma = getPrismaClient();

  return prisma.url.findUnique({
    where: {
      shortCode,
    },
  });
}

export async function incrementClickCount(id: string) {
  const prisma = getPrismaClient();

  return prisma.url.update({
    where: { id },
    data: {
      clickCount: {
        increment: 1,
      },
    },
  });
}
