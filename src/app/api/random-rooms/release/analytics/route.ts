import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { syncYouTubeAnalytics } from "@/lib/random-rooms/release-service";

const schema = z.object({ episodeId: z.string().trim().min(1) });

export async function POST(request: Request) {
  try {
    const { episodeId } = await parseBody(request, schema);
    return jsonOk(await syncYouTubeAnalytics(episodeId), "YouTube analytics synced.");
  } catch (error) {
    return routeError(error);
  }
}
