import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { buildApp } from "../src/app";
import { AppError } from "../src/common/errors/app-error";

const storedUrls = new Map<
    string,
    {
        id: string;
        shortCode: string;
        originalUrl: string;
        createdAt: Date;
    }
>();

const urlDependencies = {
    async createShortUrl(input: { originalUrl: string; shortCode?: string; expiresAt?: Date | null }) {
        const shortCode = input.shortCode ?? "testCode";
        const record = {
            id: "url_1",
            shortCode,
            originalUrl: input.originalUrl,
            createdAt: new Date("2026-05-28T00:00:00.000Z"),
        };

        storedUrls.set(shortCode, record);

        return record;
    },
    async resolveShortUrl(shortCode: string) {
        const record = storedUrls.get(shortCode);

        if (!record) {
            throw new AppError(404, "URL_NOT_FOUND", "The requested short URL does not exist");
        }

        return record;
    },
};

describe("url routes", () => {
    const app = buildApp({ urlDependencies });

    beforeEach(async () => {
        storedUrls.clear();
    });

    it("creates a shortened URL", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/v1/urls",
            payload: {
                originalUrl: "https://example.com/articles/1",
            },
        });

        assert.equal(response.statusCode, 201);

        const body = response.json() as {
            shortCode: string;
            originalUrl: string;
            shortUrl: string;
        };

        assert.equal(body.originalUrl, "https://example.com/articles/1");
        assert.match(body.shortCode, /^[a-zA-Z0-9_-]+$/);
        assert.match(body.shortUrl, /^http:\/\//);
    });

    it("redirects a short URL", async () => {
        storedUrls.set("goDocs", {
            id: "url_2",
            shortCode: "goDocs",
            originalUrl: "https://example.com/docs",
            createdAt: new Date("2026-05-28T00:00:00.000Z"),
        });

        const response = await app.inject({
            method: "GET",
            url: "/r/goDocs",
        });

        assert.equal(response.statusCode, 302);
        assert.equal(response.headers.location, "https://example.com/docs");
    });

    it("returns 400 when originalUrl is invalid", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/v1/urls",
            payload: {
                originalUrl: "not-a-valid-url",
            },
        });

        assert.equal(response.statusCode, 400);
        const body = response.json() as { error: string };
        assert.equal(body.error, "VALIDATION_ERROR");
    });

    it("returns 404 when short code does not exist", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/r/missingCode",
        });

        assert.equal(response.statusCode, 404);
        const body = response.json() as { error: string };
        assert.equal(body.error, "URL_NOT_FOUND");
    });

    it("returns 429 when the create endpoint is rate limited", async () => {
        const previousLimit = process.env.REDIS_RATE_LIMIT_CREATE_MAX;
        const previousPrefix = process.env.REDIS_KEY_PREFIX;
        const uniquePrefix = `url-shortener-test-${Date.now()}`;

        process.env.REDIS_RATE_LIMIT_CREATE_MAX = "1";
        process.env.REDIS_KEY_PREFIX = uniquePrefix;

        const rateLimitedApp = buildApp({ urlDependencies });

        const firstResponse = await rateLimitedApp.inject({
            method: "POST",
            url: "/api/v1/urls",
            payload: {
                originalUrl: "https://example.com/first",
            },
        });

        const secondResponse = await rateLimitedApp.inject({
            method: "POST",
            url: "/api/v1/urls",
            payload: {
                originalUrl: "https://example.com/second",
            },
        });

        if (previousLimit === undefined) {
            delete process.env.REDIS_RATE_LIMIT_CREATE_MAX;
        } else {
            process.env.REDIS_RATE_LIMIT_CREATE_MAX = previousLimit;
        }

        if (previousPrefix === undefined) {
            delete process.env.REDIS_KEY_PREFIX;
        } else {
            process.env.REDIS_KEY_PREFIX = previousPrefix;
        }

        assert.equal(firstResponse.statusCode, 201);
        assert.equal(secondResponse.statusCode, 429);

        const body = secondResponse.json() as { error: string };
        assert.equal(body.error, "RATE_LIMIT_EXCEEDED");
    });
});
