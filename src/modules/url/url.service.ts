import { AppError } from "../../common/errors/app-error";
import { ERROR_CODES, ERROR_MESSAGES } from "../../config/error.config";
import { HTTP_STATUS } from "../../config/http.config";
import { URL_RULES } from "../../config/url.config";
import { calculateUrlCacheTtlSeconds, createRedisUrlCache, type UrlRedirectCache, type UrlRedirectCacheRecord } from "./url.cache";
import { createUrlRecord, findUrlByShortCode, incrementClickCount } from "./url.repository";
import { generateShortCode } from "./short-code.generator";
import type { CreateUrlInput } from "./url.types";

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
        throw new AppError(HTTP_STATUS.badRequest, ERROR_CODES.invalidUrl, ERROR_MESSAGES.invalidUrl);
    }
}

async function ensureShortCodeAvailability(repository: UrlRepository, shortCode: string) {
    const existingUrl = await repository.findUrlByShortCode(shortCode);

    if (existingUrl) throw new AppError(HTTP_STATUS.conflict, ERROR_CODES.shortCodeTaken, ERROR_MESSAGES.shortCodeTaken);
}

function validateExpirationDate(expiresAt: Date | null | undefined) {
    if (expiresAt === undefined || expiresAt === null) return;

    if (Number.isNaN(expiresAt.getTime())) throw new AppError(HTTP_STATUS.badRequest, ERROR_CODES.invalidExpiresAt, ERROR_MESSAGES.invalidExpiresAt);

    if (expiresAt.getTime() <= Date.now()) throw new AppError(HTTP_STATUS.badRequest, ERROR_CODES.invalidExpiresAt, ERROR_MESSAGES.expiresAtInFuture);
}

async function generateUniqueShortCode(repository: UrlRepository, shortCodeGenerator: typeof generateShortCode) {
    for (let attempt = 0; attempt < URL_RULES.shortCodeAttempts; attempt += 1) {
        const candidate = shortCodeGenerator();
        const existingUrl = await repository.findUrlByShortCode(candidate);

        if (!existingUrl) return candidate;
    }

    throw new AppError(HTTP_STATUS.internalServerError, ERROR_CODES.shortCodeGenerationFailed, ERROR_MESSAGES.shortCodeGenerationFailed);
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
                throw new AppError(HTTP_STATUS.notFound, ERROR_CODES.urlNotFound, ERROR_MESSAGES.urlNotFound);
            }

            if (!urlRecord.isActive) {
                throw new AppError(HTTP_STATUS.gone, ERROR_CODES.urlDisabled, ERROR_MESSAGES.urlDisabled);
            }

            if (urlRecord.expiresAt && urlRecord.expiresAt.getTime() <= now()) throw new AppError(HTTP_STATUS.gone, ERROR_CODES.urlExpired, ERROR_MESSAGES.urlExpired);

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
