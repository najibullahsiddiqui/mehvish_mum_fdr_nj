import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/api";
import { assertIdeaCanConvert, buildProjectCreateData, type IdeaForProject } from "@/lib/project-create";
import { projectCreateSchema } from "@/lib/validation";

const idea: IdeaForProject = {
  id: "idea_1",
  idea: "Build a personal YouTube research system",
  pillar: "creator systems",
  videoType: "screen-recording tutorial",
  notes: "Use CreatorPilot as the example.",
};

describe("project creation helpers", () => {
  it("builds project data from an idea safely", () => {
    const input = projectCreateSchema.parse({
      ideaId: "idea_1",
      targetLength: "10-12 minutes",
      language: "Hinglish",
      status: "researching",
      notes: "",
    });

    expect(buildProjectCreateData(input, idea)).toEqual({
      ideaId: "idea_1",
      topic: "Build a personal YouTube research system",
      pillar: "creator systems",
      videoType: "screen-recording tutorial",
      targetLength: "10-12 minutes",
      language: "Hinglish",
      status: "researching",
      notes: "Use CreatorPilot as the example.",
    });
  });

  it("builds project data from a manual topic without an idea", () => {
    const input = projectCreateSchema.parse({
      topic: "Manual project topic",
      pillar: "AI tools",
      videoType: "long-form explainer",
    });

    expect(buildProjectCreateData(input, null)).toMatchObject({
      ideaId: undefined,
      topic: "Manual project topic",
      pillar: "AI tools",
      videoType: "long-form explainer",
      targetLength: "8-10 minutes",
      language: "Hinglish",
      status: "planning",
      notes: null,
    });
  });

  it("rejects a project create request without idea or topic", () => {
    const input = projectCreateSchema.parse({});

    expect(() => buildProjectCreateData(input, null)).toThrow(HttpError);

    try {
      buildProjectCreateData(input, null);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(422);
    }
  });

  it("rejects duplicate idea conversion when strict conversion is requested", () => {
    expect(() => assertIdeaCanConvert({ id: "project_1" })).toThrow(HttpError);

    try {
      assertIdeaCanConvert({ id: "project_1" });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(409);
    }
  });

  it("rejects empty idea ids during validation", () => {
    const result = projectCreateSchema.safeParse({ ideaId: "" });

    expect(result.success).toBe(false);
  });
});
