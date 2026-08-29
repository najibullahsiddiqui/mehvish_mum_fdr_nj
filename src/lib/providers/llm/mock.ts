import { mockLLMJsonForFeature } from "@/lib/providers/mock-fixtures";
import type { GenerateJsonOptions, GenerateTextOptions, LLMJsonResult, LLMProvider, LLMTextResult } from "@/lib/providers/types";

export class MockLLMProvider implements LLMProvider {
  id = "mock" as const;
  name = "Mock LLM";
  model = "creatorpilot-mock";
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

  async generateJson<T>(options: GenerateJsonOptions): Promise<LLMJsonResult<T>> {
    const data = mockLLMJsonForFeature(options.featureName) as T;

    return {
      data,
      provider: this.name,
      providerId: this.id,
      providerKind: "llm",
      model: this.model,
      costEstimate: null,
      rawText: JSON.stringify(data),
    };
  }

  async generateText(options: GenerateTextOptions): Promise<LLMTextResult> {
    return {
      text: `Mock response for ${options.featureName || "text_generation"}.`,
      provider: this.name,
      providerId: this.id,
      providerKind: "llm",
      model: this.model,
      costEstimate: null,
    };
  }
}
