import { extname } from "node:path";
import { ComfyUiClient, findComfyUiOutputs } from "@/lib/comfyui/client";
import { getComfyUiConfig } from "@/lib/comfyui/config";
import type { ComfyUiOutputRef, ComfyUiStatusSnapshot } from "@/lib/comfyui/types";
import { loadComfyUiWorkflow, type WorkflowVariables } from "@/lib/comfyui/workflow";
import { normalizeProviderError, ProviderResponseError } from "@/lib/providers/errors";

export type ComfyUiJobState = {
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  output: ComfyUiOutputRef | null;
  outputs: ComfyUiOutputRef[];
  error: string | null;
  raw: unknown;
};

function outputScore(ref: ComfyUiOutputRef, jobType: "IMAGE" | "VIDEO") {
  const ext = extname(ref.filename).toLowerCase();
  if (jobType === "IMAGE" && [".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return 10;
  if (jobType === "VIDEO" && [".mp4", ".webm", ".mov", ".mkv", ".gif"].includes(ext)) return 10;
  return 0;
}

export class ComfyUiProvider {
  private readonly config = getComfyUiConfig();
  private readonly client = new ComfyUiClient(this.config);

  async submitImage(variables: WorkflowVariables) {
    const workflow = await loadComfyUiWorkflow(this.config.imageWorkflowPath, variables);
    return this.client.submitPrompt(workflow);
  }

  async submitVideo(input: {
    variables: WorkflowVariables;
    imageBytes: Uint8Array;
    imageFilename: string;
  }) {
    const uploaded = await this.client.uploadImage({
      bytes: input.imageBytes,
      filename: input.imageFilename,
      subfolder: "creatorpilot",
      overwrite: true,
    });
    const workflow = await loadComfyUiWorkflow(this.config.videoWorkflowPath, {
      ...input.variables,
      INPUT_IMAGE_NAME: uploaded.name,
      INPUT_IMAGE_SUBFOLDER: uploaded.subfolder,
      INPUT_IMAGE_TYPE: uploaded.type,
    });
    return this.client.submitPrompt(workflow);
  }

  async poll(promptId: string, jobType: "IMAGE" | "VIDEO"): Promise<ComfyUiJobState> {
    const history = await this.client.history(promptId);
    const entry = history[promptId];
    if (!entry) return { status: "RUNNING", output: null, outputs: [], error: null, raw: history };

    const outputs = findComfyUiOutputs(entry.outputs);
    const completed = entry.status?.completed === true || entry.status?.status_str === "success";
    const failed = entry.status?.status_str === "error";

    if (failed) {
      return {
        status: "FAILED",
        output: null,
        outputs,
        error: "ComfyUI reported a failed workflow execution.",
        raw: entry,
      };
    }
    if (!completed) return { status: "RUNNING", output: null, outputs, error: null, raw: entry };

    const output = [...outputs].sort((a, b) => outputScore(b, jobType) - outputScore(a, jobType))[0] || null;
    if (!output) {
      throw new ProviderResponseError("ComfyUI completed the workflow but no downloadable output was found.");
    }
    return { status: "COMPLETED", output, outputs, error: null, raw: entry };
  }

  async download(ref: ComfyUiOutputRef) {
    return this.client.view(ref);
  }
}

export async function getComfyUiStatusSnapshot(checkHealth = true): Promise<ComfyUiStatusSnapshot> {
  const config = getComfyUiConfig();
  const configured = !!config.baseUrl;
  const base: ComfyUiStatusSnapshot = {
    enabled: config.enabled,
    configured,
    available: null,
    baseUrl: config.baseUrl,
    imageWorkflowConfigured: !!config.imageWorkflowPath,
    videoWorkflowConfigured: !!config.videoWorkflowPath,
    message: !config.enabled
      ? "ComfyUI is in safe-off mode. Start the RunPod Pod and set COMFYUI_ENABLED=true only for intentional GPU work."
      : undefined,
  };

  if (!checkHealth || !config.enabled) return base;
  try {
    const systemStats = await new ComfyUiClient(config).systemStats();
    return { ...base, available: true, systemStats, message: undefined };
  } catch (error) {
    const normalized = normalizeProviderError(error);
    return { ...base, available: false, message: normalized.message };
  }
}
