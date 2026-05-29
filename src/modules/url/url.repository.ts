import { getPrismaClient } from "../../lib/prisma";

// ---------------------------------------
// URL repository contract
// ---------------------------------------
type CreateUrlRecordInput = {
    originalUrl: string;
    shortCode: string;
    expiresAt?: Date | null;
};

// ---------------------------------------
// URL writes
// ---------------------------------------
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

// ---------------------------------------
// URL lookups
// ---------------------------------------
export async function findUrlByShortCode(shortCode: string) {
    const prisma = getPrismaClient();

    return prisma.url.findUnique({
        where: {
            shortCode,
        },
    });
}

// ---------------------------------------
// Redirect analytics
// ---------------------------------------
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
