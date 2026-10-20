import {
  ProviderResponseError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from "@/lib/providers/errors";
import { assertComfyUiEnabled } from "@/lib/comfyui/config";
import type {
  ComfyUiConfig,
  ComfyUiHistoryResponse,
  ComfyUiOutputRef,
  ComfyUiPromptResponse,
  ComfyUiUploadResponse,
} from "@/lib/comfyui/types";

export class ComfyUiClient {
  constructor(
    private readonly config: ComfyUiConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request(path: string, init: RequestInit = {}) {
    assertComfyUiEnabled(this.config);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
      });
      if (response.status >= 500) {
        throw new ProviderUnavailableError(`ComfyUI returned HTTP ${response.status}.`, { status: response.status });
      }
      if (!response.ok) {
        const text = await response.text();
        throw new ProviderResponseError(`ComfyUI returned HTTP ${response.status}: ${text.slice(0, 300)}`, {
          status: response.status,
        });
      }
      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ProviderTimeoutError("ComfyUI request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async systemStats() {
    const response = await this.request("/system_stats", { method: "GET" });
    return response.json() as Promise<unknown>;
  }

  async submitPrompt(prompt: Record<string, unknown>, clientId?: string): Promise<ComfyUiPromptResponse> {
    const response = await this.request("/prompt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, ...(clientId ? { client_id: clientId } : {}) }),
    });
    const result = (await response.json()) as ComfyUiPromptResponse;
    if (!result.prompt_id) throw new ProviderResponseError("ComfyUI prompt submission did not return prompt_id.");
    if (result.node_errors && Object.keys(result.node_errors).length) {
      throw new ProviderResponseError("ComfyUI rejected the workflow because one or more nodes are invalid.");
    }
    return result;
  }

  async history(promptId: string): Promise<ComfyUiHistoryResponse> {
    const response = await this.request(`/history/${encodeURIComponent(promptId)}`, { method: "GET" });
    return response.json() as Promise<ComfyUiHistoryResponse>;
  }

  async uploadImage(input: {
    bytes: Uint8Array;
    filename: string;
    subfolder?: string;
    overwrite?: boolean;
  }): Promise<ComfyUiUploadResponse> {
    const form = new FormData();
    form.append("image", new Blob([input.bytes]), input.filename);
    form.append("type", "input");
    if (input.subfolder) form.append("subfolder", input.subfolder);
    form.append("overwrite", input.overwrite ? "true" : "false");

    const response = await this.request("/upload/image", { method: "POST", body: form });
    return response.json() as Promise<ComfyUiUploadResponse>;
  }

  async view(ref: ComfyUiOutputRef): Promise<{ bytes: Uint8Array; mimeType: string | null }> {
    const query = new URLSearchParams({
      filename: ref.filename,
      subfolder: ref.subfolder || "",
      type: ref.type || "output",
    });
    const response = await this.request(`/view?${query.toString()}`, { method: "GET" });
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      mimeType: response.headers.get("content-type"),
    };
  }
}

export function findComfyUiOutputs(value: unknown): ComfyUiOutputRef[] {
  const refs: ComfyUiOutputRef[] = [];
  const visit = (entry: unknown) => {
    if (Array.isArray(entry)) {
      for (const item of entry) visit(item);
      return;
    }
    if (!entry || typeof entry !== "object") return;
    const object = entry as Record<string, unknown>;
    if (
      typeof object.filename === "string" &&
      typeof object.type === "string" &&
      (typeof object.subfolder === "string" || object.subfolder === undefined)
    ) {
      refs.push({
        filename: object.filename,
        subfolder: typeof object.subfolder === "string" ? object.subfolder : "",
        type: object.type,
      });
    }
    for (const nested of Object.values(object)) visit(nested);
  };
  visit(value);
  return refs;
}
