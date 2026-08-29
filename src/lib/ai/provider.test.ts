import { describe, expect, it } from "vitest";
import { AIProviderError, parseJsonFromText } from "@/lib/ai/provider";

describe("parseJsonFromText", () => {
  it("parses a plain JSON object", () => {
    expect(parseJsonFromText<{ ok: boolean }>('{"ok":true}')).toEqual({ ok: true });
  });

  it("parses a fenced JSON response", () => {
    const text = ["Here is the JSON:", "```json", '{"title":"CreatorPilot"}', "```"].join("\n");

    expect(parseJsonFromText<{ title: string }>(text)).toEqual({ title: "CreatorPilot" });
  });

  it("parses a JSON object surrounded by prose", () => {
    const text = 'Result follows: {"items":["hook","script"]} Done.';

    expect(parseJsonFromText<{ items: string[] }>(text)).toEqual({ items: ["hook", "script"] });
  });

  it("throws a safe provider error for invalid JSON", () => {
    expect(() => parseJsonFromText("not json")).toThrow(AIProviderError);

    try {
      parseJsonFromText("not json");
    } catch (error) {
      expect(error).toBeInstanceOf(AIProviderError);
      expect((error as AIProviderError).status).toBe(502);
      expect((error as Error).message).toContain("not valid JSON");
    }
  });

  it("throws the same safe error for malformed fenced JSON", () => {
    expect(() => parseJsonFromText("```json\n{\"broken\":\n```")).toThrow(AIProviderError);
  });
});
