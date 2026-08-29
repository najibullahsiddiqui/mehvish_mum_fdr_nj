import { randomUUID } from "node:crypto";
import { HttpError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { resolveLocalMediaAsset } from "@/lib/render/service";
import { YouTubeClient } from "@/lib/youtube/client";
import { publicYouTubeStatus } from "@/lib/youtube/config";

export type PublicationRow = {
  id: string;
  seriesId: string;
  episodeId: string;
  finalAssetId: string;
  platform: string;
  status: string;
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  privacyStatus: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  lastSyncAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AnalyticsRow = {
  id: string;
  publicationId: string;
  episodeId: string;
  youtubeVideoId: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDurationSec: number | null;
  averageViewPercentage: number | null;
  subscribersGained: number | null;
  impressions: number | null;
  impressionsCtr: number | null;
  collectedAt: Date;
};

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function defaultMetadata(episode: { title: string; premise: string; hook: string; language: string; series: { name: string } }) {
  const title = `${episode.title} | ${episode.series.name}`.slice(0, 100);
  const hashtags = ["#Shorts", "#RandomRooms", "#AIComedy"];
  const description = `${episode.hook || episode.premise}\n\n${episode.premise}\n\n${hashtags.join(" ")}`.slice(0, 5000);
  const tags = unique([episode.series.name, episode.title, "Random Rooms", "AI comedy", "shorts", episode.language]);
  return { title, description, tags, hashtags };
}

export async function getPublication(episodeId: string) {
  const rows = await prisma.$queryRaw<PublicationRow[]>`SELECT * FROM "RandomRoomsPublication" WHERE "episodeId"=${episodeId} LIMIT 1`;
  return rows[0] || null;
}

async function latestAnalytics(publicationId: string) {
  const rows = await prisma.$queryRaw<AnalyticsRow[]>`SELECT * FROM "RandomRoomsAnalyticsSnapshot" WHERE "publicationId"=${publicationId} ORDER BY "collectedAt" DESC LIMIT 1`;
  return rows[0] || null;
}

export async function getReleaseState(episodeId: string) {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { series: true, mediaAssets: { where: { assetType: "FINAL_VIDEO" }, orderBy: { createdAt: "desc" } } },
  });
  if (!episode) throw new HttpError("Episode not found.", 404);
  const finalAsset = episode.mediaAssets.find((asset) => asset.status === "APPROVED" && !!asset.localPath) || null;
  const publication = await getPublication(episode.id);
  const analytics = publication ? await latestAnalytics(publication.id) : null;
  const metadata = defaultMetadata(episode);
  return {
    episode: { id: episode.id, code: episode.code, title: episode.title, status: episode.status },
    finalAsset,
    publication,
    analytics,
    suggestedMetadata: metadata,
    youtube: publicYouTubeStatus(),
    gates: {
      finalApproved: !!finalAsset,
      episodeApproved: episode.status === "APPROVED" || episode.status === "SCHEDULED" || episode.status === "PUBLISHED" || episode.status === "ANALYZED",
      metadataReady: !!publication?.title?.trim() || !!metadata.title,
      canPublish: !!finalAsset && ["APPROVED", "SCHEDULED", "PUBLISHED", "ANALYZED"].includes(episode.status),
      published: !!publication?.youtubeVideoId && ["PUBLISHED", "SCHEDULED"].includes(publication.status),
      analyticsAvailable: !!analytics,
    },
  };
}

export async function savePublicationDraft(input: {
  episodeId: string;
  title?: string;
  description?: string;
  tags?: string[];
  hashtags?: string[];
  privacyStatus?: "private" | "unlisted" | "public";
  scheduledAt?: string | null;
}) {
  const state = await getReleaseState(input.episodeId);
  if (!state.finalAsset || !state.gates.episodeApproved) throw new HttpError("Approve the final video before preparing the YouTube release.", 422);
  const metadata = state.suggestedMetadata;
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new HttpError("Invalid scheduled publish date.", 422);
  const privacyStatus = scheduledAt ? "private" : input.privacyStatus || "private";
  const id = state.publication?.id || randomUUID();
  const title = (input.title?.trim() || metadata.title).slice(0, 100);
  const description = (input.description?.trim() || metadata.description).slice(0, 5000);
  const tags = unique(input.tags?.length ? input.tags : metadata.tags).slice(0, 60);
  const hashtags = unique(input.hashtags?.length ? input.hashtags : metadata.hashtags).slice(0, 15);

  if (state.publication) {
    await prisma.$executeRaw`UPDATE "RandomRoomsPublication" SET "finalAssetId"=${state.finalAsset.id}, "title"=${title}, "description"=${description}, "tags"=${tags}, "hashtags"=${hashtags}, "privacyStatus"=${privacyStatus}, "scheduledAt"=${scheduledAt}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id}`;
  } else {
    await prisma.$executeRaw`INSERT INTO "RandomRoomsPublication" ("id","seriesId","episodeId","finalAssetId","title","description","tags","hashtags","privacyStatus","scheduledAt") VALUES (${id},${state.finalAsset.seriesId},${input.episodeId},${state.finalAsset.id},${title},${description},${tags},${hashtags},${privacyStatus},${scheduledAt})`;
  }
  return getPublication(input.episodeId);
}

export async function publishEpisodeToYouTube(episodeId: string) {
  const state = await getReleaseState(episodeId);
  if (!state.gates.canPublish || !state.finalAsset) throw new HttpError("Release gate failed: approve the final video first.", 422);
  const publication = state.publication || (await savePublicationDraft({ episodeId }));
  if (!publication) throw new HttpError("Could not prepare publication metadata.", 500);
  if (publication.youtubeVideoId) throw new HttpError("This episode already has a YouTube video ID. Use analytics sync instead of uploading again.", 409);
  const resolved = await resolveLocalMediaAsset(state.finalAsset.id);
  await prisma.$executeRaw`UPDATE "RandomRoomsPublication" SET "status"='UPLOADING', "errorMessage"=NULL, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${publication.id}`;
  try {
    const result = await new YouTubeClient().uploadVideo({
      filePath: resolved.path,
      mimeType: state.finalAsset.mimeType,
      title: publication.title,
      description: `${publication.description}\n\n${publication.hashtags.join(" ")}`.trim(),
      tags: publication.tags,
      privacyStatus: publication.scheduledAt ? "private" : (publication.privacyStatus as "private" | "unlisted" | "public"),
      publishAt: publication.scheduledAt?.toISOString() || null,
      defaultLanguage: state.episode.status ? undefined : undefined,
    });
    const status = publication.scheduledAt ? "SCHEDULED" : publication.privacyStatus === "public" ? "PUBLISHED" : "UPLOADED";
    const publishedAt = status === "PUBLISHED" ? new Date() : null;
    await prisma.$executeRaw`UPDATE "RandomRoomsPublication" SET "status"=${status}, "youtubeVideoId"=${result.videoId}, "youtubeUrl"=${result.url}, "publishedAt"=${publishedAt}, "lastSyncAt"=CURRENT_TIMESTAMP, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${publication.id}`;
    await prisma.episode.update({ where: { id: episodeId }, data: { status: status === "SCHEDULED" ? "SCHEDULED" : "PUBLISHED" } });
    return getReleaseState(episodeId);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "YouTube upload failed.";
    await prisma.$executeRaw`UPDATE "RandomRoomsPublication" SET "status"='FAILED', "errorMessage"=${message}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${publication.id}`;
    throw error;
  }
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function syncYouTubeAnalytics(episodeId: string) {
  const publication = await getPublication(episodeId);
  if (!publication?.youtubeVideoId) throw new HttpError("Publish or upload the episode before syncing analytics.", 422);
  const start = publication.publishedAt || publication.scheduledAt || publication.createdAt;
  const metrics = await new YouTubeClient().fetchAnalytics(publication.youtubeVideoId, dateOnly(start), dateOnly(new Date()));
  const id = randomUUID();
  await prisma.$executeRaw`INSERT INTO "RandomRoomsAnalyticsSnapshot" ("id","publicationId","episodeId","youtubeVideoId","views","likes","comments","estimatedMinutesWatched","averageViewDurationSec","averageViewPercentage","subscribersGained") VALUES (${id},${publication.id},${episodeId},${publication.youtubeVideoId},${metrics.views},${metrics.likes},${metrics.comments},${metrics.estimatedMinutesWatched},${metrics.averageViewDurationSec},${metrics.averageViewPercentage},${metrics.subscribersGained})`;
  await prisma.$executeRaw`UPDATE "RandomRoomsPublication" SET "lastSyncAt"=CURRENT_TIMESTAMP, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${publication.id}`;
  await prisma.episode.update({ where: { id: episodeId }, data: { status: "ANALYZED" } });
  return getReleaseState(episodeId);
}
