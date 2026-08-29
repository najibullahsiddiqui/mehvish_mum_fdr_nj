import { describe, expect, it } from "vitest";
import { assertYouTubeConfigured, getYouTubeConfig, publicYouTubeStatus } from "@/lib/youtube/config";

describe("YouTube configuration", () => {
  it("is safe-off by default", () => {
    const config = getYouTubeConfig({});
    expect(config.enabled).toBe(false);
    expect(config.analyticsEnabled).toBe(false);
    expect(config.containsSyntheticMedia).toBe(true);
    expect(publicYouTubeStatus({}).configured).toBe(false);
  });

  it("requires explicit enablement and OAuth credentials", () => {
    const env = { YOUTUBE_PUBLISH_ENABLED: "true", YOUTUBE_CLIENT_ID: "client", YOUTUBE_CLIENT_SECRET: "secret", YOUTUBE_REFRESH_TOKEN: "refresh" };
    expect(() => assertYouTubeConfigured(getYouTubeConfig(env), "publish")).not.toThrow();
    expect(() => assertYouTubeConfigured(getYouTubeConfig({ ...env, YOUTUBE_PUBLISH_ENABLED: "false" }), "publish")).toThrow(/disabled/i);
  });

  it("forces a known privacy value", () => {
    const env = { YOUTUBE_PUBLISH_ENABLED: "true", YOUTUBE_CLIENT_ID: "client", YOUTUBE_CLIENT_SECRET: "secret", YOUTUBE_REFRESH_TOKEN: "refresh", YOUTUBE_DEFAULT_PRIVACY: "friends" };
    expect(() => assertYouTubeConfigured(getYouTubeConfig(env), "publish")).toThrow(/privacy/i);
  });
});
