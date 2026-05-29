import type { FastifyInstance } from "fastify";
import { HTTP_STATUS } from "../../config/http.config";
import { getRedisConfig } from "../../config/redis.config";
import { API_PREFIX } from "../../config/routes.config";
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
            `${API_PREFIX}/urls`,
            {
                preHandler: createUrlRateLimit,
                schema: {
                    body: createUrlBodySchema,
                    response: {
                        [HTTP_STATUS.created]: createUrlResponseSchema,
                    },
                },
            },
            createUrlHandler,
        );

        // Resolve short URL.
        app.get(
            `/:shortCode`,
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
