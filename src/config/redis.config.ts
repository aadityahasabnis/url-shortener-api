const DEFAULT_REDIS_KEY_PREFIX = "url-shortener";
const DEFAULT_URL_CACHE_TTL_SECONDS = 3600;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_RATE_LIMIT_CREATE_MAX = 20;
const DEFAULT_RATE_LIMIT_REDIRECT_MAX = 120;

// ---------------------------------------
// Redis configuration and utilities
// ---------------------------------------
function parsePositiveInteger(value: string | undefined, fallback: number) {
    if (value === undefined) return fallback;

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) return fallback;

    return parsedValue;
}

export function getRedisConfig() {
    const url = process.env.REDIS_URL?.trim() ?? "";

    return {
        enabled: url.length > 0,
        url,
        keyPrefix: process.env.REDIS_KEY_PREFIX?.trim() || DEFAULT_REDIS_KEY_PREFIX,
        urlCacheTtlSeconds: parsePositiveInteger(process.env.REDIS_URL_CACHE_TTL_SECONDS, DEFAULT_URL_CACHE_TTL_SECONDS),
        rateLimitWindowSeconds: parsePositiveInteger(process.env.REDIS_RATE_LIMIT_WINDOW_SECONDS, DEFAULT_RATE_LIMIT_WINDOW_SECONDS),
        rateLimitCreateMax: parsePositiveInteger(process.env.REDIS_RATE_LIMIT_CREATE_MAX, DEFAULT_RATE_LIMIT_CREATE_MAX),
        rateLimitRedirectMax: parsePositiveInteger(process.env.REDIS_RATE_LIMIT_REDIRECT_MAX, DEFAULT_RATE_LIMIT_REDIRECT_MAX),
    } as const;
}
