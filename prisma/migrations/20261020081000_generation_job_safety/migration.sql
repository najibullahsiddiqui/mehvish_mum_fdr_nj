ALTER TABLE "GenerationJob"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "attempt" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "maxAttempts" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "leaseUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextPollAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "GenerationJob_idempotencyKey_key"
  ON "GenerationJob"("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "GenerationJob_nextPollAt_idx"
  ON "GenerationJob"("nextPollAt");

CREATE INDEX IF NOT EXISTS "GenerationJob_leaseUntil_idx"
  ON "GenerationJob"("leaseUntil");

-- One active paid/local generation per target and job type.
CREATE UNIQUE INDEX IF NOT EXISTS "GenerationJob_active_shot_job_key"
  ON "GenerationJob"("shotId", "jobType")
  WHERE "shotId" IS NOT NULL
    AND "status" IN ('SUBMITTING','QUEUED','RUNNING','IN_QUEUE','IN_PROGRESS');

CREATE UNIQUE INDEX IF NOT EXISTS "GenerationJob_active_dialogue_job_key"
  ON "GenerationJob"("dialogueLineId", "jobType")
  WHERE "dialogueLineId" IS NOT NULL
    AND "status" IN ('SUBMITTING','QUEUED','RUNNING','IN_QUEUE','IN_PROGRESS');

CREATE UNIQUE INDEX IF NOT EXISTS "GenerationJob_active_episode_job_key"
  ON "GenerationJob"("episodeId", "jobType")
  WHERE "episodeId" IS NOT NULL
    AND "shotId" IS NULL
    AND "dialogueLineId" IS NULL
    AND "status" IN ('SUBMITTING','QUEUED','RUNNING','IN_QUEUE','IN_PROGRESS');

CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_providerJobId_assetType_key"
  ON "MediaAsset"("providerJobId", "assetType")
  WHERE "providerJobId" IS NOT NULL;
