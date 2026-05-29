import type { FastifyInstance } from "fastify";
import { getRedisConfig } from "../../config/redis.config";
import { API_V1_PREFIX, REDIRECT_BASE_PATH } from "../../config/routes.config";
import { createRateLimitGuard } from "../../plugins/rate-limit";
import { createUrlController, type UrlControllerDependencies } from "./url.controller";
import { createUrlBodySchema, createUrlResponseSchema, redirectParamsSchema } from "./url.schema";

// ---------------------------------------
// URL route registration
// ---------------------------------------
export function urlRoutes(dependencies: UrlControllerDependencies) {
    const { createUrlHandler, redirectUrlHandler } = createUrlController(dependencies);
    const redisConfig = getRedisConfig();
    const createUrlRateLimit = createRateLimitGuard({
        scope: "create-url",
        max: redisConfig.rateLimitCreateMax,
        windowMs: redisConfig.rateLimitWindowSeconds * 1000,
    });
    const redirectRateLimit = createRateLimitGuard({
        scope: "redirect-url",
        max: redisConfig.rateLimitRedirectMax,
        windowMs: redisConfig.rateLimitWindowSeconds * 1000,
    });

    return async function registerUrlRoutes(app: FastifyInstance) {
        // Create short URL.
        app.post(
            `${API_V1_PREFIX}/urls`,
            {
                preHandler: createUrlRateLimit,
                schema: {
                    body: createUrlBodySchema,
                    response: {
                        201: createUrlResponseSchema,
                    },
                },
            },
            createUrlHandler,
        );

        // Resolve short URL.
        app.get(
            `${REDIRECT_BASE_PATH}/:shortCode`,
            {
                preHandler: redirectRateLimit,
                schema: {
                    params: redirectParamsSchema,
                },
            },
            redirectUrlHandler,
        );
    };
}
