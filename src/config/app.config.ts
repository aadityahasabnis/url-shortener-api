const APP_DEFAULTS = {
    host: "0.0.0.0",
    port: 3000,
} as const;

// ---------------------------------------
// Runtime app configuration
// ---------------------------------------
export const APP_CONFIG = {
    host: process.env.HOST ?? APP_DEFAULTS.host,
    port: Number(process.env.PORT ?? APP_DEFAULTS.port),
} as const;
