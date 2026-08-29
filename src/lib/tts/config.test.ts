import { describe, expect, it } from "vitest";
import { assertLocalTtsEnabled, getLocalTtsConfig } from "@/lib/tts/config";

describe("local TTS config", () => {
  it("defaults to disabled localhost Kokoro-compatible service", () => {
    const config = getLocalTtsConfig({});
    expect(config.enabled).toBe(false);
    expect(config.baseUrl).toBe("http://127.0.0.1:8880");
    expect(config.speechPath).toBe("/v1/audio/speech");
  });

  it("blocks execution until explicitly enabled", () => {
    expect(() => assertLocalTtsEnabled(getLocalTtsConfig({ LOCAL_TTS_ENABLED: "false" }))).toThrow();
    expect(() => assertLocalTtsEnabled(getLocalTtsConfig({ LOCAL_TTS_ENABLED: "true" }))).not.toThrow();
  });

  it("rejects non-local hosts", () => {
    expect(() => getLocalTtsConfig({ LOCAL_TTS_BASE_URL: "https://example.com" })).toThrow();
  });
});
