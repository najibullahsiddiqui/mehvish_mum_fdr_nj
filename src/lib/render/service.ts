import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { HttpError } from "@/lib/api";
import { episodeMediaDirectory, getMediaRoot, safeMediaSegment } from "@/lib/media/storage";
import { prisma } from "@/lib/prisma";
import { assertRenderConfigured, getRenderConfig } from "@/lib/render/config";
import { buildRenderTimeline, captionsToSrt, ffconcatContent } from "@/lib/render/plan";

const execFileAsync = promisify(execFile);

function subtitleFilterPath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

export async function getRenderStatus() {
  const config = getRenderConfig();
  let available = false;
  let version: string | null = null;
  try {
    const result = await execFileAsync(config.ffmpegPath, ["-version"], { timeout: 5000, windowsHide: true });
    version = result.stdout.split(/\r?\n/)[0] || null;
    available = true;
  } catch {
    available = false;
  }
  return { ...config, available, version };
}

async function ensureFile(filePath: string, label: string) {
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    throw new HttpError(`${label} is not available locally: ${filePath}`, 422);
  }
}

export async function renderEpisode(episodeId: string) {
  const config = getRenderConfig();
  assertRenderConfigured(config);

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: {
      series: true,
      scenes: {
        orderBy: { sceneNumber: "asc" },
        include: {
          shots: { orderBy: { shotNumber: "asc" }, include: { mediaAssets: { where: { assetType: "VIDEO_CLIP", status: "READY" }, orderBy: { createdAt: "desc" } } } },
          dialogueLines: { orderBy: { lineNumber: "asc" }, include: { mediaAssets: { where: { assetType: "VOICE", status: "READY" }, orderBy: { createdAt: "desc" } } } },
        },
      },
    },
  });
  if (!episode) throw new HttpError("Episode not found.", 404);
  if (!episode.scenes.length) throw new HttpError("Episode has no scenes to render.", 422);

  const missingShots: string[] = [];
  const scenes = episode.scenes.map((scene) => ({
    id: scene.id,
    durationSec: scene.durationSec,
    shots: scene.shots.map((shot) => {
      const localVideoPath = shot.mediaAssets.find((asset) => !!asset.localPath)?.localPath || "";
      if (!localVideoPath) missingShots.push(`Scene ${scene.sceneNumber} / Shot ${shot.shotNumber}`);
      return { id: shot.id, sceneId: scene.id, durationSec: shot.durationSec, localVideoPath };
    }),
    dialogue: scene.dialogueLines.map((line) => ({
      id: line.id,
      sceneId: scene.id,
      shotId: line.shotId,
      captionText: line.captionText || line.text,
      startOffsetMs: line.startOffsetMs,
      durationEstimateMs: line.durationEstimateMs,
      localVoicePath: line.mediaAssets.find((asset) => !!asset.localPath)?.localPath || null,
    })),
  }));

  if (missingShots.length) {
    throw new HttpError(`Generate and sync local video assets first: ${missingShots.join(", ")}.`, 422);
  }

  const timeline = buildRenderTimeline(scenes);
  for (const videoPath of timeline.videoPaths) await ensureFile(videoPath, "Video clip");
  for (const voice of timeline.voices) await ensureFile(voice.localPath, "Voice asset");

  const renderDir = episodeMediaDirectory(episode.series.slug, episode.code, "renders");
  await mkdir(renderDir, { recursive: true });
  const concatPath = path.join(renderDir, "shots.ffconcat");
  const subtitlesPath = path.join(renderDir, "captions.srt");
  const outputPath = path.join(renderDir, `${safeMediaSegment(episode.code)}-final.mp4`);
  await writeFile(concatPath, ffconcatContent(timeline.videoPaths), "utf8");
  await writeFile(subtitlesPath, captionsToSrt(timeline.captions), "utf8");

  const args = ["-y", "-f", "concat", "-safe", "0", "-i", concatPath];
  for (const voice of timeline.voices) args.push("-i", voice.localPath);

  const videoFilters = `scale=${config.width}:${config.height}:force_original_aspect_ratio=increase,crop=${config.width}:${config.height},fps=${config.fps},subtitles='${subtitleFilterPath(subtitlesPath)}':force_style='Alignment=2,FontSize=18,Outline=2,Shadow=1,MarginV=110'`;
  if (timeline.voices.length) {
    const audioParts = timeline.voices.map((voice, index) => `[${index + 1}:a]adelay=${Math.round(voice.startMs)}|${Math.round(voice.startMs)}[a${index}]`);
    const mixInputs = timeline.voices.map((_, index) => `[a${index}]`).join("");
    args.push("-filter_complex", `${audioParts.join(";")};[0:v]${videoFilters}[vout];${mixInputs}amix=inputs=${timeline.voices.length}:normalize=0:dropout_transition=0[aout]`, "-map", "[vout]", "-map", "[aout]");
  } else {
    args.push("-filter_complex", `[0:v]${videoFilters}[vout]`, "-map", "[vout]", "-an");
  }
  args.push("-c:v", "libx264", "-preset", config.preset, "-crf", String(config.videoCrf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-shortest", outputPath);

  const job = await prisma.generationJob.create({
    data: {
      seriesId: episode.seriesId,
      episodeId: episode.id,
      jobType: "RENDER",
      provider: "local-ffmpeg",
      model: "ffmpeg",
      status: "RUNNING",
      input: { clips: timeline.videoPaths.length, voices: timeline.voices.length, captions: timeline.captions.length, width: config.width, height: config.height, fps: config.fps },
      startedAt: new Date(),
    },
  });

  try {
    await execFileAsync(config.ffmpegPath, args, { timeout: 20 * 60_000, maxBuffer: 10 * 1024 * 1024, windowsHide: true });
    const bytes = await readFile(outputPath);
    const checksum = createHash("sha256").update(bytes).digest("hex");
    const asset = await prisma.mediaAsset.create({
      data: {
        seriesId: episode.seriesId,
        episodeId: episode.id,
        assetType: "FINAL_VIDEO",
        status: "READY",
        provider: "local-ffmpeg",
        model: "ffmpeg",
        localPath: outputPath,
        mimeType: "video/mp4",
        durationSec: timeline.durationMs / 1000,
        width: config.width,
        height: config.height,
        checksum,
        metadata: { captions: timeline.captions.length, voices: timeline.voices.length, clips: timeline.videoPaths.length },
      },
    });
    await prisma.generationJob.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date(), output: { assetId: asset.id, localPath: outputPath } } });
    return { jobId: job.id, asset, outputPath };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "FFmpeg render failed.";
    await prisma.generationJob.update({ where: { id: job.id }, data: { status: "FAILED", errorCode: "RENDER_FAILED", errorMessage: message, completedAt: new Date() } });
    throw new HttpError(`Final render failed: ${message}`, 500);
  }
}

export async function resolveLocalMediaAsset(assetId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset?.localPath || asset.status !== "READY") throw new HttpError("Media asset is not available locally.", 404);
  const root = getMediaRoot();
  const resolved = path.resolve(asset.localPath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new HttpError("Media asset path is outside MEDIA_ROOT.", 403);
  await ensureFile(resolved, "Media asset");
  return { asset, path: resolved };
}
