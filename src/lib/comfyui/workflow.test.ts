import { describe, expect, it } from "vitest";
import { generationInputHash } from "@/lib/random-rooms/generation-safety";

describe("ComfyUI workflow support", () => {
  it("keeps semantic job inputs hashable without depending on ComfyUI node ids", () => {
    const a = generationInputHash({ prompt: "Rex in room", aspectRatio: "9:16" });
    const b = generationInputHash({ aspectRatio: "9:16", prompt: "Rex in room" });
    expect(a).toBe(b);
  });
});
