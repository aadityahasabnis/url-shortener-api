import { AppError } from "../../common/errors/app-error";
import { calculateUrlCacheTtlSeconds, createRedisUrlCache, type UrlRedirectCache, type UrlRedirectCacheRecord } from "./url.cache";
import { createUrlRecord, findUrlByShortCode, incrementClickCount } from "./url.repository";
import { generateShortCode } from "./short-code.generator";
import type { CreateUrlInput } from "./url.types";

const MAX_SHORT_CODE_ATTEMPTS = 5;

// ---------------------------------------
// Domain ports
// ---------------------------------------
type UrlRepository = {
    createUrlRecord: typeof createUrlRecord;
    findUrlByShortCode: typeof findUrlByShortCode;
    incrementClickCount: (id: string) => Promise<unknown>;
};

type UrlServiceDependencies = {
    repository: UrlRepository;
    cache: UrlRedirectCache;
    generateShortCode: typeof generateShortCode;
    now: () => number;
};

type UrlRecord = Awaited<ReturnType<typeof createUrlRecord>>;

type UrlService = {
    createShortUrl(input: CreateUrlInput): Promise<UrlRecord>;
    resolveShortUrl(shortCode: string): Promise<{
        originalUrl: string;
    }>;
};

// ---------------------------------------
// Cache record mapping
// ---------------------------------------
function toCacheRecord(urlRecord: UrlRecord): UrlRedirectCacheRecord {
    return {
        id: urlRecord.id,
        originalUrl: urlRecord.originalUrl,
        expiresAt: urlRecord.expiresAt ? urlRecord.expiresAt.toISOString() : null,
    };
}

function normalizeUrl(value: string) {
    try {
        return new URL(value).toString();
    } catch {
        throw new AppError(400, "INVALID_URL", "The originalUrl value must be a valid URL");
    }
}

async function ensureShortCodeAvailability(repository: UrlRepository, shortCode: string) {
    const existingUrl = await repository.findUrlByShortCode(shortCode);

    if (existingUrl) throw new AppError(409, "SHORT_CODE_TAKEN", "The requested short code is already in use");
}

function validateExpirationDate(expiresAt: Date | null | undefined) {
    if (expiresAt === undefined || expiresAt === null) return;

    if (Number.isNaN(expiresAt.getTime())) throw new AppError(400, "INVALID_EXPIRES_AT", "expiresAt must be a valid date-time value");

    if (expiresAt.getTime() <= Date.now()) throw new AppError(400, "INVALID_EXPIRES_AT", "expiresAt must be in the future");
}

async function generateUniqueShortCode(repository: UrlRepository, shortCodeGenerator: typeof generateShortCode) {
    for (let attempt = 0; attempt < MAX_SHORT_CODE_ATTEMPTS; attempt += 1) {
        const candidate = shortCodeGenerator();
        const existingUrl = await repository.findUrlByShortCode(candidate);

        if (!existingUrl) return candidate;
    }

    throw new AppError(500, "SHORT_CODE_GENERATION_FAILED", "Unable to generate a unique short code");
}

// ---------------------------------------
// Service factory
// ---------------------------------------
function createDefaultRepository(): UrlRepository {
    return {
        createUrlRecord,
        findUrlByShortCode,
        incrementClickCount,
    };
}

export function createUrlService(dependencies: Partial<UrlServiceDependencies> = {}): UrlService {
    const repository = dependencies.repository ?? createDefaultRepository();
    const cache = dependencies.cache ?? createRedisUrlCache();
    const shortCodeGenerator = dependencies.generateShortCode ?? generateShortCode;
    const now = dependencies.now ?? Date.now;

    return {
        async createShortUrl(input: CreateUrlInput) {
            const originalUrl = normalizeUrl(input.originalUrl);
            validateExpirationDate(input.expiresAt);

            const shortCode = input.shortCode ?? (await generateUniqueShortCode(repository, shortCodeGenerator));

            if (input.shortCode) {
                await ensureShortCodeAvailability(repository, input.shortCode);
            }

            const urlRecord = await repository.createUrlRecord({
                originalUrl,
                shortCode,
                expiresAt: input.expiresAt ?? null,
            });

            const ttlSeconds = calculateUrlCacheTtlSeconds(input.expiresAt ?? null);

            await cache.set(urlRecord.shortCode, toCacheRecord(urlRecord), ttlSeconds);

            return urlRecord;
        },

        async resolveShortUrl(shortCode: string) {
            const cachedRecord = await cache.get(shortCode);

            if (cachedRecord) {
                // Click count is fire-and-forget so redirect latency stays low.
                void repository.incrementClickCount(cachedRecord.id).catch(() => undefined);

                return {
                    originalUrl: cachedRecord.originalUrl,
                };
            }

            const urlRecord = await repository.findUrlByShortCode(shortCode);

            if (!urlRecord) {
                throw new AppError(404, "URL_NOT_FOUND", "The requested short URL does not exist");
            }

            if (!urlRecord.isActive) {
                throw new AppError(410, "URL_DISABLED", "The requested short URL is no longer active");
            }

            if (urlRecord.expiresAt && urlRecord.expiresAt.getTime() <= now()) throw new AppError(410, "URL_EXPIRED", "The requested short URL has expired");

            // Click count updates should not break the redirect path.
            void repository.incrementClickCount(urlRecord.id).catch(() => undefined);

            const ttlSeconds = calculateUrlCacheTtlSeconds(urlRecord.expiresAt);

            await cache.set(urlRecord.shortCode, toCacheRecord(urlRecord), ttlSeconds);

            return {
                originalUrl: urlRecord.originalUrl,
            };
        },
    };
}

// ---------------------------------------
// Default service instance
// ---------------------------------------
const defaultUrlService = createUrlService({
    cache: createRedisUrlCache(),
});

export const createShortUrl = defaultUrlService.createShortUrl;
export const resolveShortUrl = defaultUrlService.resolveShortUrl;
