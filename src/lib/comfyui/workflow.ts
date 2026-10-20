import { readFile } from "node:fs/promises";
import path from "node:path";
import { ProviderConfigurationError } from "@/lib/providers/errors";

export type WorkflowVariables = Record<string, string | number | boolean | null>;

function replaceValue(value: unknown, variables: WorkflowVariables): unknown {
  if (Array.isArray(value)) return value.map((entry) => replaceValue(entry, variables));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, replaceValue(entry, variables)]),
    );
  }
  if (typeof value !== "string") return value;

  const exact = value.match(/^\{\{([A-Z0-9_]+)\}\}$/);
  if (exact) {
    const key = exact[1];
    if (!(key in variables)) throw new ProviderConfigurationError(`Missing ComfyUI workflow variable: ${key}.`);
    return variables[key];
  }

  return value.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => {
    if (!(key in variables)) throw new ProviderConfigurationError(`Missing ComfyUI workflow variable: ${key}.`);
    return String(variables[key] ?? "");
  });
}

function unresolvedPlaceholders(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (entry: unknown) => {
    if (Array.isArray(entry)) return entry.forEach(visit);
    if (entry && typeof entry === "object") return Object.values(entry as Record<string, unknown>).forEach(visit);
    if (typeof entry === "string") {
      for (const match of entry.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) found.add(match[1]);
    }
  };
  visit(value);
  return [...found];
}

export async function loadComfyUiWorkflow(
  workflowPath: string | null,
  variables: WorkflowVariables,
): Promise<Record<string, unknown>> {
  if (!workflowPath) throw new ProviderConfigurationError("ComfyUI workflow path is not configured.");
  const resolved = path.resolve(process.cwd(), workflowPath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(resolved, "utf8"));
  } catch (error) {
    throw new ProviderConfigurationError(
      `Could not load ComfyUI API workflow at ${workflowPath}: ${error instanceof Error ? error.message : "invalid file"}`,
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ProviderConfigurationError("ComfyUI workflow must be an API-format JSON object.");
  }

  const hydrated = replaceValue(parsed, variables) as Record<string, unknown>;
  const unresolved = unresolvedPlaceholders(hydrated);
  if (unresolved.length) {
    throw new ProviderConfigurationError(`Unresolved ComfyUI workflow variables: ${unresolved.join(", ")}.`);
  }
  return hydrated;
}
