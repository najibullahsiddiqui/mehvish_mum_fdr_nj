import { jsonOk, routeError } from "@/lib/api";
import { getLocalTtsConfig } from "@/lib/tts/config";

export async function GET() {
  try {
    const config = getLocalTtsConfig();
    return jsonOk({
      enabled: config.enabled,
      configured: true,
      local: true,
      provider: "local-tts",
      model: config.model,
      defaultVoice: config.defaultVoice,
      baseUrl: config.baseUrl,
    });
  } catch (error) {
    return routeError(error);
  }
}
