import { AppError } from "../../common/errors/app-error";
import { createUrlRecord, findUrlByShortCode, incrementClickCount } from "./url.repository";
import { generateShortCode } from "./short-code.generator";
import type { CreateUrlInput } from "./url.types";

const MAX_SHORT_CODE_ATTEMPTS = 5;

function normalizeUrl(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    throw new AppError(400, "INVALID_URL", "The originalUrl value must be a valid URL");
  }
}

async function ensureShortCodeAvailability(shortCode: string) {
  const existingUrl = await findUrlByShortCode(shortCode);

  if (existingUrl) {
    throw new AppError(409, "SHORT_CODE_TAKEN", "The requested short code is already in use");
  }
}

function validateExpirationDate(expiresAt: Date | null | undefined) {
  if (expiresAt === undefined || expiresAt === null) {
    return;
  }

  if (Number.isNaN(expiresAt.getTime())) {
    throw new AppError(400, "INVALID_EXPIRES_AT", "expiresAt must be a valid date-time value");
  }

  if (expiresAt.getTime() <= Date.now()) {
    throw new AppError(400, "INVALID_EXPIRES_AT", "expiresAt must be in the future");
  }
}

async function generateUniqueShortCode() {
  for (let attempt = 0; attempt < MAX_SHORT_CODE_ATTEMPTS; attempt += 1) {
    const candidate = generateShortCode();
    const existingUrl = await findUrlByShortCode(candidate);

    if (!existingUrl) {
      return candidate;
    }
  }

  throw new AppError(500, "SHORT_CODE_GENERATION_FAILED", "Unable to generate a unique short code");
}

export async function createShortUrl(input: CreateUrlInput) {
  const originalUrl = normalizeUrl(input.originalUrl);
  validateExpirationDate(input.expiresAt);

  const shortCode = input.shortCode ?? (await generateUniqueShortCode());

  if (input.shortCode) {
    await ensureShortCodeAvailability(input.shortCode);
  }

  return createUrlRecord({
    originalUrl,
    shortCode,
    expiresAt: input.expiresAt ?? null,
  });
}

export async function resolveShortUrl(shortCode: string) {
  const urlRecord = await findUrlByShortCode(shortCode);

  if (!urlRecord) {
    throw new AppError(404, "URL_NOT_FOUND", "The requested short URL does not exist");
  }

  if (!urlRecord.isActive) {
    throw new AppError(410, "URL_DISABLED", "The requested short URL is no longer active");
  }

  if (urlRecord.expiresAt && urlRecord.expiresAt.getTime() <= Date.now()) {
    throw new AppError(410, "URL_EXPIRED", "The requested short URL has expired");
  }

  // Click count updates should not break the redirect path.
  void incrementClickCount(urlRecord.id).catch(() => undefined);

  return urlRecord;
}
