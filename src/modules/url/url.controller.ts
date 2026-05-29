import type { FastifyReply, FastifyRequest } from "fastify";
import { REDIRECT_BASE_PATH } from "../../config/routes.config";

// ---------------------------------------
// Request payload shapes
// ---------------------------------------
type CreateUrlBody = {
    originalUrl: string;
    shortCode?: string;
    expiresAt?: string | null;
};

type ShortCodeParams = {
    shortCode: string;
};

// ---------------------------------------
// Controller dependencies
// ---------------------------------------
export type UrlControllerDependencies = {
    createShortUrl: (input: { originalUrl: string; shortCode?: string; expiresAt?: Date | null }) => Promise<{
        id: string;
        shortCode: string;
        originalUrl: string;
        createdAt: Date;
    }>;
    resolveShortUrl: (shortCode: string) => Promise<{
        originalUrl: string;
    }>;
};

// ---------------------------------------
// Short URL builder
// ---------------------------------------
function buildShortUrl(request: FastifyRequest, shortCode: string) {
    const host = request.headers["x-forwarded-host"] ?? request.headers.host ?? "localhost:3000";
    const protocol = request.headers["x-forwarded-proto"] ?? request.protocol;

    return `${protocol}://${host}${REDIRECT_BASE_PATH}/${shortCode}`;
}

export function createUrlController(dependencies: UrlControllerDependencies) {
    return {
        async createUrlHandler(request: FastifyRequest, reply: FastifyReply) {
            const body = request.body as CreateUrlBody;

            const createInput = {
                originalUrl: body.originalUrl,
                ...(body.shortCode ? { shortCode: body.shortCode } : {}),
                ...(body.expiresAt !== undefined
                    ? {
                          expiresAt: body.expiresAt === null ? null : new Date(body.expiresAt),
                      }
                    : {}),
            };

            const urlRecord = await dependencies.createShortUrl(createInput);

            // Build the API response without exposing repository details.
            return reply.code(201).send({
                id: urlRecord.id,
                shortCode: urlRecord.shortCode,
                originalUrl: urlRecord.originalUrl,
                shortUrl: buildShortUrl(request, urlRecord.shortCode),
                createdAt: urlRecord.createdAt,
            });
        },

        async redirectUrlHandler(request: FastifyRequest, reply: FastifyReply) {
            const params = request.params as ShortCodeParams;

            const urlRecord = await dependencies.resolveShortUrl(params.shortCode);

            // Redirect immediately after the service resolves the target URL.
            return reply.redirect(urlRecord.originalUrl);
        },
    };
}
