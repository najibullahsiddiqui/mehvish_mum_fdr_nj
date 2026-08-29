import { parseJsonFromText } from "@/lib/providers/json";
import {
  normalizeProviderError,
  ProviderConfigurationError,
  ProviderResponseError,
  ProviderUnavailableError,
} from "@/lib/providers/errors";
import type { GenerateJsonOptions, GenerateTextOptions, LLMJsonResult, LLMProvider, LLMTextResult } from "@/lib/providers/types";

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
  prompt_eval_count?: number;
  eval_count?: number;
};

export class OllamaLLMProvider implements LLMProvider {
  id = "ollama" as const;
  name = "Ollama";
  model: string;
  baseUrl: string;
  capability = {
    providerId: this.id,
    kind: "llm" as const,
    supportsStructuredJson: true,
    supportsText: true,
    supportsStreaming: false,
    local: true,
    cloud: false,
    potentiallyPaid: false,
  };

  constructor(input: { baseUrl?: string; model?: string | null } = {}) {
    this.baseUrl = (input.baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
    const model = input.model === undefined ? process.env.OLLAMA_MODEL : input.model;

    if (!model) {
      throw new ProviderConfigurationError("OLLAMA_MODEL is missing. Set it to an installed local Ollama model.");
    }

    this.model = model;
  }

  async generateJson<T>(options: GenerateJsonOptions): Promise<LLMJsonResult<T>> {
    const text = await this.generateText({
      system: options.system,
      prompt: `${options.prompt}\n\nReturn only strict JSON. Do not wrap it in markdown fences.`,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      signal: options.signal,
      featureName: options.featureName,
    });

    return {
      data: parseJsonFromText<T>(text.text),
      provider: this.name,
      providerId: this.id,
      providerKind: "llm",
      model: this.model,
      usage: text.usage,
      costEstimate: null,
      rawText: text.text,
    };
  }

  async generateText(options: GenerateTextOptions): Promise<LLMTextResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: options.signal,
        body: JSON.stringify({
          model: this.model,
          system: options.system,
          prompt: options.prompt,
          stream: false,
          format: "json",
          options: {
            temperature: options.temperature ?? 0.4,
            num_predict: options.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new ProviderUnavailableError(`Ollama returned HTTP ${response.status}.`);
      }

      const payload = (await response.json()) as OllamaGenerateResponse;

      if (payload.error) {
        throw new ProviderResponseError(payload.error);
      }

      const text = payload.response?.trim();

      if (!text) {
        throw new ProviderResponseError("Ollama returned an empty response.");
      }

      return {
        text,
        provider: this.name,
        providerId: this.id,
        providerKind: "llm",
        model: this.model,
        usage: {
          inputTokens: payload.prompt_eval_count,
          outputTokens: payload.eval_count,
        },
        costEstimate: null,
      };
    } catch (error) {
      throw normalizeProviderError(error);
    }
  }

  async healthCheck(signal?: AbortSignal) {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal });
      return response.ok;
    } catch {
      return false;
    }
  }
}
