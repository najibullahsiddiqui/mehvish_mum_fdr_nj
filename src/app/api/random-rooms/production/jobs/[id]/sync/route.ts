import { jsonOk, routeError } from "@/lib/api";
import { syncGenerationJob } from "@/lib/random-rooms/production-service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return jsonOk(await syncGenerationJob(id), "Generation job synced.");
  } catch (error) {
    return routeError(error);
  }
}
