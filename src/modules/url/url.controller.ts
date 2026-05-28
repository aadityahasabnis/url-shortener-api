import type { FastifyReply, FastifyRequest } from "fastify";
import { REDIRECT_BASE_PATH } from "../../config/routes.config";

type CreateUrlBody = {
  originalUrl: string;
  shortCode?: string;
  expiresAt?: string | null;
};

type ShortCodeParams = {
  shortCode: string;
};

export type UrlControllerDependencies = {
  createShortUrl: (input: {
    originalUrl: string;
    shortCode?: string;
    expiresAt?: Date | null;
  }) => Promise<{
    id: string;
    shortCode: string;
    originalUrl: string;
    createdAt: Date;
  }>;
  resolveShortUrl: (shortCode: string) => Promise<{
    originalUrl: string;
  }>;
};

function buildShortUrl(request: FastifyRequest, shortCode: string) {
  const host = request.headers["x-forwarded-host"] ?? request.headers.host ?? "localhost:3000";
  const protocol = request.headers["x-forwarded-proto"] ?? request.protocol;

  return `${protocol}://${host}${REDIRECT_BASE_PATH}/${shortCode}`;
}

export function createUrlController(dependencies: UrlControllerDependencies) {
  return {
    async createUrlHandler(
      request: FastifyRequest<{ Body: CreateUrlBody }>,
      reply: FastifyReply,
    ) {
      const createInput = {
        originalUrl: request.body.originalUrl,
        ...(request.body.shortCode ? { shortCode: request.body.shortCode } : {}),
        ...(request.body.expiresAt !== undefined
          ? {
              expiresAt:
                request.body.expiresAt === null ? null : new Date(request.body.expiresAt),
            }
          : {}),
      };

      const urlRecord = await dependencies.createShortUrl(createInput);

      void reply.code(201).send({
        id: urlRecord.id,
        shortCode: urlRecord.shortCode,
        originalUrl: urlRecord.originalUrl,
        shortUrl: buildShortUrl(request, urlRecord.shortCode),
        createdAt: urlRecord.createdAt,
      });
    },

    async redirectUrlHandler(
      request: FastifyRequest<{ Params: ShortCodeParams }>,
      reply: FastifyReply,
    ) {
      const urlRecord = await dependencies.resolveShortUrl(request.params.shortCode);

      void reply.redirect(urlRecord.originalUrl);
    },
  };
}
