import { describe, expect, it } from "vitest";
import { ProviderConfigurationError, ProviderCostGuardError } from "@/lib/providers/errors";
import { assertRunPodConfigured, getRunPodConfig } from "@/lib/runpod/config";

describe("RunPod configuration", () => {
  it("defaults to safe-off mode", () => {
    const config = getRunPodConfig({});
    expect(config.enabled).toBe(false);
    expect(config.baseUrl).toBe("https://api.runpod.ai/v2");
    expect(config.requestTimeoutMs).toBe(15000);
  });

  it("reads explicit endpoint and timeout settings", () => {
    const config = getRunPodConfig({
      RUNPOD_ENABLED: "true",
      RUNPOD_API_KEY: "test-key",
      RUNPOD_VIDEO_ENDPOINT_ID: "video-1",
      RUNPOD_VIDEO_MODEL: "wan",
      RUNPOD_REQUEST_TIMEOUT_MS: "12000",
    });
    expect(config.enabled).toBe(true);
    expect(config.videoEndpointId).toBe("video-1");
    expect(config.videoModel).toBe("wan");
    expect(config.requestTimeoutMs).toBe(12000);
  });

  it("blocks execution until explicitly enabled", () => {
    const config = getRunPodConfig({ RUNPOD_API_KEY: "test", RUNPOD_VIDEO_ENDPOINT_ID: "video" });
    expect(() => assertRunPodConfigured(config, config.videoEndpointId)).toThrow(ProviderCostGuardError);
  });

  it("requires credentials and an endpoint after enabling", () => {
    expect(() => assertRunPodConfigured(getRunPodConfig({ RUNPOD_ENABLED: "true" }), "video")).toThrow(
      ProviderConfigurationError,
    );
    expect(() =>
      assertRunPodConfigured(getRunPodConfig({ RUNPOD_ENABLED: "true", RUNPOD_API_KEY: "test" }), null),
    ).toThrow(ProviderConfigurationError);
  });

  it("rejects invalid insecure remote base URLs", () => {
    expect(() => getRunPodConfig({ RUNPOD_BASE_URL: "http://example.com/v2" })).toThrow(ProviderConfigurationError);
  });
});
