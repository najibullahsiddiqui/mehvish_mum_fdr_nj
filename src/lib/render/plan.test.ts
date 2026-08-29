import { describe, expect, it } from "vitest";
import { buildRenderTimeline, captionsToSrt, ffconcatContent } from "@/lib/render/plan";

describe("render planning", () => {
  it("builds deterministic shot, caption, and voice timing", () => {
    const plan = buildRenderTimeline([
      {
        id: "scene-1",
        durationSec: 6,
        shots: [
          { id: "shot-1", sceneId: "scene-1", durationSec: 3, localVideoPath: "/media/a.mp4" },
          { id: "shot-2", sceneId: "scene-1", durationSec: 3, localVideoPath: "/media/b.mp4" },
        ],
        dialogue: [
          { id: "line-1", sceneId: "scene-1", shotId: "shot-2", captionText: "Hello", startOffsetMs: 250, durationEstimateMs: 1200, localVoicePath: "/media/v.wav" },
        ],
      },
    ]);
    expect(plan.videoPaths).toEqual(["/media/a.mp4", "/media/b.mp4"]);
    expect(plan.captions[0]).toEqual({ text: "Hello", startMs: 3250, endMs: 4450 });
    expect(plan.voices[0]).toEqual({ localPath: "/media/v.wav", startMs: 3250 });
    expect(plan.durationMs).toBe(6000);
  });

  it("writes SRT and concat manifests", () => {
    const srt = captionsToSrt([{ text: "Rex wins", startMs: 1000, endMs: 2500 }]);
    expect(srt).toContain("00:00:01,000 --> 00:00:02,500");
    expect(srt).toContain("Rex wins");
    expect(ffconcatContent(["/tmp/a.mp4", "/tmp/b.mp4"])).toContain("file '/tmp/a.mp4'");
  });
});
