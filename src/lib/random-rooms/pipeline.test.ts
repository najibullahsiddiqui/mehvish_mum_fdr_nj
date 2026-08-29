import { describe, expect, it } from "vitest";
import { summarizePipelineState } from "@/lib/random-rooms/pipeline";

describe("summarizePipelineState", () => {
  it("marks missing production stages and computes readiness", () => {
    const result = summarizePipelineState({
      dialogueLines: [{ id: "d1", hasVoice: false }],
      shots: [{ id: "s1", hasImage: true, hasVideo: false }],
      hasFinalVideo: false,
      jobs: [],
    });
    expect(result.voice.missing).toBe(1);
    expect(result.image.missing).toBe(0);
    expect(result.video.missing).toBe(1);
    expect(result.render.ready).toBe(false);
    expect(result.overallStatus).toBe("NEEDS_MEDIA");
  });

  it("marks episode render ready when all media exists", () => {
    const result = summarizePipelineState({
      dialogueLines: [{ id: "d1", hasVoice: true }],
      shots: [{ id: "s1", hasImage: true, hasVideo: true }],
      hasFinalVideo: false,
      jobs: [],
    });
    expect(result.render.ready).toBe(true);
    expect(result.overallStatus).toBe("READY_TO_RENDER");
  });

  it("marks pipeline complete when final video exists", () => {
    const result = summarizePipelineState({ dialogueLines: [], shots: [], hasFinalVideo: true, jobs: [] });
    expect(result.overallStatus).toBe("COMPLETE");
  });
});
