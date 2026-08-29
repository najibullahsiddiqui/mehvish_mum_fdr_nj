import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/lib/api";
import { downloadRemoteMedia } from "@/lib/media/download";
import { episodeMediaDirectory, safeMediaSegment } from "@/lib/media/storage";
import { prisma } from "@/lib/prisma";
import { normalizeProviderError } from "@/lib/providers/errors";
import { RunPodClient } from "@/lib/runpod/client";
import { assertRunPodConfigured, getRunPodConfig } from "@/lib/runpod/config";
import type { RunPodStatusResponse, RunPodStatusSnapshot } from "@/lib/runpod/types";
import { LocalTtsClient } from "@/lib/tts/client";
import { getLocalTtsConfig } from "@/lib/tts/config";

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
    for (const key of ["videoUrl", "video_url", "imageUrl", "image_url", "outputUrl", "output_url", "url", "fileUrl", "file_url"]) {
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

function voiceIdFromProfile(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const voiceId = (value as Record<string, unknown>).voiceId;
  return typeof voiceId === "string" && voiceId.trim() ? voiceId.trim() : null;
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
    imageModel: config.imageModel,
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
  const series = await prisma.randomRoomsSeries.findUnique({ where: { id: seriesId }, select: { id: true, name: true } });
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

async function shotWithPlanning(shotId: string) {
  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: { scene: { include: { episode: true, room: true } } },
  });
  if (!shot) throw new HttpError("Shot not found.", 404);
  return shot;
}

export async function submitShotImageJob(shotId: string) {
  const shot = await shotWithPlanning(shotId);
  if (!shot.imagePrompt.trim()) throw new HttpError("Add an image prompt before generating a keyframe.", 422);

  const config = getRunPodConfig();
  assertRunPodConfigured(config, config.imageEndpointId);
  const endpointId = config.imageEndpointId!;
  const episode = shot.scene.episode;
  const input = {
    task: "text_to_image",
    prompt: shot.imagePrompt,
    visual_description: shot.visualDescription,
    aspect_ratio: episode.targetAspectRatio,
    camera_framing: shot.cameraFraming,
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
    metadata: { series_id: episode.seriesId, episode_id: episode.id, scene_id: shot.sceneId, shot_id: shot.id },
  };

  const job = await prisma.generationJob.create({
    data: {
      seriesId: episode.seriesId,
      episodeId: episode.id,
      sceneId: shot.sceneId,
      shotId: shot.id,
      roomId: shot.scene.roomId,
      jobType: "IMAGE",
      provider: "runpod",
      model: config.imageModel,
      status: "SUBMITTING",
      input,
      startedAt: new Date(),
    },
  });

  try {
    const submitted = await new RunPodClient(config).submit({ endpointId, input });
    return prisma.generationJob.update({
      where: { id: job.id },
      data: { providerJobId: submitted.id, status: internalStatus(submitted.status || "IN_QUEUE") },
    });
  } catch (error) {
    const normalized = normalizeProviderError(error);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorCode: normalized.code, errorMessage: normalized.message, completedAt: new Date() },
    });
    throw normalized;
  }
}

export async function submitShotVideoJob(shotId: string) {
  const shot = await shotWithPlanning(shotId);
  if (!shot.videoPrompt.trim()) throw new HttpError("Add a video prompt before sending this shot to RunPod.", 422);

  const config = getRunPodConfig();
  assertRunPodConfigured(config, config.videoEndpointId);
  const endpointId = config.videoEndpointId!;
  const episode = shot.scene.episode;
  const keyframe = await prisma.mediaAsset.findFirst({
    where: { shotId: shot.id, assetType: "IMAGE_KEYFRAME", status: "READY" },
    orderBy: { createdAt: "desc" },
  });

  const input = {
    task: keyframe?.remoteUrl || keyframe?.localPath ? "image_to_video" : "text_to_video",
    prompt: shot.videoPrompt,
    image_url: keyframe?.remoteUrl || null,
    local_image_path: !keyframe?.remoteUrl ? keyframe?.localPath || null : null,
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
    metadata: { series_id: episode.seriesId, episode_id: episode.id, scene_id: shot.sceneId, shot_id: shot.id },
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
    const submitted = await new RunPodClient(config).submit({ endpointId, input });
    return prisma.generationJob.update({
      where: { id: job.id },
      data: { providerJobId: submitted.id, status: internalStatus(submitted.status || "IN_QUEUE") },
    });
  } catch (error) {
    const normalized = normalizeProviderError(error);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorCode: normalized.code, errorMessage: normalized.message, completedAt: new Date() },
    });
    throw normalized;
  }
}

export async function synthesizeDialogueVoice(dialogueLineId: string) {
  const line = await prisma.dialogueLine.findUnique({
    where: { id: dialogueLineId },
    include: { character: true, scene: { include: { episode: { include: { series: true } } } } },
  });
  if (!line) throw new HttpError("Dialogue line not found.", 404);

  const config = getLocalTtsConfig();
  const job = await prisma.generationJob.create({
    data: {
      seriesId: line.scene.episode.seriesId,
      episodeId: line.scene.episode.id,
      sceneId: line.sceneId,
      shotId: line.shotId,
      dialogueLineId: line.id,
      characterId: line.characterId,
      jobType: "VOICE",
      provider: "local-tts",
      model: config.model,
      status: "RUNNING",
      input: { text: line.text, voice: voiceIdFromProfile(line.character.voiceProfile), emotion: line.emotion, deliveryStyle: line.deliveryStyle },
      startedAt: new Date(),
    },
  });

  try {
    const result = await new LocalTtsClient(config).synthesize({ text: line.text, voice: voiceIdFromProfile(line.character.voiceProfile) });
    const directory = episodeMediaDirectory(line.scene.episode.series.slug, line.scene.episode.code, "voice");
    await mkdir(directory, { recursive: true });
    const extension = result.mimeType.includes("mpeg") ? ".mp3" : ".wav";
    const filename = `${safeMediaSegment(`line-${line.lineNumber}-${line.character.code}`)}${extension}`;
    const localPath = path.join(directory, filename);
    await writeFile(localPath, result.bytes);
    const checksum = createHash("sha256").update(result.bytes).digest("hex");

    const [asset] = await prisma.$transaction([
      prisma.mediaAsset.create({
        data: {
          seriesId: line.scene.episode.seriesId,
          episodeId: line.scene.episode.id,
          sceneId: line.sceneId,
          shotId: line.shotId,
          dialogueLineId: line.id,
          characterId: line.characterId,
          assetType: "VOICE_AUDIO",
          status: "READY",
          provider: "local-tts",
          model: result.model,
          localPath,
          mimeType: result.mimeType,
          checksum,
          metadata: { voice: result.voice, text: line.text, bytes: result.bytes.length },
        },
      }),
      prisma.generationJob.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date() } }),
    ]);
    return asset;
  } catch (error) {
    const normalized = normalizeProviderError(error);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorCode: normalized.code, errorMessage: normalized.message, completedAt: new Date() },
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
  jobType: string;
}, status: RunPodStatusResponse) {
  const remoteUrl = firstUrl(status.output);
  if (!remoteUrl || !job.providerJobId) return null;
  const assetType = job.jobType === "IMAGE" ? "IMAGE_KEYFRAME" : "VIDEO_CLIP";

  const existing = await prisma.mediaAsset.findFirst({ where: { providerJobId: job.providerJobId, assetType } });
  if (existing) return existing;

  let local: { localPath: string; mimeType: string | null; checksum: string; bytes: number } | null = null;
  if (job.episodeId) {
    const episode = await prisma.episode.findUnique({ where: { id: job.episodeId }, include: { series: true } });
    if (episode) {
      try {
        local = await downloadRemoteMedia({
          url: remoteUrl,
          seriesSlug: episode.series.slug,
          episodeCode: episode.code,
          category: job.jobType === "IMAGE" ? "images" : "video",
          fileStem: `${job.jobType.toLowerCase()}-${job.shotId || job.id}`,
        });
      } catch {
        local = null;
      }
    }
  }

  return prisma.mediaAsset.create({
    data: {
      seriesId: job.seriesId,
      episodeId: job.episodeId,
      sceneId: job.sceneId,
      shotId: job.shotId,
      dialogueLineId: job.dialogueLineId,
      characterId: job.characterId,
      roomId: job.roomId,
      assetType,
      status: "READY",
      provider: job.provider,
      providerJobId: job.providerJobId,
      model: job.model,
      remoteUrl,
      localPath: local?.localPath || null,
      mimeType: local?.mimeType || null,
      checksum: local?.checksum || null,
      metadata: {
        runPodJobId: status.id,
        delayTime: status.delayTime ?? null,
        executionTime: status.executionTime ?? null,
        downloadedBytes: local?.bytes ?? null,
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
    await prisma.generationJob.update({ where: { id: job.id }, data: { errorCode: normalized.code, errorMessage: normalized.message } });
    throw normalized;
  }
}
