import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/lib/api";
import { getComfyUiConfig } from "@/lib/comfyui/config";
import { ComfyUiProvider, getComfyUiStatusSnapshot } from "@/lib/comfyui/provider";
import { downloadRemoteMedia } from "@/lib/media/download";
import { getMediaGenerationProvider } from "@/lib/media-generation/config";
import { episodeMediaDirectory, safeMediaSegment } from "@/lib/media/storage";
import { prisma } from "@/lib/prisma";
import { normalizeProviderError } from "@/lib/providers/errors";
import { composeQwenKeyframePrompt, validateQwenKeyframeReferences } from "@/lib/random-rooms/keyframe-planning";
import {
  assertNoActiveGeneration,
  duplicateGenerationError,
  generationIdempotencyKey,
  isUniqueConstraintError,
  nextGenerationAttempt,
} from "@/lib/random-rooms/generation-safety";
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

  const [jobs, assets, runPod, comfyUi] = await Promise.all([
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
    getComfyUiStatusSnapshot(false),
  ]);

  return { series, mediaGenerationProvider: getMediaGenerationProvider(), runPod, comfyUi, jobs, assets };
}

async function shotWithPlanning(shotId: string) {
  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: {
      scene: {
        include: {
          episode: {
            include: {
              characterAssignments: { include: { character: true }, orderBy: { priority: "asc" } },
            },
          },
          room: true,
          dialogueLines: { select: { characterId: true, shotId: true } },
        },
      },
    },
  });
  if (!shot) throw new HttpError("Shot not found.", 404);
  return shot;
}

async function primaryReferenceAssetsForShot(shot: Awaited<ReturnType<typeof shotWithPlanning>>) {
  const shotDialogueCharacterIds = [
    ...new Set(
      shot.scene.dialogueLines
        .filter((line) => line.shotId === shot.id)
        .map((line) => line.characterId),
    ),
  ];
  const sceneDialogueCharacterIds = [...new Set(shot.scene.dialogueLines.map((line) => line.characterId))];
  const assignmentCharacterIds = shot.scene.episode.characterAssignments.map((assignment) => assignment.characterId);
  const characterIds = shotDialogueCharacterIds.length
    ? shotDialogueCharacterIds
    : sceneDialogueCharacterIds.length
      ? sceneDialogueCharacterIds
      : assignmentCharacterIds;

  const [characters, room] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: {
        characterId: { in: characterIds },
        assetType: "CHARACTER_REFERENCE",
        isPrimary: true,
        status: { in: ["READY", "APPROVED"] },
        localPath: { not: null },
      },
      orderBy: [{ characterId: "asc" }, { createdAt: "desc" }],
    }),
    shot.scene.roomId
      ? prisma.mediaAsset.findFirst({
          where: {
            roomId: shot.scene.roomId,
            assetType: "ROOM_REFERENCE",
            isPrimary: true,
            status: { in: ["READY", "APPROVED"] },
            localPath: { not: null },
          },
          orderBy: { createdAt: "desc" },
        })
      : null,
  ]);

  const byCharacterId = new Map(characters.map((asset) => [asset.characterId, asset]));
  const orderedCharacters = characterIds
    .map((characterId) => byCharacterId.get(characterId) || null)
    .filter((asset): asset is NonNullable<typeof asset> => !!asset);

  return { characters: orderedCharacters, room };
}

export async function submitShotImageJob(shotId: string, options: { regenerate?: boolean } = {}) {
  const shot = await shotWithPlanning(shotId);
  if (!shot.imagePrompt.trim()) throw new HttpError("Add an image prompt before generating a keyframe.", 422);

  const episode = shot.scene.episode;
  if (!options.regenerate) {
    const existingAsset = await prisma.mediaAsset.findFirst({
      where: { shotId: shot.id, assetType: "IMAGE_KEYFRAME", status: { in: ["READY", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
    });
    if (existingAsset) throw new HttpError("This shot already has a usable keyframe. Use regenerate explicitly to create another one.", 409);
  }

  await assertNoActiveGeneration({ jobType: "IMAGE", shotId: shot.id });
  const attempt = options.regenerate ? await nextGenerationAttempt({ jobType: "IMAGE", shotId: shot.id }) : 1;
  const providerName = getMediaGenerationProvider();

  const references = await primaryReferenceAssetsForShot(shot);
  const keyframePrompt = composeQwenKeyframePrompt({
    shotPrompt: shot.imagePrompt,
    visualDescription: shot.visualDescription,
    cameraFraming: shot.cameraFraming,
    continuityNotes: shot.continuityNotes,
  });

  if (providerName === "comfyui") {
    const missingReferences = validateQwenKeyframeReferences({
      roomReferencePath: references.room?.localPath,
      characterReferencePath: references.characters[0]?.localPath,
    });
    if (missingReferences.length) {
      throw new HttpError(
        `Qwen keyframe generation requires ${missingReferences.join(" and ")} before GPU submission.`,
        422,
      );
    }
  }

  const input = {
    task: "reference_image_edit",
    prompt: keyframePrompt,
    visual_description: shot.visualDescription,
    aspect_ratio: episode.targetAspectRatio,
    camera_framing: shot.cameraFraming,
    continuity_notes: shot.continuityNotes,
    reference_assets: {
      character_asset_ids: references.characters.map((asset) => asset.id),
      room_asset_id: references.room?.id || null,
    },
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

  const provider = providerName === "comfyui" ? "comfyui" : "runpod";
  const model = providerName === "comfyui" ? null : getRunPodConfig().imageModel;

  let job;
  try {
    job = await prisma.generationJob.create({
      data: {
        seriesId: episode.seriesId,
        episodeId: episode.id,
        sceneId: shot.sceneId,
        shotId: shot.id,
        roomId: shot.scene.roomId,
        jobType: "IMAGE",
        provider,
        model,
        status: "SUBMITTING",
        idempotencyKey: generationIdempotencyKey({ jobType: "IMAGE", targetId: shot.id, payload: input, attempt }),
        attempt,
        maxAttempts: 2,
        input,
        startedAt: new Date(),
        leaseUntil: new Date(Date.now() + 2 * 60_000),
        nextPollAt: new Date(Date.now() + 5_000),
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw duplicateGenerationError("IMAGE");
    throw error;
  }

  try {
    if (providerName === "comfyui") {
      const comfyConfig = getComfyUiConfig();
      const referenceUploads: Array<{ bytes: Uint8Array; filename: string; variablePrefix: string }> = [];
      const primaryCharacter = references.characters[0];
      if (primaryCharacter?.localPath) {
        referenceUploads.push({
          bytes: await readFile(primaryCharacter.localPath),
          filename: path.basename(primaryCharacter.localPath),
          variablePrefix: "CHARACTER_REFERENCE_1",
        });
      }
      if (references.room?.localPath) {
        referenceUploads.push({
          bytes: await readFile(references.room.localPath),
          filename: path.basename(references.room.localPath),
          variablePrefix: "ROOM_REFERENCE",
        });
      }
      const submitted = await new ComfyUiProvider().submitImage({
        PROMPT: keyframePrompt,
        NEGATIVE_PROMPT: comfyConfig.defaultNegativePrompt,
        VISUAL_DESCRIPTION: shot.visualDescription,
        ASPECT_RATIO: episode.targetAspectRatio,
        CAMERA_FRAMING: shot.cameraFraming,
        CONTINUITY_NOTES: shot.continuityNotes || "",
        SEED: attempt,
        CHARACTER_REFERENCE_COUNT: references.characters[0] ? 1 : 0,
        HAS_ROOM_REFERENCE: !!references.room,
      }, referenceUploads);
      return prisma.generationJob.update({
        where: { id: job.id },
        data: {
          providerJobId: submitted.prompt_id,
          status: "QUEUED",
          leaseUntil: null,
          nextPollAt: new Date(Date.now() + 5_000),
        },
      });
    }

    const config = getRunPodConfig();
    assertRunPodConfigured(config, config.imageEndpointId);
    const submitted = await new RunPodClient(config).submit({ endpointId: config.imageEndpointId!, input });
    return prisma.generationJob.update({
      where: { id: job.id },
      data: {
        providerJobId: submitted.id,
        status: internalStatus(submitted.status || "IN_QUEUE"),
        leaseUntil: null,
        nextPollAt: new Date(Date.now() + 5_000),
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
        leaseUntil: null,
        nextPollAt: null,
      },
    });
    throw normalized;
  }
}

export async function submitShotVideoJob(shotId: string, options: { regenerate?: boolean } = {}) {
  const shot = await shotWithPlanning(shotId);
  if (!shot.videoPrompt.trim()) throw new HttpError("Add a video prompt before generating this shot.", 422);

  const episode = shot.scene.episode;
  const keyframe = await prisma.mediaAsset.findFirst({
    where: { shotId: shot.id, assetType: "IMAGE_KEYFRAME", status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
  if (!keyframe) throw new HttpError("Approve a keyframe before creating a video clip.", 422);

  if (!options.regenerate) {
    const existingAsset = await prisma.mediaAsset.findFirst({
      where: { shotId: shot.id, assetType: "VIDEO_CLIP", status: { in: ["READY", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
    });
    if (existingAsset) throw new HttpError("This shot already has a usable video clip. Use regenerate explicitly to create another one.", 409);
  }

  await assertNoActiveGeneration({ jobType: "VIDEO", shotId: shot.id });
  const attempt = options.regenerate ? await nextGenerationAttempt({ jobType: "VIDEO", shotId: shot.id }) : 1;
  const providerName = getMediaGenerationProvider();

  const input = {
    task: "image_to_video",
    prompt: shot.videoPrompt,
    keyframe_asset_id: keyframe.id,
    image_url: keyframe.remoteUrl || null,
    local_image_path: keyframe.localPath || null,
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

  const provider = providerName === "comfyui" ? "comfyui" : "runpod";
  const model = providerName === "comfyui" ? null : getRunPodConfig().videoModel;

  let job;
  try {
    job = await prisma.generationJob.create({
      data: {
        seriesId: episode.seriesId,
        episodeId: episode.id,
        sceneId: shot.sceneId,
        shotId: shot.id,
        roomId: shot.scene.roomId,
        jobType: "VIDEO",
        provider,
        model,
        status: "SUBMITTING",
        idempotencyKey: generationIdempotencyKey({ jobType: "VIDEO", targetId: shot.id, payload: input, attempt }),
        attempt,
        maxAttempts: 2,
        input,
        startedAt: new Date(),
        leaseUntil: new Date(Date.now() + 2 * 60_000),
        nextPollAt: new Date(Date.now() + 5_000),
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw duplicateGenerationError("VIDEO");
    throw error;
  }

  try {
    if (providerName === "comfyui") {
      if (!keyframe.localPath) {
        throw new HttpError(
          "The approved keyframe must be available locally before it can be uploaded to the remote ComfyUI Pod.",
          422,
        );
      }
      const bytes = await readFile(keyframe.localPath);
      const submitted = await new ComfyUiProvider().submitVideo({
        imageBytes: bytes,
        imageFilename: path.basename(keyframe.localPath),
        variables: {
          PROMPT: shot.videoPrompt,
          VIDEO_PROMPT: shot.videoPrompt,
          ACTION_DESCRIPTION: shot.actionDescription,
          DURATION_SEC: shot.durationSec,
          ASPECT_RATIO: episode.targetAspectRatio,
          CAMERA_FRAMING: shot.cameraFraming,
          CAMERA_MOVEMENT: shot.cameraMovement,
          CONTINUITY_NOTES: shot.continuityNotes || "",
          SEED: attempt,
        },
      });
      return prisma.generationJob.update({
        where: { id: job.id },
        data: {
          providerJobId: submitted.prompt_id,
          status: "QUEUED",
          leaseUntil: null,
          nextPollAt: new Date(Date.now() + 5_000),
        },
      });
    }

    const config = getRunPodConfig();
    assertRunPodConfigured(config, config.videoEndpointId);
    const submitted = await new RunPodClient(config).submit({ endpointId: config.videoEndpointId!, input });
    return prisma.generationJob.update({
      where: { id: job.id },
      data: {
        providerJobId: submitted.id,
        status: internalStatus(submitted.status || "IN_QUEUE"),
        leaseUntil: null,
        nextPollAt: new Date(Date.now() + 5_000),
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
        leaseUntil: null,
        nextPollAt: null,
      },
    });
    throw normalized;
  }
}

export async function synthesizeDialogueVoice(dialogueLineId: string, options: { regenerate?: boolean } = {}) {
  const line = await prisma.dialogueLine.findUnique({
    where: { id: dialogueLineId },
    include: { character: true, scene: { include: { episode: { include: { series: true } } } } },
  });
  if (!line) throw new HttpError("Dialogue line not found.", 404);

  const config = getLocalTtsConfig();
  if (!options.regenerate) {
    const existingAsset = await prisma.mediaAsset.findFirst({
      where: { dialogueLineId: line.id, assetType: "VOICE_AUDIO", status: { in: ["READY", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
    });
    if (existingAsset) throw new HttpError("This dialogue already has usable voice audio. Use regenerate explicitly to create another one.", 409);
  }
  await assertNoActiveGeneration({ jobType: "VOICE", dialogueLineId: line.id });
  const voiceInput = { text: line.text, voice: voiceIdFromProfile(line.character.voiceProfile), emotion: line.emotion, deliveryStyle: line.deliveryStyle };
  const attempt = options.regenerate ? await nextGenerationAttempt({ jobType: "VOICE", dialogueLineId: line.id }) : 1;
  let job;
  try {
    job = await prisma.generationJob.create({
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
      idempotencyKey: generationIdempotencyKey({ jobType: "VOICE", targetId: line.id, payload: voiceInput, attempt }),
      attempt,
      maxAttempts: 2,
      input: voiceInput,
      startedAt: new Date(),
      leaseUntil: new Date(Date.now() + 2 * 60_000),
    },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw duplicateGenerationError("VOICE");
    throw error;
  }

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
      prisma.generationJob.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date(), leaseUntil: null, nextPollAt: null } }),
    ]);
    return asset;
  } catch (error) {
    const normalized = normalizeProviderError(error);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorCode: normalized.code, errorMessage: normalized.message, completedAt: new Date(), leaseUntil: null, nextPollAt: null },
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
  attempt: number;
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

  try {
    const created = await prisma.mediaAsset.create({
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
          attempt: job.attempt,
        },
      },
    });
    if (job.attempt > 1 && job.shotId) {
      await prisma.mediaAsset.updateMany({
        where: {
          shotId: job.shotId,
          assetType,
          status: { in: ["READY", "APPROVED"] },
          id: { not: created.id },
        },
        data: { status: "SUPERSEDED" },
      });
    }
    return created;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return prisma.mediaAsset.findFirst({ where: { providerJobId: job.providerJobId, assetType } });
    }
    throw error;
  }
}

async function ensureCompletedComfyAsset(
  job: {
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
    attempt: number;
  },
  provider: ComfyUiProvider,
  output: { filename: string; subfolder: string; type: string },
) {
  if (!job.providerJobId || !job.episodeId) return null;
  const assetType = job.jobType === "IMAGE" ? "IMAGE_KEYFRAME" : "VIDEO_CLIP";
  const existing = await prisma.mediaAsset.findFirst({ where: { providerJobId: job.providerJobId, assetType } });
  if (existing) return existing;

  const episode = await prisma.episode.findUnique({
    where: { id: job.episodeId },
    include: { series: true },
  });
  if (!episode) throw new HttpError("Episode not found while storing ComfyUI output.", 404);

  const downloaded = await provider.download(output);
  const fallbackExtension = job.jobType === "IMAGE" ? ".png" : ".mp4";
  const extension = path.extname(output.filename) || fallbackExtension;
  const directory = episodeMediaDirectory(
    episode.series.slug,
    episode.code,
    job.jobType === "IMAGE" ? "images" : "video",
  );
  await mkdir(directory, { recursive: true });
  const localPath = path.join(
    directory,
    `${safeMediaSegment(`${job.jobType.toLowerCase()}-${job.shotId || job.id}-${job.providerJobId}`)}${extension}`,
  );
  await writeFile(localPath, downloaded.bytes);
  const checksum = createHash("sha256").update(downloaded.bytes).digest("hex");

  try {
    const created = await prisma.mediaAsset.create({
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
        provider: "comfyui",
        providerJobId: job.providerJobId,
        model: job.model,
        localPath,
        mimeType: downloaded.mimeType,
        checksum,
        metadata: {
          comfyPromptId: job.providerJobId,
          output,
          downloadedBytes: downloaded.bytes.length,
          attempt: job.attempt,
        },
      },
    });

    if (job.attempt > 1 && job.shotId) {
      await prisma.mediaAsset.updateMany({
        where: {
          shotId: job.shotId,
          assetType,
          status: { in: ["READY", "APPROVED"] },
          id: { not: created.id },
        },
        data: { status: "SUPERSEDED" },
      });
    }
    return created;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return prisma.mediaAsset.findFirst({ where: { providerJobId: job.providerJobId, assetType } });
    }
    throw error;
  }
}

export async function syncGenerationJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Generation job not found.", 404);
  if (!job.providerJobId) throw new HttpError("Provider job ID is missing.", 422);

  if (job.provider === "comfyui") {
    if (job.jobType !== "IMAGE" && job.jobType !== "VIDEO") {
      throw new HttpError("ComfyUI sync supports IMAGE and VIDEO jobs only.", 422);
    }

    try {
      const provider = new ComfyUiProvider();
      const state = await provider.poll(job.providerJobId, job.jobType);
      const terminal = state.status === "COMPLETED" || state.status === "FAILED";
      const updated = await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: state.status,
          output: state.raw as object,
          errorMessage: state.error,
          completedAt: terminal ? new Date() : null,
          leaseUntil: null,
          nextPollAt: terminal ? null : new Date(Date.now() + 5_000),
        },
      });
      const asset =
        state.status === "COMPLETED" && state.output
          ? await ensureCompletedComfyAsset(updated, provider, state.output)
          : null;
      return { job: updated, asset, providerStatus: state };
    } catch (error) {
      const normalized = normalizeProviderError(error);
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { errorCode: normalized.code, errorMessage: normalized.message, leaseUntil: null },
      });
      throw normalized;
    }
  }

  if (job.provider !== "runpod") {
    throw new HttpError(`Provider ${job.provider} does not support asynchronous sync.`, 422);
  }

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
        leaseUntil: null,
        nextPollAt: terminal ? null : new Date(Date.now() + 5_000),
      },
    });
    const asset = mapped === "COMPLETED" ? await ensureCompletedAsset(updated, status) : null;
    return { job: updated, asset, providerStatus: status };
  } catch (error) {
    const normalized = normalizeProviderError(error);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { errorCode: normalized.code, errorMessage: normalized.message, leaseUntil: null },
    });
    throw normalized;
  }
}
