import cors from "@fastify/cors";
import Fastify from "fastify";
import { API_V1_PREFIX } from "./config/routes.config";
import { healthRoutes } from "./modules/health/health.routes";
import { createShortUrl, resolveShortUrl } from "./modules/url/url.service";
import { urlRoutes } from "./modules/url/url.routes";
import { registerErrorHandler } from "./plugins/error-handler";
import { registerRedisPlugin } from "./plugins/redis";

type BuildAppOptions = {
    urlDependencies?: Parameters<typeof urlRoutes>[0];
};

function createDefaultUrlDependencies() {
    return {
        createShortUrl,
        resolveShortUrl,
    };
}

export function buildApp(options: BuildAppOptions = {}) {
    const app = Fastify({
        logger: true,
    });

    const urlDependencies = options.urlDependencies ?? createDefaultUrlDependencies();

    // ---------------------------------------
    // Core app wiring
    // ---------------------------------------
    app.register(cors, {
        origin: true,
    });

    app.register(registerRedisPlugin);

    app.get("/", async () => ({
        status: "Backend Running",
        service: "url-shortener-backend",
    }));

    // ---------------------------------------
    // Feature routes
    // ---------------------------------------
    registerErrorHandler(app);
    app.register(healthRoutes, { prefix: API_V1_PREFIX });
    app.register(urlRoutes(urlDependencies));

    return app;
}
