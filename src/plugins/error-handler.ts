import type { FastifyInstance } from "fastify";
import { AppError } from "../common/errors/app-error";
import { ERROR_CODES, ERROR_MESSAGES } from "../config/error.config";
import { HTTP_STATUS } from "../config/http.config";

type ValidationError = {
    validation?: Array<{ message: string; instancePath?: string }>;
};

export function registerErrorHandler(app: FastifyInstance) {
    app.setErrorHandler((error, request, reply) => {
        request.log.error({ error }, "Request failed");

        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                error: error.code,
                message: error.message,
            });
        }

        const validationError = error as ValidationError;

        if (Array.isArray(validationError.validation)) {
            return reply.status(HTTP_STATUS.badRequest).send({
                error: ERROR_CODES.validationError,
                message: ERROR_MESSAGES.requestValidationFailed,
                details: validationError.validation.map((item) => ({
                    path: item.instancePath ?? "",
                    message: item.message,
                })),
            });
        }

        return reply.status(HTTP_STATUS.internalServerError).send({
            error: ERROR_CODES.internalServerError,
            message: ERROR_MESSAGES.unexpectedError,
        });
    });
}
