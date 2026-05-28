-- Expand the URL entity for the MVP backend.
ALTER TABLE "Url"
ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Url_createdAt_idx" ON "Url" ("createdAt");

CREATE INDEX "Url_isActive_idx" ON "Url" ("isActive");