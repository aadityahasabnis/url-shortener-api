export const URL_RULES = {
    cacheNamespace: "url:redirect",
    shortCodePattern: "^[a-zA-Z0-9_-]+$",
    shortCodeMinLength: 4,
    shortCodeMaxLength: 32,
    redirectParamMinLength: 1,
    shortCodeAttempts: 5,
} as const;
