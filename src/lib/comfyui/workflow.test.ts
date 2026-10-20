import { describe, expect, it } from "vitest";
import { hydrateComfyUiWorkflow } from "@/lib/comfyui/workflow";

describe("ComfyUI workflow support", () => {
  it("hydrates typed exact placeholders and inline text placeholders", () => {
    const workflow = {
      "1": {
        class_type: "Example",
        inputs: {
          text: "{{PROMPT}} -- {{ASPECT_RATIO}}",
          seed: "{{SEED}}",
          image: "{{INPUT_IMAGE_NAME}}",
        },
      },
    };
    expect(
      hydrateComfyUiWorkflow(workflow, {
        PROMPT: "Rex enters the room",
        ASPECT_RATIO: "9:16",
        SEED: 42,
        INPUT_IMAGE_NAME: "keyframe.png",
      }),
    ).toEqual({
      "1": {
        class_type: "Example",
        inputs: {
          text: "Rex enters the room -- 9:16",
          seed: 42,
          image: "keyframe.png",
        },
      },
    });
  });
});
