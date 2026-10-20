import { createHash } from "node:crypto";
import { HttpError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const ACTIVE_GENERATION_STATUSES = ["SUBMITTING", "QUEUED", "RUNNING", "IN_QUEUE", "IN_PROGRESS"] as const;
export const TERMINAL_FAILURE_STATUSES = ["FAILED", "TIMED_OUT", "CANCELLED"] as const;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
    .join(",")}}`;
}

export function generationInputHash(input: unknown) {
  return createHash("sha256").update(stableStringify(input)).digest("hex");
}

export function generationIdempotencyKey(input: {
  jobType: string;
  targetId: string;
  payload: unknown;
  attempt?: number;
}) {
  const attempt = input.attempt ?? 1;
  return `${input.jobType}:${input.targetId}:${generationInputHash(input.payload)}:${attempt}`;
}

export async function nextGenerationAttempt(where: {
  jobType: string;
  shotId?: string | null;
  dialogueLineId?: string | null;
  episodeId?: string | null;
}) {
  const latest = await prisma.generationJob.findFirst({
    where: {
      jobType: where.jobType,
      shotId: where.shotId ?? undefined,
      dialogueLineId: where.dialogueLineId ?? undefined,
      episodeId: where.episodeId ?? undefined,
    },
    orderBy: { createdAt: "desc" },
    select: { attempt: true },
  });
  return (latest?.attempt || 0) + 1;
}

export async function assertNoActiveGeneration(where: {
  jobType: string;
  shotId?: string | null;
  dialogueLineId?: string | null;
  episodeId?: string | null;
}) {
  const existing = await prisma.generationJob.findFirst({
    where: {
      jobType: where.jobType,
      shotId: where.shotId ?? undefined,
      dialogueLineId: where.dialogueLineId ?? undefined,
      episodeId: where.episodeId ?? undefined,
      status: { in: [...ACTIVE_GENERATION_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    throw new HttpError(`A ${where.jobType.toLowerCase()} generation is already active for this target.`, 409);
  }
}

export async function latestTerminalFailure(where: {
  jobType: string;
  shotId?: string | null;
  dialogueLineId?: string | null;
  episodeId?: string | null;
}) {
  return prisma.generationJob.findFirst({
    where: {
      jobType: where.jobType,
      shotId: where.shotId ?? undefined,
      dialogueLineId: where.dialogueLineId ?? undefined,
      episodeId: where.episodeId ?? undefined,
      status: { in: [...TERMINAL_FAILURE_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function isUniqueConstraintError(error: unknown) {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002";
}

export function duplicateGenerationError(jobType: string) {
  return new HttpError(`A ${jobType.toLowerCase()} generation is already active or this exact attempt already exists.`, 409);
}
