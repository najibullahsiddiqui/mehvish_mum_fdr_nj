import Anthropic from "@anthropic-ai/sdk";
import { parseJsonFromText } from "@/lib/providers/json";
import {
  normalizeProviderError,
  ProviderAuthenticationError,
  ProviderConfigurationError,
  ProviderResponseError,
} from "@/lib/providers/errors";
import type { GenerateJsonOptions, GenerateTextOptions, LLMJsonResult, LLMProvider, LLMTextResult } from "@/lib/providers/types";

export class ClaudeLLMProvider implements LLMProvider {
  id = "claude" as const;
  name = "Claude";
  model: string;
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

  private client: Anthropic;

  constructor(input: { apiKey?: string; model?: string } = {}) {
    const apiKey = input.apiKey ?? process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      throw new ProviderConfigurationError("CLAUDE_API_KEY is missing. Add it to .env before running Claude generations.");
    }

    this.model = input.model || process.env.CLAUDE_MODEL || "claude-sonnet-4-5";
    this.client = new Anthropic({ apiKey });
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
      costEstimate: text.costEstimate,
      rawText: text.text,
    };
  }

  async generateText(options: GenerateTextOptions): Promise<LLMTextResult> {
    try {
      const message = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: options.maxTokens ?? 2500,
          temperature: options.temperature ?? 0.4,
          system: options.system,
          messages: [
            {
              role: "user",
              content: options.prompt,
            },
          ],
        },
        options.signal ? { signal: options.signal } : undefined,
      );

      const text = message.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .filter(Boolean)
        .join("\n")
        .trim();

      if (!text) {
        throw new ProviderResponseError("Claude returned an empty response.");
      }

      return {
        text,
        provider: this.name,
        providerId: this.id,
        providerKind: "llm",
        model: this.model,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
        costEstimate: null,
      };
    } catch (error) {
      const normalized = normalizeProviderError(error);

      if (normalized.code === "PROVIDER_AUTHENTICATION_ERROR") {
        throw new ProviderAuthenticationError("Claude rejected the configured credentials.");
      }

      throw normalized;
    }
  }
}

export class ClaudeProvider extends ClaudeLLMProvider {}
