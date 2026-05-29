const REDIS_DEFAULTS = {
    keyPrefix: "url-shortener",
    urlCacheTtlSeconds: 3600,
    rateLimitWindowSeconds: 60,
    rateLimitCreateMax: 20,
    rateLimitRedirectMax: 120,
} as const;

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
        keyPrefix: process.env.REDIS_KEY_PREFIX?.trim() || REDIS_DEFAULTS.keyPrefix,
        urlCacheTtlSeconds: parsePositiveInteger(process.env.REDIS_URL_CACHE_TTL_SECONDS, REDIS_DEFAULTS.urlCacheTtlSeconds),
        rateLimitWindowSeconds: parsePositiveInteger(process.env.REDIS_RATE_LIMIT_WINDOW_SECONDS, REDIS_DEFAULTS.rateLimitWindowSeconds),
        rateLimitCreateMax: parsePositiveInteger(process.env.REDIS_RATE_LIMIT_CREATE_MAX, REDIS_DEFAULTS.rateLimitCreateMax),
        rateLimitRedirectMax: parsePositiveInteger(process.env.REDIS_RATE_LIMIT_REDIRECT_MAX, REDIS_DEFAULTS.rateLimitRedirectMax),
    } as const;
}
