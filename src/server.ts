import { APP_CONFIG } from "./config/app.config";
import { buildApp } from "./app";

// ---------------------------------------
// Process bootstrap
// ---------------------------------------
const start = async () => {
    const app = buildApp();

    try {
        await app.listen({
            port: APP_CONFIG.port,
            host: APP_CONFIG.host,
        });

        app.log.info("Server running");
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

void start();
