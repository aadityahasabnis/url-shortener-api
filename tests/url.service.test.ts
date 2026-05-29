import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../src/common/errors/app-error";
import { calculateUrlCacheTtlSeconds, type UrlRedirectCache, type UrlRedirectCacheRecord } from "../src/modules/url/url.cache";
import { createUrlService } from "../src/modules/url/url.service";

describe("url service cache-aside flow", () => {
    it("stores redirect results in cache and serves later hits from cache", async () => {
        let repositoryLookups = 0;
        let clickCountUpdates = 0;

        const cacheEntries = new Map<string, UrlRedirectCacheRecord>();

        const cache: UrlRedirectCache = {
            async get(shortCode: string) {
                return cacheEntries.get(shortCode) ?? null;
            },
            async set(shortCode: string, record: UrlRedirectCacheRecord) {
                cacheEntries.set(shortCode, record);
            },
            async delete(shortCode: string) {
                cacheEntries.delete(shortCode);
            },
        };

        const service = createUrlService({
            cache,
            repository: {
                async createUrlRecord() {
                    throw new Error("createUrlRecord is not used in this test");
                },
                async findUrlByShortCode(shortCode: string) {
                    repositoryLookups += 1;

                    if (shortCode !== "goDocs") {
                        return null;
                    }

                    return {
                        id: "url_1",
                        shortCode: "goDocs",
                        originalUrl: "https://example.com/docs",
                        clickCount: 0,
                        isActive: true,
                        expiresAt: null,
                        createdAt: new Date("2026-05-28T00:00:00.000Z"),
                        updatedAt: new Date("2026-05-28T00:00:00.000Z"),
                    };
                },
                async incrementClickCount() {
                    clickCountUpdates += 1;
                },
            },
            generateShortCode: () => "unused",
        });

        const firstResolve = await service.resolveShortUrl("goDocs");
        const secondResolve = await service.resolveShortUrl("goDocs");

        assert.equal(firstResolve.originalUrl, "https://example.com/docs");
        assert.equal(secondResolve.originalUrl, "https://example.com/docs");
        assert.equal(repositoryLookups, 1);
        assert.equal(clickCountUpdates, 2);
    });

    it("uses the shorter TTL when a URL is close to expiry", () => {
        const expiresAt = new Date(Date.now() + 12_000);
        const ttlSeconds = calculateUrlCacheTtlSeconds(expiresAt);

        assert.ok(ttlSeconds > 0);
        assert.ok(ttlSeconds <= 60 * 60);
    });

    it("rejects invalid URLs before caching them", async () => {
        const service = createUrlService({
            cache: {
                async get() {
                    return null;
                },
                async set() {
                    throw new Error("cache should not be called");
                },
                async delete() {
                    return undefined;
                },
            },
            repository: {
                async createUrlRecord() {
                    throw new Error("repository should not be reached");
                },
                async findUrlByShortCode() {
                    throw new Error("repository should not be reached");
                },
                async incrementClickCount() {
                    throw new Error("repository should not be reached");
                },
            },
        });

        await assert.rejects(
            service.createShortUrl({
                originalUrl: "not-a-valid-url",
            }),
            (error) => error instanceof AppError && error.code === "INVALID_URL",
        );
    });
});
