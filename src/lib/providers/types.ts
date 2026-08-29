export const PROVIDER_KINDS = ["llm", "image", "video", "tts"] as const;
export const LLM_PROVIDER_IDS = ["mock", "claude", "ollama", "qwen"] as const;

export type ProviderKind = (typeof PROVIDER_KINDS)[number];
export type LLMProviderId = (typeof LLM_PROVIDER_IDS)[number];

export type ProviderCapability = {
  providerId: string;
  kind: ProviderKind;
  supportsStructuredJson: boolean;
  supportsText: boolean;
  supportsStreaming: boolean;
  local: boolean;
  cloud: boolean;
  potentiallyPaid: boolean;
};

export type ProviderUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type GenerateJsonOptions = {
  featureName: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
};

export type GenerateTextOptions = Omit<GenerateJsonOptions, "featureName"> & {
  featureName?: string;
};

export type LLMJsonResult<T> = {
  data: T;
  provider: string;
  providerId: string;
  providerKind: "llm";
  model: string;
  usage?: ProviderUsage;
  costEstimate?: number | null;
  rawText: string;
};

export type LLMTextResult = {
  text: string;
  provider: string;
  providerId: string;
  providerKind: "llm";
  model: string;
  usage?: ProviderUsage;
  costEstimate?: number | null;
};

export interface LLMProvider {
  id: LLMProviderId;
  name: string;
  model: string;
  capability: ProviderCapability;
  generateJson<T>(options: GenerateJsonOptions): Promise<LLMJsonResult<T>>;
  generateText?(options: GenerateTextOptions): Promise<LLMTextResult>;
}

export type ImageGenerationOptions = {
  prompt: string;
  aspectRatio?: string;
  seed?: number;
  referenceImagePaths?: string[];
  signal?: AbortSignal;
};

export type ImageGenerationResult = {
  provider: string;
  providerId: string;
  providerKind: "image";
  model: string;
  localPath?: string;
  url?: string;
  width?: number;
  height?: number;
  costEstimate?: number | null;
};

export interface ImageProvider {
  id: string;
  name: string;
  model: string;
  capability: ProviderCapability;
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
}

export type VideoGenerationOptions = {
  prompt: string;
  imagePath?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  signal?: AbortSignal;
};

export type VideoGenerationResult = {
  provider: string;
  providerId: string;
  providerKind: "video";
  model: string;
  localPath?: string;
  url?: string;
  durationSeconds?: number;
  costEstimate?: number | null;
};

export interface VideoProvider {
  id: string;
  name: string;
  model: string;
  capability: ProviderCapability;
  generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult>;
}

export type TTSOptions = {
  text: string;
  voiceId?: string;
  language?: string;
  signal?: AbortSignal;
};

export type TTSResult = {
  provider: string;
  providerId: string;
  providerKind: "tts";
  model: string;
  localPath?: string;
  url?: string;
  durationSeconds?: number;
  costEstimate?: number | null;
};

export interface TTSProvider {
  id: string;
  name: string;
  model: string;
  capability: ProviderCapability;
  synthesizeSpeech(options: TTSOptions): Promise<TTSResult>;
}

export type ProviderStatus = {
  provider: string;
  providerId: string;
  kind: ProviderKind;
  configured: boolean;
  available: boolean | null;
  local: boolean;
  cloud: boolean;
  potentiallyPaid: boolean;
  allowed: boolean;
  active: boolean;
  model: string | null;
  message?: string;
  errorCode?: string;
};

export type ProviderStatusSnapshot = {
  activeLLMProvider: string | null;
  llmProvider: ProviderStatus;
  providers: ProviderStatus[];
  costSafety: {
    allowPaidAI: boolean;
    allowCloudAI: boolean;
    maxRetries: number;
    requestTimeoutMs: number;
  };
};
