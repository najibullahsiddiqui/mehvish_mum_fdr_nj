import { describe, expect, it } from "vitest";
import { composeQwenKeyframePrompt, validateQwenKeyframeReferences } from "@/lib/random-rooms/keyframe-planning";

describe("Qwen keyframe planning", () => {
  it("anchors room and character roles explicitly", () => {
    const prompt = composeQwenKeyframePrompt({
      shotPrompt: "Rex enters the lab and looks at the console.",
      visualDescription: "Moody sci-fi lighting.",
      cameraFraming: "medium shot",
      continuityNotes: "Keep Rex's jacket unchanged.",
    });

    expect(prompt).toContain("image_1 as the room/background canvas");
    expect(prompt).toContain("image_2 as the character identity reference");
    expect(prompt).toContain("Rex enters the lab");
    expect(prompt).toContain("medium shot");
    expect(prompt).toContain("Keep Rex's jacket unchanged");
  });

  it("blocks GPU submission when either required primary reference is missing", () => {
    expect(validateQwenKeyframeReferences({ roomReferencePath: null, characterReferencePath: "/tmp/rex.png" }))
      .toEqual(["primary room reference"]);
    expect(validateQwenKeyframeReferences({ roomReferencePath: "/tmp/room.png", characterReferencePath: null }))
      .toEqual(["primary character reference"]);
    expect(validateQwenKeyframeReferences({ roomReferencePath: "/tmp/room.png", characterReferencePath: "/tmp/rex.png" }))
      .toEqual([]);
  });
});
