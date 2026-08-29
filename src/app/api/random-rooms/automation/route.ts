import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { advanceEpisodePipeline, getEpisodePipelineState } from "@/lib/random-rooms/pipeline-service";

const bodySchema = z.object({ episodeId: z.string().trim().min(1) });

export async function GET(request: Request) {
  try {
    const episodeId = new URL(request.url).searchParams.get("episodeId")?.trim();
    if (!episodeId) throw new Error("episodeId is required.");
    return jsonOk(await getEpisodePipelineState(episodeId));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { episodeId } = await parseBody(request, bodySchema);
    return jsonOk(await advanceEpisodePipeline(episodeId), "Episode pipeline advanced.");
  } catch (error) {
    return routeError(error);
  }
}
