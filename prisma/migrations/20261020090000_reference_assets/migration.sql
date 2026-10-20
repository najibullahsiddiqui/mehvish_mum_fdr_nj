ALTER TABLE "MediaAsset"
  ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "MediaAsset_isPrimary_idx"
  ON "MediaAsset"("isPrimary");

CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_primary_character_reference_key"
  ON "MediaAsset"("characterId")
  WHERE "characterId" IS NOT NULL
    AND "assetType" = 'CHARACTER_REFERENCE'
    AND "isPrimary" = true
    AND "status" IN ('READY','APPROVED');

CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_primary_room_reference_key"
  ON "MediaAsset"("roomId")
  WHERE "roomId" IS NOT NULL
    AND "assetType" = 'ROOM_REFERENCE'
    AND "isPrimary" = true
    AND "status" IN ('READY','APPROVED');
