import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../common/errors/app-error";
import { getRedisConfig } from "../config/redis.config";
import { getRedisClient } from "../lib/redis";

// ---------------------------------------
// Rate limit contract
// ---------------------------------------
type RateLimitOptions = {
    scope: string;
    max: number;
    windowMs: number;
};

type RateLimitBucket = {
    timestamps: number[];
};

const memoryBuckets = new Map<string, RateLimitBucket>();

function buildRateLimitKey(scope: string, identifier: string) {
    const config = getRedisConfig();

    return `${config.keyPrefix}:rate-limit:${scope}:${identifier}`;
}

function getRequestIdentifier(request: FastifyRequest) {
    return request.ip || "unknown";
}

// ---------------------------------------
// In-memory fallback limiter
// ---------------------------------------
function enforceMemoryLimit(key: string, max: number, windowMs: number) {
    const now = Date.now();
    const cutoff = now - windowMs;
    const existingBucket = memoryBuckets.get(key);
    const bucket = existingBucket ?? { timestamps: [] };

    bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > cutoff);

    if (bucket.timestamps.length === 0 && existingBucket) {
        memoryBuckets.delete(key);
        return;
    }

    if (bucket.timestamps.length >= max) {
        memoryBuckets.set(key, bucket);
        throw new AppError(429, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.");
    }

    bucket.timestamps.push(now);
    memoryBuckets.set(key, bucket);
}

// ---------------------------------------
// Redis-backed sliding window limiter
// ---------------------------------------
async function enforceRedisLimit(key: string, max: number, windowMs: number) {
    const client = await getRedisClient();

    if (!client) return enforceMemoryLimit(key, max, windowMs);

    const now = Date.now();
    const cutoff = now - windowMs;
    const member = `${now}-${randomUUID()}`;

    const allowed = (await client.eval(
        `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local cutoff = tonumber(ARGV[2])
      local member = ARGV[3]
      local max = tonumber(ARGV[4])
      local windowMs = tonumber(ARGV[5])

      redis.call("ZREMRANGEBYSCORE", key, 0, cutoff)

      local currentCount = redis.call("ZCARD", key)

      if currentCount >= max then
        return 0
      end

      redis.call("ZADD", key, now, member)
      redis.call("PEXPIRE", key, windowMs)

      return 1
    `,
        {
            keys: [key],
            arguments: [String(now), String(cutoff), member, String(max), String(windowMs)],
        },
    )) as number;

    if (allowed !== 1) throw new AppError(429, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.");
}

export function createRateLimitGuard(options: RateLimitOptions) {
    return async function rateLimitGuard(request: FastifyRequest, _reply: FastifyReply) {
        const identifier = getRequestIdentifier(request);
        const key = buildRateLimitKey(options.scope, identifier);

        await enforceRedisLimit(key, options.max, options.windowMs);
    };
}
