import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { hydrateComfyUiWorkflow } from "@/lib/comfyui/workflow";

describe("CreatorPilot Qwen keyframe API workflow", () => {
  it("hydrates the verified room, character, prompt, negative prompt, and seed placeholders", async () => {
    const raw = JSON.parse(
      await readFile(path.resolve(process.cwd(), "workflows/creatorpilot_qwen_keyframe_v1.api.json"), "utf8"),
    );

    const hydrated = hydrateComfyUiWorkflow(raw, {
      ROOM_REFERENCE_SUBFOLDER: "creatorpilot/references",
      ROOM_REFERENCE_NAME: "room.png",
      CHARACTER_REFERENCE_1_SUBFOLDER: "creatorpilot/references",
      CHARACTER_REFERENCE_1_NAME: "rex.png",
      PROMPT: "Place Rex in the room.",
      NEGATIVE_PROMPT: "blurry",
      SEED: 42,
    }) as Record<string, { inputs: Record<string, unknown> }>;

    expect(hydrated["470"].inputs.image).toBe("creatorpilot/references/room.png");
    expect(hydrated["475"].inputs.image).toBe("creatorpilot/references/rex.png");
    expect(hydrated["459:484"].inputs.on_false).toBe("Place Rex in the room.");
    expect(hydrated["459:474"].inputs.negative_prompt).toBe("blurry");
    expect(hydrated["459:458"].inputs.seed).toBe(42);
  });
});
