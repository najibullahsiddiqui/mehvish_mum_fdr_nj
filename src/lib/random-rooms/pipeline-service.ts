import { HttpError } from "@/lib/api";
import { getComfyUiConfig } from "@/lib/comfyui/config";
import { getMediaGenerationProvider } from "@/lib/media-generation/config";
import { prisma } from "@/lib/prisma";
import { getRenderConfig } from "@/lib/render/config";
import { renderEpisode } from "@/lib/render/service";
import { getRunPodConfig } from "@/lib/runpod/config";
import { getLocalTtsConfig } from "@/lib/tts/config";
import { summarizePipelineState } from "@/lib/random-rooms/pipeline";
import { latestTerminalFailure } from "@/lib/random-rooms/generation-safety";
import {
  submitShotImageJob,
  submitShotVideoJob,
  syncGenerationJob,
  synthesizeDialogueVoice,
} from "@/lib/random-rooms/production-service";

const ACTIVE_STATUSES = ["SUBMITTING", "QUEUED", "RUNNING", "IN_QUEUE", "IN_PROGRESS"];
const READY_ASSET_STATUSES = ["READY", "APPROVED"];

async function loadEpisode(episodeId: string) {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: {
      series: true,
      mediaAssets: { orderBy: { createdAt: "desc" } },
      generationJobs: { orderBy: { createdAt: "desc" } },
      scenes: {
        orderBy: { sceneNumber: "asc" },
        include: {
          shots: {
            orderBy: { shotNumber: "asc" },
            include: { mediaAssets: { orderBy: { createdAt: "desc" } }, generationJobs: { orderBy: { createdAt: "desc" } } },
          },
          dialogueLines: {
            orderBy: { lineNumber: "asc" },
            include: { character: true, mediaAssets: { orderBy: { createdAt: "desc" } }, generationJobs: { orderBy: { createdAt: "desc" } } },
          },
        },
      },
    },
  });
  if (!episode) throw new HttpError("Episode not found.", 404);
  return episode;
}

function isReadyAsset(asset: { status: string }) {
  return READY_ASSET_STATUSES.includes(asset.status);
}

function isActiveJob(job: { status: string }) {
  return ACTIVE_STATUSES.includes(job.status);
}

export async function getEpisodePipelineState(episodeId: string) {
  const episode = await loadEpisode(episodeId);
  const dialogueLines = episode.scenes.flatMap((scene) => scene.dialogueLines);
  const shots = episode.scenes.flatMap((scene) => scene.shots);
  const jobs = episode.generationJobs;
  const finalAssets = episode.mediaAssets.filter((asset) => asset.assetType === "FINAL_VIDEO" && isReadyAsset(asset));

  const summary = summarizePipelineState({
    dialogueLines: dialogueLines.map((line) => ({
      id: line.id,
      hasVoice: line.mediaAssets.some((asset) => asset.assetType === "VOICE_AUDIO" && isReadyAsset(asset) && !!asset.localPath),
    })),
    shots: shots.map((shot) => ({
      id: shot.id,
      hasImage: shot.mediaAssets.some((asset) => asset.assetType === "IMAGE_KEYFRAME" && asset.status === "APPROVED"),
      hasVideo: shot.mediaAssets.some((asset) => asset.assetType === "VIDEO_CLIP" && isReadyAsset(asset) && !!asset.localPath),
    })),
    hasFinalVideo: finalAssets.length > 0,
    jobs: jobs.map((job) => ({ jobType: job.jobType, status: job.status })),
  });

  const mediaProvider = getMediaGenerationProvider();
  const runPod = getRunPodConfig();
  const comfyUi = getComfyUiConfig();
  const tts = getLocalTtsConfig();
  const render = getRenderConfig();
  const imageCapability =
    mediaProvider === "comfyui"
      ? { enabled: comfyUi.enabled, configured: !!comfyUi.imageWorkflowPath, provider: mediaProvider }
      : { enabled: runPod.enabled, configured: !!runPod.apiKey && !!runPod.imageEndpointId, provider: mediaProvider };
  const videoCapability =
    mediaProvider === "comfyui"
      ? { enabled: comfyUi.enabled, configured: !!comfyUi.videoWorkflowPath, provider: mediaProvider }
      : { enabled: runPod.enabled, configured: !!runPod.apiKey && !!runPod.videoEndpointId, provider: mediaProvider };

  return {
    episode: { id: episode.id, code: episode.code, title: episode.title, status: episode.status },
    summary,
    capabilities: {
      voice: { enabled: tts.enabled },
      image: imageCapability,
      video: videoCapability,
      render: { enabled: render.enabled },
    },
    finalAsset: finalAssets[0] || null,
    jobs: jobs.slice(0, 40),
    shots: shots.map((shot) => ({
      id: shot.id,
      sceneId: shot.sceneId,
      shotNumber: shot.shotNumber,
      imageReady: shot.mediaAssets.some((asset) => asset.assetType === "IMAGE_KEYFRAME" && isReadyAsset(asset)),
      imageApproved: shot.mediaAssets.some((asset) => asset.assetType === "IMAGE_KEYFRAME" && asset.status === "APPROVED"),
      keyframe: shot.mediaAssets.find((asset) => asset.assetType === "IMAGE_KEYFRAME" && isReadyAsset(asset)) || null,
      videoReady: shot.mediaAssets.some((asset) => asset.assetType === "VIDEO_CLIP" && isReadyAsset(asset) && !!asset.localPath),
    })),
    dialogue: dialogueLines.map((line) => ({
      id: line.id,
      character: line.character.name,
      text: line.text,
      voiceReady: line.mediaAssets.some((asset) => asset.assetType === "VOICE_AUDIO" && isReadyAsset(asset) && !!asset.localPath),
    })),
  };
}

export async function advanceEpisodePipeline(episodeId: string) {
  let episode = await loadEpisode(episodeId);
  const actions: string[] = [];
  const blocked: string[] = [];

  const activeExternalJobs = episode.generationJobs.filter(
    (job) => ["runpod", "comfyui"].includes(job.provider) && isActiveJob(job) && !!job.providerJobId,
  );
  for (const job of activeExternalJobs) {
    try {
      await syncGenerationJob(job.id);
      actions.push(`Synced ${job.jobType.toLowerCase()} job ${job.id}.`);
    } catch (error) {
      blocked.push(error instanceof Error ? error.message : `Could not sync ${job.jobType} job.`);
    }
  }

  episode = await loadEpisode(episodeId);
  const ttsConfig = getLocalTtsConfig();
  for (const line of episode.scenes.flatMap((scene) => scene.dialogueLines)) {
    const hasVoice = line.mediaAssets.some((asset) => asset.assetType === "VOICE_AUDIO" && isReadyAsset(asset) && !!asset.localPath);
    const active = line.generationJobs.some((job) => job.jobType === "VOICE" && isActiveJob(job));
    if (!hasVoice && !active) {
      const failed = await latestTerminalFailure({ jobType: "VOICE", dialogueLineId: line.id });
      if (failed) {
        blocked.push(`Dialogue ${line.id} has a failed voice attempt. Use Regenerate to retry intentionally.`);
        continue;
      }
      if (!ttsConfig.enabled) {
        blocked.push("Local TTS is disabled; enable it to generate missing dialogue audio.");
        break;
      }
      try {
        await synthesizeDialogueVoice(line.id);
        actions.push(`Generated voice for dialogue ${line.id}.`);
      } catch (error) {
        blocked.push(error instanceof Error ? error.message : "Voice generation failed.");
        break;
      }
    }
  }

  episode = await loadEpisode(episodeId);
  const mediaProvider = getMediaGenerationProvider();
  const runPod = getRunPodConfig();
  const comfyUi = getComfyUiConfig();
  const imageReady =
    mediaProvider === "comfyui"
      ? comfyUi.enabled && !!comfyUi.imageWorkflowPath
      : runPod.enabled && !!runPod.apiKey && !!runPod.imageEndpointId;
  const videoReady =
    mediaProvider === "comfyui"
      ? comfyUi.enabled && !!comfyUi.videoWorkflowPath
      : runPod.enabled && !!runPod.apiKey && !!runPod.videoEndpointId;

  for (const shot of episode.scenes.flatMap((scene) => scene.shots)) {
    const hasImage = shot.mediaAssets.some((asset) => asset.assetType === "IMAGE_KEYFRAME" && isReadyAsset(asset));
    const hasApprovedImage = shot.mediaAssets.some((asset) => asset.assetType === "IMAGE_KEYFRAME" && asset.status === "APPROVED");
    const readyVideoAssets = shot.mediaAssets.filter((asset) => asset.assetType === "VIDEO_CLIP" && isReadyAsset(asset));
    const hasVideo = readyVideoAssets.some((asset) => !!asset.localPath);
    const hasRemoteOnlyVideo = !hasVideo && readyVideoAssets.length > 0;
    const activeImage = shot.generationJobs.some((job) => job.jobType === "IMAGE" && isActiveJob(job));
    const activeVideo = shot.generationJobs.some((job) => job.jobType === "VIDEO" && isActiveJob(job));

    if (!hasImage && !activeImage) {
      const failedImage = await latestTerminalFailure({ jobType: "IMAGE", shotId: shot.id });
      if (failedImage) {
        blocked.push(`Shot ${shot.id} has a failed image attempt. Use Regenerate to retry intentionally.`);
        continue;
      }
      if (!imageReady) {
        blocked.push(`${mediaProvider} image generation is disabled or not configured.`);
        break;
      }
      try {
        await submitShotImageJob(shot.id);
        actions.push(`Queued image for shot ${shot.id}.`);
      } catch (error) {
        blocked.push(error instanceof Error ? error.message : "Image generation failed.");
      }
      continue;
    }

    if (hasRemoteOnlyVideo) {
      blocked.push(`Shot ${shot.id} has a completed remote video but no local file. Resolve the media download before generating another paid clip.`);
      continue;
    }

    if (hasImage && !hasApprovedImage && !hasVideo) {
      blocked.push(`Shot ${shot.id} keyframe is awaiting approval before video generation.`);
      continue;
    }

    if (hasApprovedImage && !hasVideo && !activeVideo) {
      const failedVideo = await latestTerminalFailure({ jobType: "VIDEO", shotId: shot.id });
      if (failedVideo) {
        blocked.push(`Shot ${shot.id} has a failed video attempt. Use Regenerate to retry intentionally.`);
        continue;
      }
      if (!videoReady) {
        blocked.push(`${mediaProvider} video generation is disabled or not configured.`);
        break;
      }
      try {
        await submitShotVideoJob(shot.id);
        actions.push(`Queued video for shot ${shot.id}.`);
      } catch (error) {
        blocked.push(error instanceof Error ? error.message : "Video generation failed.");
      }
    }
  }

  const stateBeforeRender = await getEpisodePipelineState(episodeId);
  if (stateBeforeRender.summary.render.ready && !stateBeforeRender.summary.render.complete) {
    const renderConfig = getRenderConfig();
    if (!renderConfig.enabled) {
      blocked.push("Final rendering is ready but RENDER_ENABLED is false.");
    } else {
      try {
        await renderEpisode(episodeId);
        await prisma.episode.update({ where: { id: episodeId }, data: { status: "REVIEW" } });
        actions.push("Rendered final episode video and moved episode to REVIEW.");
      } catch (error) {
        blocked.push(error instanceof Error ? error.message : "Final render failed.");
      }
    }
  }

  return { actions, blocked, state: await getEpisodePipelineState(episodeId) };
}

export async function reviewKeyframe(assetId: string, decision: "approve" | "reject") {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset || asset.assetType !== "IMAGE_KEYFRAME" || !asset.shotId) {
    throw new HttpError("Keyframe asset not found.", 404);
  }

  const activeVideo = await prisma.generationJob.findFirst({
    where: {
      shotId: asset.shotId,
      jobType: "VIDEO",
      status: { in: ACTIVE_STATUSES },
    },
  });
  if (activeVideo) {
    throw new HttpError("A video generation is already active for this shot. Wait for it to finish before changing keyframe approval.", 409);
  }

  if (decision === "approve") {
    await prisma.$transaction([
      prisma.mediaAsset.updateMany({
        where: {
          shotId: asset.shotId,
          assetType: "IMAGE_KEYFRAME",
          status: "APPROVED",
          id: { not: asset.id },
        },
        data: { status: "SUPERSEDED" },
      }),
      prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { status: "APPROVED" },
      }),
    ]);
  } else {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { status: "REJECTED" },
    });
  }

  return prisma.mediaAsset.findUnique({ where: { id: asset.id } });
}

export async function reviewFinalVideo(assetId: string, decision: "approve" | "reject") {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset || asset.assetType !== "FINAL_VIDEO" || !asset.episodeId) throw new HttpError("Final video asset not found.", 404);
  const status = decision === "approve" ? "APPROVED" : "REJECTED";
  const episodeStatus = decision === "approve" ? "APPROVED" : "REVIEW";
  const [updated] = await prisma.$transaction([
    prisma.mediaAsset.update({ where: { id: asset.id }, data: { status } }),
    prisma.episode.update({ where: { id: asset.episodeId }, data: { status: episodeStatus } }),
  ]);
  return updated;
}

export async function regenerateProductionTarget(input: { stage: "voice" | "image" | "video" | "render"; targetId: string }) {
  if (input.stage === "voice") {
    const result = await synthesizeDialogueVoice(input.targetId, { regenerate: true });
    await prisma.mediaAsset.updateMany({
      where: { dialogueLineId: input.targetId, assetType: "VOICE_AUDIO", status: { in: READY_ASSET_STATUSES }, id: { not: result.id } },
      data: { status: "SUPERSEDED" },
    });
    return result;
  }
  if (input.stage === "image") {
    return submitShotImageJob(input.targetId, { regenerate: true });
  }
  if (input.stage === "video") {
    return submitShotVideoJob(input.targetId, { regenerate: true });
  }

  const episode = await prisma.episode.findUnique({ where: { id: input.targetId } });
  if (!episode) throw new HttpError("Episode not found.", 404);
  const result = await renderEpisode(episode.id, { regenerate: true });
  await prisma.mediaAsset.updateMany({
    where: { episodeId: episode.id, assetType: "FINAL_VIDEO", status: { in: READY_ASSET_STATUSES }, id: { not: result.asset.id } },
    data: { status: "SUPERSEDED" },
  });
  return result;
}
