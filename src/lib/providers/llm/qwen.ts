import { ProviderConfigurationError, ProviderUnavailableError } from "@/lib/providers/errors";
import type { GenerateJsonOptions, GenerateTextOptions, LLMJsonResult, LLMProvider, LLMTextResult } from "@/lib/providers/types";

export class QwenLLMProvider implements LLMProvider {
  id = "qwen" as const;
  name = "Alibaba Qwen";
  model: string;
  baseUrl: string | null;
  capability = {
    providerId: this.id,
    kind: "llm" as const,
    supportsStructuredJson: true,
    supportsText: true,
    supportsStreaming: false,
    local: false,
    cloud: true,
    potentiallyPaid: true,
  };

  constructor(input: { apiKey?: string; baseUrl?: string | null; model?: string | null } = {}) {
    const apiKey = input.apiKey ?? process.env.QWEN_API_KEY;

    if (!apiKey) {
      throw new ProviderConfigurationError("QWEN_API_KEY is missing. Qwen is configured as a cloud provider boundary only.");
    }

    this.baseUrl = input.baseUrl ?? process.env.QWEN_BASE_URL ?? null;

    if (!this.baseUrl) {
      throw new ProviderConfigurationError("QWEN_BASE_URL is missing. Add the official endpoint before enabling Qwen.");
    }

    this.model = input.model || process.env.QWEN_MODEL || "";

    if (!this.model) {
      throw new ProviderConfigurationError("QWEN_MODEL is missing.");
    }
  }

  async generateJson<T>(_options: GenerateJsonOptions): Promise<LLMJsonResult<T>> {
    throw new ProviderUnavailableError("Qwen adapter boundary exists, but live Qwen calls are not implemented in Phase 2.");
  }

  async generateText(_options: GenerateTextOptions): Promise<LLMTextResult> {
    throw new ProviderUnavailableError("Qwen adapter boundary exists, but live Qwen calls are not implemented in Phase 2.");
  }
}
