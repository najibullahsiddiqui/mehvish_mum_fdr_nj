import { ProviderResponseError, ProviderTimeoutError, ProviderUnavailableError } from "@/lib/providers/errors";
import { assertLocalTtsEnabled, type LocalTtsConfig } from "@/lib/tts/config";

export class LocalTtsClient {
  constructor(private readonly config: LocalTtsConfig, private readonly fetchImpl: typeof fetch = fetch) {}

  async synthesize(options: { text: string; voice?: string | null; speed?: number; format?: "wav" | "mp3" }) {
    assertLocalTtsEnabled(this.config);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.config.baseUrl}${this.config.speechPath}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          input: options.text,
          voice: options.voice || this.config.defaultVoice,
          speed: options.speed ?? 1,
          response_format: options.format ?? "wav",
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ProviderResponseError(`Local TTS returned ${response.status}.`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new ProviderResponseError("Local TTS returned an empty audio response.");
      return {
        bytes,
        mimeType: response.headers.get("content-type")?.split(";")[0] || "audio/wav",
        model: this.config.model,
        voice: options.voice || this.config.defaultVoice,
      };
    } catch (error) {
      if (error instanceof ProviderResponseError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new ProviderTimeoutError("Local TTS request timed out.");
      throw new ProviderUnavailableError(error instanceof Error ? error.message : "Local TTS is unavailable.");
    } finally {
      clearTimeout(timer);
    }
  }
}
