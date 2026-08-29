import { HttpError } from "@/lib/api";
import type { ProjectStatus } from "@/lib/types";

export type IdeaForProject = {
  id: string;
  idea: string;
  pillar: string;
  videoType: string;
  notes: string | null;
};

export type ProjectCreateValues = {
  ideaId?: string;
  topic?: string;
  pillar?: string;
  videoType?: string;
  targetLength: string;
  language: string;
  status: ProjectStatus;
  notes: string | null;
};

export function assertIdeaCanConvert(existingProject: { id: string } | null) {
  if (existingProject) {
    throw new HttpError("Project already exists for this idea.", 409);
  }
}

export function buildProjectCreateData(input: ProjectCreateValues, idea: IdeaForProject | null) {
  if (!idea && !input.topic) {
    throw new HttpError("Provide either an ideaId or a project topic.", 422);
  }

  return {
    ideaId: idea?.id,
    topic: input.topic || idea?.idea || "",
    pillar: input.pillar || idea?.pillar || "General",
    videoType: input.videoType || idea?.videoType || "long-form explainer",
    targetLength: input.targetLength,
    language: input.language,
    status: input.status,
    notes: input.notes ?? idea?.notes ?? null,
  };
}
