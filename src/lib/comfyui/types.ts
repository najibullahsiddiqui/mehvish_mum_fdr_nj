export type ComfyUiConfig = {
  enabled: boolean;
  baseUrl: string;
  requestTimeoutMs: number;
  imageWorkflowPath: string | null;
  videoWorkflowPath: string | null;
  defaultNegativePrompt: string;
};

export type ComfyUiPromptResponse = {
  prompt_id: string;
  number?: number;
  node_errors?: Record<string, unknown>;
};

export type ComfyUiUploadResponse = {
  name: string;
  subfolder: string;
  type: string;
};

export type ComfyUiOutputRef = {
  filename: string;
  subfolder: string;
  type: string;
};

export type ComfyUiHistoryEntry = {
  outputs?: Record<string, unknown>;
  status?: {
    status_str?: string;
    completed?: boolean;
    messages?: unknown[];
  };
  [key: string]: unknown;
};

export type ComfyUiHistoryResponse = Record<string, ComfyUiHistoryEntry>;

export type ComfyUiStatusSnapshot = {
  enabled: boolean;
  configured: boolean;
  available: boolean | null;
  baseUrl: string;
  imageWorkflowConfigured: boolean;
  videoWorkflowConfigured: boolean;
  message?: string;
  systemStats?: unknown;
};
