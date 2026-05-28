import type { FastifyInstance } from "fastify";
import { AppError } from "../common/errors/app-error";

type ValidationError = {
  validation?: Array<{ message: string; instancePath?: string }>;
};

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ error }, "Request failed");

    if (error instanceof AppError) {
      void reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });

      return;
    }

    const validationError = error as ValidationError;

    if (Array.isArray(validationError.validation)) {
      void reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: validationError.validation.map((item) => ({
          path: item.instancePath ?? "",
          message: item.message,
        })),
      });

      return;
    }

    void reply.status(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    });
  });
}
