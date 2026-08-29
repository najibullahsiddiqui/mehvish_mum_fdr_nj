-- Random Rooms Phase 4: Room Studio only.
-- This migration is additive and intentionally does not add episodes, scenes,
-- shots, dialogue, media assets, render jobs, workers, TTS, Wan, Remotion, or publishing tables.

CREATE TABLE "RoomProfile" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "visualStyle" TEXT NOT NULL,
    "lighting" TEXT NOT NULL,
    "colorMood" TEXT NOT NULL,
    "cameraConstraints" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "props" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "environmentRules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "continuityNotes" TEXT,
    "referenceAssetNotes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomProfile_seriesId_code_key" ON "RoomProfile"("seriesId", "code");
CREATE INDEX "RoomProfile_seriesId_idx" ON "RoomProfile"("seriesId");
CREATE INDEX "RoomProfile_code_idx" ON "RoomProfile"("code");
CREATE INDEX "RoomProfile_active_idx" ON "RoomProfile"("active");

ALTER TABLE "RoomProfile"
  ADD CONSTRAINT "RoomProfile_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "RandomRoomsSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
