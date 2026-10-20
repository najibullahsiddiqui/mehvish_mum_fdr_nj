import { describe, expect, it, vi } from "vitest";
import { ComfyUiClient, findComfyUiOutputs } from "@/lib/comfyui/client";
import { getComfyUiConfig } from "@/lib/comfyui/config";

describe("ComfyUiClient", () => {
  it("submits API-format workflow to /prompt", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ prompt_id: "p-1", number: 1, node_errors: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new ComfyUiClient(
      getComfyUiConfig({ COMFYUI_ENABLED: "true", COMFYUI_BASE_URL: "http://127.0.0.1:8188" }),
      fetchMock as typeof fetch,
    );
    const result = await client.submitPrompt({ "1": { class_type: "Test", inputs: {} } });
    expect(result.prompt_id).toBe("p-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8188/prompt",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("finds downloadable output descriptors in history payloads", () => {
    expect(
      findComfyUiOutputs({
        "9": { images: [{ filename: "frame.png", subfolder: "", type: "output" }] },
      }),
    ).toEqual([{ filename: "frame.png", subfolder: "", type: "output" }]);
  });
});
