import { describe, expect, it, vi } from "vitest";
import { LocalTtsClient } from "@/lib/tts/client";
import { getLocalTtsConfig } from "@/lib/tts/config";

describe("LocalTtsClient", () => {
  it("posts OpenAI-compatible speech payload and returns audio bytes", async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "audio/wav" } }));
    const client = new LocalTtsClient(getLocalTtsConfig({ LOCAL_TTS_ENABLED: "true" }), fetchMock as typeof fetch);
    const result = await client.synthesize({ text: "hello", voice: "af_heart" });
    expect(result.bytes.length).toBe(3);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({ input: "hello", voice: "af_heart", model: "kokoro" });
  });

  it("does not call the service while disabled", async () => {
    const fetchMock = vi.fn();
    const client = new LocalTtsClient(getLocalTtsConfig({ LOCAL_TTS_ENABLED: "false" }), fetchMock as typeof fetch);
    await expect(client.synthesize({ text: "blocked" })).rejects.toMatchObject({ code: "PROVIDER_COST_GUARD" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
