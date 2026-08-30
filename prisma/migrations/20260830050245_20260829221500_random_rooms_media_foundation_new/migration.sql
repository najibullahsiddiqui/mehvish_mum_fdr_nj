/*
  Warnings:

  - You are about to drop the `RandomRoomsAnalyticsSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RandomRoomsPublication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RandomRoomsAnalyticsSnapshot" DROP CONSTRAINT "RandomRoomsAnalyticsSnapshot_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "RandomRoomsAnalyticsSnapshot" DROP CONSTRAINT "RandomRoomsAnalyticsSnapshot_publicationId_fkey";

-- DropForeignKey
ALTER TABLE "RandomRoomsPublication" DROP CONSTRAINT "RandomRoomsPublication_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "RandomRoomsPublication" DROP CONSTRAINT "RandomRoomsPublication_finalAssetId_fkey";

-- DropForeignKey
ALTER TABLE "RandomRoomsPublication" DROP CONSTRAINT "RandomRoomsPublication_seriesId_fkey";

-- DropTable
DROP TABLE "RandomRoomsAnalyticsSnapshot";

-- DropTable
DROP TABLE "RandomRoomsPublication";
