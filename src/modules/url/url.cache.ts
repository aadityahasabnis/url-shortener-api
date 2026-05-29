import { getRedisConfig } from "../../config/redis.config";
import { getRedisClient } from "../../lib/redis";

const URL_CACHE_NAMESPACE = "url:redirect";

// ---------------------------------------
// URL cache contract
// ---------------------------------------
export type UrlRedirectCacheRecord = {
    id: string;
    originalUrl: string;
    expiresAt: string | null;
};

export type UrlRedirectCache = {
    get(shortCode: string): Promise<UrlRedirectCacheRecord | null>;
    set(shortCode: string, record: UrlRedirectCacheRecord, ttlSeconds: number): Promise<void>;
    delete(shortCode: string): Promise<void>;
};

export function buildUrlCacheKey(shortCode: string) {
    const config = getRedisConfig();

    return `${config.keyPrefix}:${URL_CACHE_NAMESPACE}:${shortCode}`;
}

export function calculateUrlCacheTtlSeconds(expiresAt: Date | null | undefined) {
    const config = getRedisConfig();

    if (expiresAt === undefined || expiresAt === null) return config.urlCacheTtlSeconds;

    const remainingSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    return Math.max(1, Math.min(config.urlCacheTtlSeconds, remainingSeconds));
}

// ---------------------------------------
// Redis-backed cache adapter
// ---------------------------------------
export function createRedisUrlCache(): UrlRedirectCache {
    return {
        async get(shortCode: string) {
            try {
                const client = await getRedisClient();

                if (!client) return null;

                const cachedValue = await client.get(buildUrlCacheKey(shortCode));

                if (!cachedValue) return null;

                try {
                    return JSON.parse(cachedValue) as UrlRedirectCacheRecord;
                } catch {
                    return null;
                }
            } catch {
                return null;
            }
        },
        async set(shortCode: string, record: UrlRedirectCacheRecord, ttlSeconds: number) {
            try {
                const client = await getRedisClient();

                if (!client) return;

                await client.set(buildUrlCacheKey(shortCode), JSON.stringify(record), {
                    EX: ttlSeconds,
                });
            } catch {
                return;
            }
        },
        async delete(shortCode: string) {
            try {
                const client = await getRedisClient();

                if (!client) return;

                await client.del(buildUrlCacheKey(shortCode));
            } catch {
                return;
            }
        },
    };
}
