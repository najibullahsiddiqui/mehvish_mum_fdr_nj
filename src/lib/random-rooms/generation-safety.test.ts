import { describe, expect, it } from "vitest";
import { generationIdempotencyKey, generationInputHash } from "@/lib/random-rooms/generation-safety";

describe("generation safety", () => {
  it("hashes equivalent object payloads deterministically regardless of key order", () => {
    const a = generationInputHash({ prompt: "hello", nested: { b: 2, a: 1 } });
    const b = generationInputHash({ nested: { a: 1, b: 2 }, prompt: "hello" });
    expect(a).toBe(b);
  });

  it("changes the idempotency key when the attempt changes", () => {
    const payload = { prompt: "same prompt" };
    const first = generationIdempotencyKey({ jobType: "IMAGE", targetId: "shot-1", payload, attempt: 1 });
    const retry = generationIdempotencyKey({ jobType: "IMAGE", targetId: "shot-1", payload, attempt: 2 });
    expect(first).not.toBe(retry);
  });
});
