import { prisma } from "@/lib/prisma";
import { getComfyUiConfig } from "@/lib/comfyui/config";
import { getRunPodConfig } from "@/lib/runpod/config";
import { syncGenerationJob } from "@/lib/random-rooms/production-service";
import { ACTIVE_GENERATION_STATUSES } from "@/lib/random-rooms/generation-safety";

const STALE_SUBMISSION_MS = 2 * 60_000;

export async function reapStaleGenerationJobs(now = new Date()) {
  const staleBefore = new Date(now.getTime() - STALE_SUBMISSION_MS);

  const staleSubmitting = await prisma.generationJob.updateMany({
    where: {
      status: "SUBMITTING",
      providerJobId: null,
      updatedAt: { lt: staleBefore },
    },
    data: {
      status: "FAILED",
      errorCode: "STALE_SUBMISSION",
      errorMessage: "Generation submission did not receive a provider job ID and was reaped safely.",
      completedAt: now,
      leaseUntil: null,
      nextPollAt: null,
    },
  });

  const expiredLeases = await prisma.generationJob.updateMany({
    where: {
      status: { in: [...ACTIVE_GENERATION_STATUSES] },
      leaseUntil: { lt: now },
      providerJobId: null,
    },
    data: {
      status: "FAILED",
      errorCode: "LEASE_EXPIRED",
      errorMessage: "Generation worker lease expired before the job could complete.",
      completedAt: now,
      leaseUntil: null,
      nextPollAt: null,
    },
  });

  return { staleSubmitting: staleSubmitting.count, expiredLeases: expiredLeases.count };
}

export async function syncDueExternalJobs(now = new Date()) {
  const runPod = getRunPodConfig();
  const comfyUi = getComfyUiConfig();
  const enabledProviders: string[] = [];
  if (runPod.enabled && runPod.apiKey) enabledProviders.push("runpod");
  if (comfyUi.enabled) enabledProviders.push("comfyui");
  if (!enabledProviders.length) return { checked: 0, synced: 0, errors: [] as string[] };

  const jobs = await prisma.generationJob.findMany({
    where: {
      provider: { in: enabledProviders },
      providerJobId: { not: null },
      status: { in: [...ACTIVE_GENERATION_STATUSES] },
      OR: [{ nextPollAt: null }, { nextPollAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  let synced = 0;
  const errors: string[] = [];
  for (const job of jobs) {
    try {
      await syncGenerationJob(job.id);
      synced += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Could not sync job ${job.id}.`);
    }
  }
  return { checked: jobs.length, synced, errors };
}

export async function runGenerationSweep(now = new Date()) {
  const reaped = await reapStaleGenerationJobs(now);
  const external = await syncDueExternalJobs(now);
  return { reaped, external };
}
