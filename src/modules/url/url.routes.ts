import type { FastifyInstance } from "fastify";
import { API_V1_PREFIX, REDIRECT_BASE_PATH } from "../../config/routes.config";
import { createUrlController, type UrlControllerDependencies } from "./url.controller";
import {
  createUrlBodySchema,
  createUrlResponseSchema,
  redirectParamsSchema,
} from "./url.schema";

export function urlRoutes(dependencies: UrlControllerDependencies) {
  const { createUrlHandler, redirectUrlHandler } = createUrlController(dependencies);

  return async function registerUrlRoutes(app: FastifyInstance) {
    app.post(
      `${API_V1_PREFIX}/urls`,
      {
        schema: {
          body: createUrlBodySchema,
          response: {
            201: createUrlResponseSchema,
          },
        },
      },
      createUrlHandler,
    );

    app.get(
      `${REDIRECT_BASE_PATH}/:shortCode`,
      {
        schema: {
          params: redirectParamsSchema,
        },
      },
      redirectUrlHandler,
    );
  };
}
