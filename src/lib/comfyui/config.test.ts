import { describe, expect, it } from "vitest";
import { getComfyUiConfig } from "@/lib/comfyui/config";

describe("ComfyUI config", () => {
  it("defaults to safe-off localhost", () => {
    const config = getComfyUiConfig({});
    expect(config.enabled).toBe(false);
    expect(config.baseUrl).toBe("http://127.0.0.1:8188");
  });

  it("accepts the HTTPS RunPod proxy URL without hardcoding a pod id", () => {
    const config = getComfyUiConfig({
      COMFYUI_ENABLED: "true",
      COMFYUI_BASE_URL: "https://example-3000.proxy.runpod.net/",
    });
    expect(config.enabled).toBe(true);
    expect(config.baseUrl).toBe("https://example-3000.proxy.runpod.net");
  });
});
