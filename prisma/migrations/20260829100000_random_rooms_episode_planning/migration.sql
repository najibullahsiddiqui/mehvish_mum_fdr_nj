-- Random Rooms Phase 5: Episode and scene planning only.
-- This migration is additive and intentionally does not add media assets,
-- image/video generation, TTS execution, render jobs, workers, or publishing tables.

CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "premise" TEXT NOT NULL,
    "hook" TEXT NOT NULL DEFAULT '',
    "comedyAngle" TEXT NOT NULL DEFAULT '',
    "targetDurationSec" INTEGER NOT NULL DEFAULT 30,
    "targetAspectRatio" TEXT NOT NULL DEFAULT '9:16',
    "language" TEXT NOT NULL DEFAULT 'hinglish',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EpisodeCharacter" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "roleInEpisode" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpisodeCharacter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "sceneNumber" INTEGER NOT NULL,
    "roomId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "beat" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 8,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Shot" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "shotNumber" INTEGER NOT NULL,
    "shotType" TEXT NOT NULL,
    "cameraFraming" TEXT NOT NULL,
    "cameraMovement" TEXT NOT NULL,
    "actionDescription" TEXT NOT NULL,
    "visualDescription" TEXT NOT NULL,
    "imagePrompt" TEXT NOT NULL,
    "videoPrompt" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 3,
    "emotion" TEXT NOT NULL,
    "continuityNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DialogueLine" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "shotId" TEXT,
    "characterId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "emotion" TEXT,
    "deliveryStyle" TEXT,
    "captionText" TEXT NOT NULL,
    "startOffsetMs" INTEGER,
    "durationEstimateMs" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DialogueLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Episode_seriesId_episodeNumber_key" ON "Episode"("seriesId", "episodeNumber");
CREATE UNIQUE INDEX "Episode_seriesId_code_key" ON "Episode"("seriesId", "code");
CREATE INDEX "Episode_seriesId_idx" ON "Episode"("seriesId");
CREATE INDEX "Episode_code_idx" ON "Episode"("code");
CREATE INDEX "Episode_status_idx" ON "Episode"("status");

CREATE UNIQUE INDEX "EpisodeCharacter_episodeId_characterId_key" ON "EpisodeCharacter"("episodeId", "characterId");
CREATE INDEX "EpisodeCharacter_episodeId_idx" ON "EpisodeCharacter"("episodeId");
CREATE INDEX "EpisodeCharacter_characterId_idx" ON "EpisodeCharacter"("characterId");

CREATE UNIQUE INDEX "Scene_episodeId_sceneNumber_key" ON "Scene"("episodeId", "sceneNumber");
CREATE INDEX "Scene_episodeId_idx" ON "Scene"("episodeId");
CREATE INDEX "Scene_roomId_idx" ON "Scene"("roomId");
CREATE INDEX "Scene_status_idx" ON "Scene"("status");

CREATE UNIQUE INDEX "Shot_sceneId_shotNumber_key" ON "Shot"("sceneId", "shotNumber");
CREATE INDEX "Shot_sceneId_idx" ON "Shot"("sceneId");
CREATE INDEX "Shot_status_idx" ON "Shot"("status");

CREATE UNIQUE INDEX "DialogueLine_sceneId_lineNumber_key" ON "DialogueLine"("sceneId", "lineNumber");
CREATE INDEX "DialogueLine_sceneId_idx" ON "DialogueLine"("sceneId");
CREATE INDEX "DialogueLine_shotId_idx" ON "DialogueLine"("shotId");
CREATE INDEX "DialogueLine_characterId_idx" ON "DialogueLine"("characterId");

ALTER TABLE "Episode"
  ADD CONSTRAINT "Episode_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "RandomRoomsSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EpisodeCharacter"
  ADD CONSTRAINT "EpisodeCharacter_episodeId_fkey"
  FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EpisodeCharacter"
  ADD CONSTRAINT "EpisodeCharacter_characterId_fkey"
  FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Scene"
  ADD CONSTRAINT "Scene_episodeId_fkey"
  FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Scene"
  ADD CONSTRAINT "Scene_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "RoomProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Shot"
  ADD CONSTRAINT "Shot_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DialogueLine"
  ADD CONSTRAINT "DialogueLine_sceneId_fkey"
  FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DialogueLine"
  ADD CONSTRAINT "DialogueLine_shotId_fkey"
  FOREIGN KEY ("shotId") REFERENCES "Shot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DialogueLine"
  ADD CONSTRAINT "DialogueLine_characterId_fkey"
  FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
