-- Random Rooms Phase 3: Character Studio only.
-- This migration is additive and intentionally does not add rooms, episodes,
-- scenes, media assets, render jobs, workers, TTS, or publishing tables.

CREATE TABLE "RandomRoomsSeries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Random Rooms',
    "slug" TEXT NOT NULL DEFAULT 'random-rooms',
    "concept" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'hinglish',
    "targetFormat" TEXT NOT NULL DEFAULT 'youtube_shorts',
    "defaultDurationSec" INTEGER NOT NULL DEFAULT 60,
    "contentRules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RandomRoomsSeries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "characterType" TEXT NOT NULL,
    "personality" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "speakingStyle" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "catchphrases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "doNotSay" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "visualDescription" TEXT NOT NULL,
    "signatureTraits" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "voiceProfile" JSONB,
    "continuityNotes" TEXT,
    "referenceAssetNotes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharacterRelationship" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "characterAId" TEXT NOT NULL,
    "characterBId" TEXT NOT NULL,
    "pairKey" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "dynamic" TEXT NOT NULL,
    "conflictPattern" TEXT NOT NULL,
    "comedyPattern" TEXT NOT NULL,
    "continuityNotes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterRelationship_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CharacterRelationship_distinct_characters_check" CHECK ("characterAId" <> "characterBId")
);

CREATE UNIQUE INDEX "RandomRoomsSeries_slug_key" ON "RandomRoomsSeries"("slug");
CREATE INDEX "RandomRoomsSeries_active_idx" ON "RandomRoomsSeries"("active");
CREATE INDEX "RandomRoomsSeries_slug_idx" ON "RandomRoomsSeries"("slug");

CREATE UNIQUE INDEX "Character_seriesId_code_key" ON "Character"("seriesId", "code");
CREATE INDEX "Character_seriesId_idx" ON "Character"("seriesId");
CREATE INDEX "Character_code_idx" ON "Character"("code");
CREATE INDEX "Character_active_idx" ON "Character"("active");

CREATE UNIQUE INDEX "CharacterRelationship_seriesId_pairKey_key" ON "CharacterRelationship"("seriesId", "pairKey");
CREATE INDEX "CharacterRelationship_seriesId_idx" ON "CharacterRelationship"("seriesId");
CREATE INDEX "CharacterRelationship_characterAId_idx" ON "CharacterRelationship"("characterAId");
CREATE INDEX "CharacterRelationship_characterBId_idx" ON "CharacterRelationship"("characterBId");
CREATE INDEX "CharacterRelationship_active_idx" ON "CharacterRelationship"("active");

ALTER TABLE "Character"
  ADD CONSTRAINT "Character_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "RandomRoomsSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterRelationship"
  ADD CONSTRAINT "CharacterRelationship_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "RandomRoomsSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterRelationship"
  ADD CONSTRAINT "CharacterRelationship_characterAId_fkey"
  FOREIGN KEY ("characterAId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CharacterRelationship"
  ADD CONSTRAINT "CharacterRelationship_characterBId_fkey"
  FOREIGN KEY ("characterBId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
