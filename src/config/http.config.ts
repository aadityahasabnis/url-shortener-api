export const HTTP_STATUS = {
    ok: 200,
    created: 201,
    found: 302,
    badRequest: 400,
    notFound: 404,
    conflict: 409,
    gone: 410,
    tooManyRequests: 429,
    internalServerError: 500,
} as const;
