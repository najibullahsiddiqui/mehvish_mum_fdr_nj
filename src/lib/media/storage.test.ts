import path from "node:path";
import { describe, expect, it } from "vitest";
import { episodeMediaDirectory, getMediaRoot, resolveMediaPath, safeMediaSegment } from "@/lib/media/storage";

describe("media storage", () => {
  it("sanitizes unsafe path segments", () => {
    expect(safeMediaSegment("../RR EP 001 / test")).toBe("..-RR-EP-001-test");
  });

  it("resolves episode media under MEDIA_ROOT", () => {
    const env = { MEDIA_ROOT: "./tmp-media" };
    const root = getMediaRoot(env);
    const target = episodeMediaDirectory("random rooms", "RR_EP_0001", "video", env);
    expect(target.startsWith(`${root}${path.sep}`)).toBe(true);
    expect(target).toContain("random-rooms");
    expect(target).toContain("RR_EP_0001");
  });

  it("never accepts raw traversal as directory structure", () => {
    const target = resolveMediaPath(["../outside", "../../clip"], { MEDIA_ROOT: "./tmp-media" });
    expect(target).not.toContain(`${path.sep}..${path.sep}`);
  });
});
