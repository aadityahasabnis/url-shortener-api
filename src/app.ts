import cors from "@fastify/cors";
import Fastify from "fastify";
import { healthRoutes } from "./modules/health/health.routes";

export function buildApp() {
    const app = Fastify({
        logger: true,
    });

    app.register(cors, {
        origin: true,
    });

    app.get("/", async () => ({
        status: "Backend Running",
        service: "url-shortener-backend",
    }));

    app.register(healthRoutes, { prefix: "/api/v1" });

    return app;
}