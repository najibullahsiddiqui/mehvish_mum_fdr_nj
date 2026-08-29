-- Random Rooms Phase 6: media foundation and provider-backed generation jobs.
-- Additive only: no existing planning data is modified.

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "episodeId" TEXT,
    "sceneId" TEXT,
    "shotId" TEXT,
    "dialogueLineId" TEXT,
    "characterId" TEXT,
    "roomId" TEXT,
    "assetType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "provider" TEXT,
    "providerJobId" TEXT,
    "model" TEXT,
    "localPath" TEXT,
    "remoteUrl" TEXT,
    "mimeType" TEXT,
    "durationSec" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "episodeId" TEXT,
    "sceneId" TEXT,
    "shotId" TEXT,
    "dialogueLineId" TEXT,
    "characterId" TEXT,
    "roomId" TEXT,
    "jobType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerJobId" TEXT,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "costEstimate" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MediaAsset_seriesId_idx" ON "MediaAsset"("seriesId");
CREATE INDEX "MediaAsset_episodeId_idx" ON "MediaAsset"("episodeId");
CREATE INDEX "MediaAsset_sceneId_idx" ON "MediaAsset"("sceneId");
CREATE INDEX "MediaAsset_shotId_idx" ON "MediaAsset"("shotId");
CREATE INDEX "MediaAsset_dialogueLineId_idx" ON "MediaAsset"("dialogueLineId");
CREATE INDEX "MediaAsset_characterId_idx" ON "MediaAsset"("characterId");
CREATE INDEX "MediaAsset_roomId_idx" ON "MediaAsset"("roomId");
CREATE INDEX "MediaAsset_assetType_idx" ON "MediaAsset"("assetType");
CREATE INDEX "MediaAsset_status_idx" ON "MediaAsset"("status");
CREATE INDEX "MediaAsset_providerJobId_idx" ON "MediaAsset"("providerJobId");

CREATE INDEX "GenerationJob_seriesId_idx" ON "GenerationJob"("seriesId");
CREATE INDEX "GenerationJob_episodeId_idx" ON "GenerationJob"("episodeId");
CREATE INDEX "GenerationJob_sceneId_idx" ON "GenerationJob"("sceneId");
CREATE INDEX "GenerationJob_shotId_idx" ON "GenerationJob"("shotId");
CREATE INDEX "GenerationJob_dialogueLineId_idx" ON "GenerationJob"("dialogueLineId");
CREATE INDEX "GenerationJob_characterId_idx" ON "GenerationJob"("characterId");
CREATE INDEX "GenerationJob_roomId_idx" ON "GenerationJob"("roomId");
CREATE INDEX "GenerationJob_jobType_idx" ON "GenerationJob"("jobType");
CREATE INDEX "GenerationJob_provider_idx" ON "GenerationJob"("provider");
CREATE INDEX "GenerationJob_providerJobId_idx" ON "GenerationJob"("providerJobId");
CREATE INDEX "GenerationJob_status_idx" ON "GenerationJob"("status");
CREATE INDEX "GenerationJob_createdAt_idx" ON "GenerationJob"("createdAt");

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RandomRoomsSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_dialogueLineId_fkey" FOREIGN KEY ("dialogueLineId") REFERENCES "DialogueLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RoomProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RandomRoomsSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_dialogueLineId_fkey" FOREIGN KEY ("dialogueLineId") REFERENCES "DialogueLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RoomProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
