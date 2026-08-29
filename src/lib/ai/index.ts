import { getLLMProvider } from "@/lib/providers/registry";

export function getAIProvider() {
  return getLLMProvider();
}

export { getLLMProvider };
