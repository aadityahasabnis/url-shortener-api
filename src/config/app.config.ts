const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "0.0.0.0";

// ---------------------------------------
// Runtime app configuration
// ---------------------------------------
export const APP_CONFIG = {
    host: process.env.HOST ?? DEFAULT_HOST,
    port: Number(process.env.PORT ?? DEFAULT_PORT),
} as const;
