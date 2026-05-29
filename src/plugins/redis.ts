import type { FastifyPluginAsync } from "fastify";
import { getRedisConfig } from "../config/redis.config";
import { closeRedisClient, getRedisClient } from "../lib/redis";

export const registerRedisPlugin: FastifyPluginAsync = async (app) => {
    const redisConfig = getRedisConfig();

    if (!redisConfig.enabled) {
        app.log.info("Redis is disabled");
        return;
    }

    await getRedisClient();

    app.addHook("onClose", async () => {
        await closeRedisClient();
    });
};
