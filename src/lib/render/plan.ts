export type RenderShotInput = {
  id: string;
  sceneId: string;
  durationSec: number;
  localVideoPath: string;
};

export type RenderDialogueInput = {
  id: string;
  sceneId: string;
  shotId: string | null;
  captionText: string;
  startOffsetMs: number | null;
  durationEstimateMs: number | null;
  localVoicePath: string | null;
};

export type RenderSceneInput = {
  id: string;
  durationSec: number;
  shots: RenderShotInput[];
  dialogue: RenderDialogueInput[];
};

export type CaptionCue = {
  text: string;
  startMs: number;
  endMs: number;
};

export type VoiceCue = {
  localPath: string;
  startMs: number;
};

export function buildRenderTimeline(scenes: RenderSceneInput[]) {
  const captions: CaptionCue[] = [];
  const voices: VoiceCue[] = [];
  const videoPaths: string[] = [];
  let episodeOffsetMs = 0;

  for (const scene of scenes) {
    let shotOffsetMs = 0;
    const shotOffsets = new Map<string, number>();
    for (const shot of scene.shots) {
      shotOffsets.set(shot.id, shotOffsetMs);
      videoPaths.push(shot.localVideoPath);
      shotOffsetMs += Math.max(1, shot.durationSec) * 1000;
    }

    for (const line of scene.dialogue) {
      const base = line.shotId ? shotOffsets.get(line.shotId) ?? 0 : 0;
      const startMs = episodeOffsetMs + base + Math.max(0, line.startOffsetMs ?? 0);
      const durationMs = Math.max(700, line.durationEstimateMs ?? Math.min(4500, Math.max(1200, line.captionText.length * 55)));
      captions.push({ text: line.captionText, startMs, endMs: startMs + durationMs });
      if (line.localVoicePath) voices.push({ localPath: line.localVoicePath, startMs });
    }

    const plannedSceneMs = Math.max(1, scene.durationSec) * 1000;
    episodeOffsetMs += Math.max(plannedSceneMs, shotOffsetMs);
  }

  return { videoPaths, captions, voices, durationMs: episodeOffsetMs };
}

function srtTime(ms: number) {
  const safe = Math.max(0, Math.round(ms));
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const millis = safe % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

export function captionsToSrt(captions: CaptionCue[]) {
  return captions
    .map((cue, index) => `${index + 1}\n${srtTime(cue.startMs)} --> ${srtTime(cue.endMs)}\n${cue.text.replace(/\r?\n/g, " ")}\n`)
    .join("\n");
}

export function ffconcatContent(paths: string[]) {
  const quote = (value: string) => value.replace(/\\/g, "/").replace(/'/g, "'\\''");
  return paths.map((value) => `file '${quote(value)}'`).join("\n") + "\n";
}
