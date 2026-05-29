import { URL_RULES } from "../../config/url.config";

export const createUrlBodySchema = {
    type: "object",
    additionalProperties: false,
    required: ["originalUrl"],
    properties: {
        originalUrl: {
            type: "string",
            minLength: 1,
            format: "uri",
        },
        shortCode: {
            type: "string",
            minLength: URL_RULES.shortCodeMinLength,
            maxLength: URL_RULES.shortCodeMaxLength,
            pattern: URL_RULES.shortCodePattern,
        },
        expiresAt: {
            anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
        },
    },
} as const;

export const createUrlResponseSchema = {
    type: "object",
    additionalProperties: false,
    required: ["id", "shortCode", "originalUrl", "shortUrl", "createdAt"],
    properties: {
        id: { type: "string" },
        shortCode: { type: "string" },
        originalUrl: { type: "string" },
        shortUrl: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
    },
} as const;

export const redirectParamsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["shortCode"],
    properties: {
        shortCode: {
            type: "string",
            minLength: URL_RULES.redirectParamMinLength,
            maxLength: URL_RULES.shortCodeMaxLength,
            pattern: URL_RULES.shortCodePattern,
        },
    },
} as const;
