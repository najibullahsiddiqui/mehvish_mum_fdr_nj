import { HttpError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { normalizeProviderError } from "@/lib/providers/errors";
import { RunPodClient } from "@/lib/runpod/client";
import { assertRunPodConfigured, getRunPodConfig } from "@/lib/runpod/config";
import type { RunPodStatusResponse, RunPodStatusSnapshot } from "@/lib/runpod/types";

function internalStatus(status: string) {
  switch (status) {
    case "IN_QUEUE":
      return "QUEUED";
    case "IN_PROGRESS":
      return "RUNNING";
    case "COMPLETED":
      return "COMPLETED";
    case "FAILED":
    case "TIMED_OUT":
    case "CANCELLED":
      return status;
    default:
      return "UNKNOWN";
  }
}

function firstUrl(value: unknown): string | null {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    for (const key of ["videoUrl", "video_url", "outputUrl", "output_url", "url", "fileUrl", "file_url"]) {
      const found = firstUrl(object[key]);
      if (found) return found;
    }
    for (const nested of Object.values(object)) {
      const found = firstUrl(nested);
      if (found) return found;
    }
  }
  return null;
}

export async function getRunPodStatusSnapshot(checkHealth = true): Promise<RunPodStatusSnapshot> {
  const config = getRunPodConfig();
  const videoConfigured = !!config.apiKey && !!config.videoEndpointId;
  const imageConfigured = !!config.apiKey && !!config.imageEndpointId;
  const configured = videoConfigured || imageConfigured;

  const base: RunPodStatusSnapshot = {
    enabled: config.enabled,
    configured,
    videoConfigured,
    imageConfigured,
    available: null,
    baseUrl: config.baseUrl,
    videoEndpointId: config.videoEndpointId,
    imageEndpointId: config.imageEndpointId,
    videoModel: config.videoModel,
    requestTimeoutMs: config.requestTimeoutMs,
    message: !config.enabled
      ? "RunPod is configured in safe-off mode. Set RUNPOD_ENABLED=true only when GPU execution is intended."
      : configured
        ? undefined
        : "Add RUNPOD_API_KEY and at least one endpoint ID.",
    health: null,
  };

  if (!checkHealth || !config.enabled || !videoConfigured || !config.videoEndpointId) return base;

  try {
    const client = new RunPodClient(config);
    const health = await client.health(config.videoEndpointId);
    return { ...base, available: true, health, message: undefined };
  } catch (error) {
    const normalized = normalizeProviderError(error);
    return { ...base, available: false, message: normalized.message, health: null };
  }
}

export async function listProductionState(seriesId: string) {
  const series = await prisma.randomRoomsSeries.findUnique({
    where: { id: seriesId },
    select: { id: true, name: true },
  });
  if (!series) throw new HttpError("Random Rooms series not found.", 404);

  const [jobs, assets, runPod] = await Promise.all([
    prisma.generationJob.findMany({
      where: { seriesId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        episode: { select: { id: true, code: true, title: true, episodeNumber: true } },
        scene: { select: { id: true, sceneNumber: true, title: true } },
        shot: { select: { id: true, shotNumber: true, shotType: true } },
      },
    }),
    prisma.mediaAsset.findMany({
      where: { seriesId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        episode: { select: { id: true, code: true, title: true, episodeNumber: true } },
        scene: { select: { id: true, sceneNumber: true, title: true } },
        shot: { select: { id: true, shotNumber: true, shotType: true } },
      },
    }),
    getRunPodStatusSnapshot(false),
  ]);

  return { series, runPod, jobs, assets };
}

export async function submitShotVideoJob(shotId: string) {
  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: {
      scene: {
        include: {
          episode: true,
          room: true,
        },
      },
    },
  });
  if (!shot) throw new HttpError("Shot not found.", 404);
  if (!shot.videoPrompt.trim()) throw new HttpError("Add a video prompt before sending this shot to RunPod.", 422);

  const config = getRunPodConfig();
  assertRunPodConfigured(config, config.videoEndpointId);
  const endpointId = config.videoEndpointId!;
  const episode = shot.scene.episode;

  const input = {
    task: "image_to_video",
    prompt: shot.videoPrompt,
    visual_description: shot.visualDescription,
    action_description: shot.actionDescription,
    duration_seconds: shot.durationSec,
    aspect_ratio: episode.targetAspectRatio,
    camera_framing: shot.cameraFraming,
    camera_movement: shot.cameraMovement,
    continuity_notes: shot.continuityNotes,
    room: shot.scene.room
      ? {
          code: shot.scene.room.code,
          name: shot.scene.room.name,
          visual_style: shot.scene.room.visualStyle,
          lighting: shot.scene.room.lighting,
          color_mood: shot.scene.room.colorMood,
        }
      : null,
    metadata: {
      series_id: episode.seriesId,
      episode_id: episode.id,
      scene_id: shot.sceneId,
      shot_id: shot.id,
    },
  };

  const job = await prisma.generationJob.create({
    data: {
      seriesId: episode.seriesId,
      episodeId: episode.id,
      sceneId: shot.sceneId,
      shotId: shot.id,
      roomId: shot.scene.roomId,
      jobType: "VIDEO",
      provider: "runpod",
      model: config.videoModel,
      status: "SUBMITTING",
      input,
      startedAt: new Date(),
    },
  });

  try {
    const client = new RunPodClient(config);
    const submitted = await client.submit({ endpointId, input });
    return prisma.generationJob.update({
      where: { id: job.id },
      data: {
        providerJobId: submitted.id,
        status: internalStatus(submitted.status || "IN_QUEUE"),
      },
    });
  } catch (error) {
    const normalized = normalizeProviderError(error);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorCode: normalized.code,
        errorMessage: normalized.message,
        completedAt: new Date(),
      },
    });
    throw normalized;
  }
}

async function ensureCompletedAsset(job: {
  id: string;
  seriesId: string;
  episodeId: string | null;
  sceneId: string | null;
  shotId: string | null;
  dialogueLineId: string | null;
  characterId: string | null;
  roomId: string | null;
  providerJobId: string | null;
  provider: string;
  model: string | null;
}, status: RunPodStatusResponse) {
  const remoteUrl = firstUrl(status.output);
  if (!remoteUrl || !job.providerJobId) return null;

  const existing = await prisma.mediaAsset.findFirst({
    where: { providerJobId: job.providerJobId, assetType: "VIDEO_CLIP" },
  });
  if (existing) return existing;

  return prisma.mediaAsset.create({
    data: {
      seriesId: job.seriesId,
      episodeId: job.episodeId,
      sceneId: job.sceneId,
      shotId: job.shotId,
      dialogueLineId: job.dialogueLineId,
      characterId: job.characterId,
      roomId: job.roomId,
      assetType: "VIDEO_CLIP",
      status: "READY",
      provider: job.provider,
      providerJobId: job.providerJobId,
      model: job.model,
      remoteUrl,
      metadata: {
        runPodJobId: status.id,
        delayTime: status.delayTime ?? null,
        executionTime: status.executionTime ?? null,
      },
    },
  });
}

export async function syncGenerationJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Generation job not found.", 404);
  if (job.provider !== "runpod") throw new HttpError("Only RunPod jobs can be synced by this endpoint.", 422);
  if (!job.providerJobId) throw new HttpError("RunPod job ID is missing.", 422);

  const config = getRunPodConfig();
  const endpointId = job.jobType === "IMAGE" ? config.imageEndpointId : config.videoEndpointId;
  assertRunPodConfigured(config, endpointId);

  try {
    const client = new RunPodClient(config);
    const status = await client.status(endpointId!, job.providerJobId);
    const mapped = internalStatus(status.status);
    const terminal = ["COMPLETED", "FAILED", "TIMED_OUT", "CANCELLED"].includes(mapped);
    const updated = await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: mapped,
        output: status.output === undefined ? undefined : (status.output as object),
        errorMessage: status.error || null,
        completedAt: terminal ? new Date() : null,
      },
    });
    const asset = mapped === "COMPLETED" ? await ensureCompletedAsset(updated, status) : null;
    return { job: updated, asset, providerStatus: status };
  } catch (error) {
    const normalized = normalizeProviderError(error);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { errorCode: normalized.code, errorMessage: normalized.message },
    });
    throw normalized;
  }
}
