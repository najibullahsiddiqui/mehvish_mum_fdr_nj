import { ProviderResponseError } from "@/lib/providers/errors";

const JSON_ERROR_MESSAGE = "The AI response was not valid JSON. Try again or simplify the prompt.";

export function parseJsonFromText<T>(text: string): T {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim()) as T;
      } catch {
        throw new ProviderResponseError(JSON_ERROR_MESSAGE);
      }
    }

    const firstObject = trimmed.indexOf("{");
    const lastObject = trimmed.lastIndexOf("}");
    if (firstObject !== -1 && lastObject !== -1 && lastObject > firstObject) {
      try {
        return JSON.parse(trimmed.slice(firstObject, lastObject + 1)) as T;
      } catch {
        throw new ProviderResponseError(JSON_ERROR_MESSAGE);
      }
    }

    throw new ProviderResponseError(JSON_ERROR_MESSAGE);
  }
}
