export const ERROR_CODES = {
    validationError: "VALIDATION_ERROR",
    internalServerError: "INTERNAL_SERVER_ERROR",
    invalidUrl: "INVALID_URL",
    invalidExpiresAt: "INVALID_EXPIRES_AT",
    shortCodeTaken: "SHORT_CODE_TAKEN",
    shortCodeGenerationFailed: "SHORT_CODE_GENERATION_FAILED",
    urlNotFound: "URL_NOT_FOUND",
    urlDisabled: "URL_DISABLED",
    urlExpired: "URL_EXPIRED",
    rateLimitExceeded: "RATE_LIMIT_EXCEEDED",
} as const;

export const ERROR_MESSAGES = {
    invalidUrl: "The originalUrl value must be a valid URL",
    invalidExpiresAt: "expiresAt must be a valid date-time value",
    expiresAtInFuture: "expiresAt must be in the future",
    shortCodeTaken: "The requested short code is already in use",
    shortCodeGenerationFailed: "Unable to generate a unique short code",
    urlNotFound: "The requested short URL does not exist",
    urlDisabled: "The requested short URL is no longer active",
    urlExpired: "The requested short URL has expired",
    rateLimitExceeded: "Too many requests. Please try again later.",
    requestValidationFailed: "Request validation failed",
    unexpectedError: "An unexpected error occurred",
} as const;
