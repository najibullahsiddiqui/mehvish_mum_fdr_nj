-- Extend generation logs so each generation attempt can track lifecycle status,
-- failure reason, and duration without changing existing successful log semantics.
ALTER TABLE "GenerationLog"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN "errorMessage" TEXT,
ADD COLUMN "durationMs" INTEGER;

CREATE INDEX "GenerationLog_status_idx" ON "GenerationLog"("status");
