import { afterEach, describe, expect, it, vi } from "vitest";
import { RunPodClient } from "@/lib/runpod/client";
import { getRunPodConfig } from "@/lib/runpod/config";

function config() {
  return getRunPodConfig({
    RUNPOD_ENABLED: "true",
    RUNPOD_API_KEY: "secret-test-key",
    RUNPOD_VIDEO_ENDPOINT_ID: "video-endpoint",
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RunPodClient", () => {
  it("submits asynchronous /run jobs with execution policy", async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(JSON.stringify({ id: "job-123", status: "IN_QUEUE" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new RunPodClient(config());
    const result = await client.submit({ endpointId: "video-endpoint", input: { prompt: "hello" } });

    expect(result.id).toBe("job-123");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/video-endpoint/run");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body.input.prompt).toBe("hello");
    expect(body.policy.executionTimeout).toBe(900000);
  });

  it("normalizes status responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({ id: "job-123", status: "COMPLETED", output: { url: "https://example.com/a.mp4" } }),
          { status: 200 },
        ),
      ),
    );
    const result = await new RunPodClient(config()).status("video-endpoint", "job-123");
    expect(result.status).toBe("COMPLETED");
    expect(result.id).toBe("job-123");
  });

  it("maps rate limits to normalized provider errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response("too many", { status: 429 })),
    );
    await expect(new RunPodClient(config()).status("video-endpoint", "job-123")).rejects.toMatchObject({
      code: "PROVIDER_RATE_LIMIT",
    });
  });
});
