import { HttpError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { resolveLocalMediaAsset } from "@/lib/render/service";
import { YouTubeClient } from "@/lib/youtube/client";
import { publicYouTubeStatus } from "@/lib/youtube/config";

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
  return prisma.randomRoomsPublication.findUnique({ where: { episodeId } });
}

async function latestAnalytics(publicationId: string) {
  return prisma.randomRoomsAnalyticsSnapshot.findFirst({
    where: { publicationId },
    orderBy: { collectedAt: "desc" },
  });
}

export async function getReleaseState(episodeId: string) {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: {
      series: true,
      mediaAssets: {
        where: { assetType: "FINAL_VIDEO" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!episode) throw new HttpError("Episode not found.", 404);

  const finalAsset = episode.mediaAssets.find((asset) => asset.status === "APPROVED" && !!asset.localPath) || null;
  const publication = await getPublication(episode.id);
  const analytics = publication ? await latestAnalytics(publication.id) : null;
  const metadata = defaultMetadata(episode);
  const releaseReadyStatuses = ["APPROVED", "UPLOADED", "SCHEDULED", "PUBLISHED", "ANALYZED"];

  return {
    episode: { id: episode.id, code: episode.code, title: episode.title, status: episode.status },
    finalAsset,
    publication,
    analytics,
    suggestedMetadata: metadata,
    youtube: publicYouTubeStatus(),
    gates: {
      finalApproved: !!finalAsset,
      episodeApproved: releaseReadyStatuses.includes(episode.status),
      metadataReady: !!publication?.title?.trim() || !!metadata.title,
      canPublish: !!finalAsset && releaseReadyStatuses.includes(episode.status),
      published: !!publication?.youtubeVideoId && ["UPLOADED", "PUBLISHED", "SCHEDULED"].includes(publication.status),
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
  if (!state.finalAsset || !state.gates.episodeApproved) {
    throw new HttpError("Approve the final video before preparing the YouTube release.", 422);
  }

  const metadata = state.suggestedMetadata;
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new HttpError("Invalid scheduled publish date.", 422);

  const privacyStatus = scheduledAt ? "private" : input.privacyStatus || "private";
  const title = (input.title?.trim() || metadata.title).slice(0, 100);
  const description = (input.description?.trim() || metadata.description).slice(0, 5000);
  const tags = unique(input.tags?.length ? input.tags : metadata.tags).slice(0, 60);
  const hashtags = unique(input.hashtags?.length ? input.hashtags : metadata.hashtags).slice(0, 15);

  return prisma.randomRoomsPublication.upsert({
    where: { episodeId: input.episodeId },
    update: {
      finalAssetId: state.finalAsset.id,
      title,
      description,
      tags,
      hashtags,
      privacyStatus,
      scheduledAt,
      errorMessage: null,
    },
    create: {
      seriesId: state.finalAsset.seriesId,
      episodeId: input.episodeId,
      finalAssetId: state.finalAsset.id,
      title,
      description,
      tags,
      hashtags,
      privacyStatus,
      scheduledAt,
    },
  });
}

export async function publishEpisodeToYouTube(episodeId: string) {
  const state = await getReleaseState(episodeId);
  if (!state.gates.canPublish || !state.finalAsset) {
    throw new HttpError("Release gate failed: approve the final video first.", 422);
  }

  const publication = state.publication || (await savePublicationDraft({ episodeId }));
  if (publication.youtubeVideoId) {
    throw new HttpError("This episode already has a YouTube video ID. Use analytics sync instead of uploading again.", 409);
  }

  const resolved = await resolveLocalMediaAsset(state.finalAsset.id);
  await prisma.randomRoomsPublication.update({
    where: { id: publication.id },
    data: { status: "UPLOADING", errorMessage: null },
  });

  try {
    const result = await new YouTubeClient().uploadVideo({
      filePath: resolved.path,
      mimeType: state.finalAsset.mimeType,
      title: publication.title,
      description: `${publication.description}\n\n${publication.hashtags.join(" ")}`.trim(),
      tags: publication.tags,
      privacyStatus: publication.scheduledAt
        ? "private"
        : (publication.privacyStatus as "private" | "unlisted" | "public"),
      publishAt: publication.scheduledAt?.toISOString() || null,
    });

    const status = publication.scheduledAt
      ? "SCHEDULED"
      : publication.privacyStatus === "public"
        ? "PUBLISHED"
        : "UPLOADED";
    const publishedAt = status === "PUBLISHED" ? new Date() : null;

    await prisma.$transaction([
      prisma.randomRoomsPublication.update({
        where: { id: publication.id },
        data: {
          status,
          youtubeVideoId: result.videoId,
          youtubeUrl: result.url,
          publishedAt,
          lastSyncAt: new Date(),
          errorMessage: null,
        },
      }),
      prisma.episode.update({ where: { id: episodeId }, data: { status } }),
    ]);

    return getReleaseState(episodeId);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "YouTube upload failed.";
    await prisma.randomRoomsPublication.update({
      where: { id: publication.id },
      data: { status: "FAILED", errorMessage: message },
    });
    throw error;
  }
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function syncYouTubeAnalytics(episodeId: string) {
  const publication = await getPublication(episodeId);
  if (!publication?.youtubeVideoId) {
    throw new HttpError("Publish or upload the episode before syncing analytics.", 422);
  }

  const start = publication.publishedAt || publication.scheduledAt || publication.createdAt;
  const metrics = await new YouTubeClient().fetchAnalytics(
    publication.youtubeVideoId,
    dateOnly(start),
    dateOnly(new Date()),
  );

  await prisma.$transaction([
    prisma.randomRoomsAnalyticsSnapshot.create({
      data: {
        publicationId: publication.id,
        episodeId,
        youtubeVideoId: publication.youtubeVideoId,
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        estimatedMinutesWatched: metrics.estimatedMinutesWatched,
        averageViewDurationSec: metrics.averageViewDurationSec,
        averageViewPercentage: metrics.averageViewPercentage,
        subscribersGained: metrics.subscribersGained,
      },
    }),
    prisma.randomRoomsPublication.update({
      where: { id: publication.id },
      data: { lastSyncAt: new Date() },
    }),
    prisma.episode.update({ where: { id: episodeId }, data: { status: "ANALYZED" } }),
  ]);

  return getReleaseState(episodeId);
}
