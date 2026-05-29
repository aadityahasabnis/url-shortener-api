import { createClient, type RedisClientType } from "redis";
import { getRedisConfig } from "../config/redis.config";

type RedisState = {
    client: RedisClientType | null;
    connectPromise: Promise<RedisClientType | null> | null;
};

const globalForRedis = globalThis as unknown as {
    redisState?: RedisState;
};

function getRedisState() {
    if (!globalForRedis.redisState) {
        globalForRedis.redisState = {
            client: null,
            connectPromise: null,
        };
    }

    return globalForRedis.redisState;
}

async function connectRedisClient() {
    const config = getRedisConfig();

    if (!config.enabled) {
        return null;
    }

    const state = getRedisState();

    if (state.client?.isReady) {
        return state.client;
    }

    if (state.connectPromise) {
        return state.connectPromise;
    }

    const client = createClient({
        url: config.url,
    });

    client.on("error", () => undefined);

    state.client = client;
    state.connectPromise = client
        .connect()
        .then(() => client)
        .catch((error) => {
            state.client = null;
            state.connectPromise = null;
            throw error;
        });

    return state.connectPromise;
}

export async function getRedisClient() {
    return connectRedisClient();
}

export async function closeRedisClient() {
    const state = getRedisState();
    const client = state.client;

    state.client = null;
    state.connectPromise = null;

    if (!client) {
        return;
    }

    if (client.isOpen) {
        await client.quit();
        return;
    }

    client.destroy();
}
