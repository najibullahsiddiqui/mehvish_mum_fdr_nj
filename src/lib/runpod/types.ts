export const RUNPOD_JOB_STATUSES = [
  "IN_QUEUE",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "TIMED_OUT",
  "CANCELLED",
  "UNKNOWN",
] as const;

export type RunPodJobStatus = (typeof RUNPOD_JOB_STATUSES)[number];

export type RunPodConfig = {
  enabled: boolean;
  apiKey: string | null;
  baseUrl: string;
  videoEndpointId: string | null;
  imageEndpointId: string | null;
  videoModel: string | null;
  requestTimeoutMs: number;
  executionTimeoutMs: number;
  jobTtlMs: number;
};

export type RunPodSubmitOptions = {
  endpointId: string;
  input: Record<string, unknown>;
  webhook?: string;
  executionTimeoutMs?: number;
  ttlMs?: number;
};

export type RunPodSubmitResponse = {
  id: string;
  status?: string;
};

export type RunPodStatusResponse = {
  id: string;
  status: RunPodJobStatus;
  output?: unknown;
  error?: string | null;
  delayTime?: number;
  executionTime?: number;
  workerId?: string;
};

export type RunPodHealthResponse = {
  jobs?: {
    completed?: number;
    failed?: number;
    inProgress?: number;
    inQueue?: number;
    retried?: number;
  };
  workers?: {
    idle?: number;
    initializing?: number;
    ready?: number;
    running?: number;
    throttled?: number;
    unhealthy?: number;
  };
  [key: string]: unknown;
};

export type RunPodStatusSnapshot = {
  enabled: boolean;
  configured: boolean;
  videoConfigured: boolean;
  imageConfigured: boolean;
  available: boolean | null;
  baseUrl: string;
  videoEndpointId: string | null;
  imageEndpointId: string | null;
  videoModel: string | null;
  requestTimeoutMs: number;
  message?: string;
  health?: RunPodHealthResponse | null;
};
