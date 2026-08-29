CREATE TABLE "RandomRoomsPublication" (
  "id" TEXT NOT NULL,
  "seriesId" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "finalAssetId" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'youtube',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "hashtags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "privacyStatus" TEXT NOT NULL DEFAULT 'private',
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "youtubeVideoId" TEXT,
  "youtubeUrl" TEXT,
  "lastSyncAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RandomRoomsPublication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RandomRoomsPublication_episodeId_key" ON "RandomRoomsPublication"("episodeId");
CREATE INDEX "RandomRoomsPublication_seriesId_idx" ON "RandomRoomsPublication"("seriesId");
CREATE INDEX "RandomRoomsPublication_status_idx" ON "RandomRoomsPublication"("status");
CREATE INDEX "RandomRoomsPublication_youtubeVideoId_idx" ON "RandomRoomsPublication"("youtubeVideoId");

CREATE TABLE "RandomRoomsAnalyticsSnapshot" (
  "id" TEXT NOT NULL,
  "publicationId" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "youtubeVideoId" TEXT NOT NULL,
  "views" INTEGER,
  "likes" INTEGER,
  "comments" INTEGER,
  "estimatedMinutesWatched" DOUBLE PRECISION,
  "averageViewDurationSec" DOUBLE PRECISION,
  "averageViewPercentage" DOUBLE PRECISION,
  "subscribersGained" INTEGER,
  "impressions" INTEGER,
  "impressionsCtr" DOUBLE PRECISION,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RandomRoomsAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RandomRoomsAnalyticsSnapshot_publicationId_idx" ON "RandomRoomsAnalyticsSnapshot"("publicationId");
CREATE INDEX "RandomRoomsAnalyticsSnapshot_episodeId_idx" ON "RandomRoomsAnalyticsSnapshot"("episodeId");
CREATE INDEX "RandomRoomsAnalyticsSnapshot_collectedAt_idx" ON "RandomRoomsAnalyticsSnapshot"("collectedAt");

ALTER TABLE "RandomRoomsPublication" ADD CONSTRAINT "RandomRoomsPublication_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RandomRoomsSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RandomRoomsPublication" ADD CONSTRAINT "RandomRoomsPublication_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RandomRoomsPublication" ADD CONSTRAINT "RandomRoomsPublication_finalAssetId_fkey" FOREIGN KEY ("finalAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RandomRoomsAnalyticsSnapshot" ADD CONSTRAINT "RandomRoomsAnalyticsSnapshot_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "RandomRoomsPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RandomRoomsAnalyticsSnapshot" ADD CONSTRAINT "RandomRoomsAnalyticsSnapshot_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
