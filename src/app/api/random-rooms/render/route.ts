import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { renderEpisode } from "@/lib/render/service";

const schema = z.object({ episodeId: z.string().trim().min(1) });

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    return jsonOk(await renderEpisode(body.episodeId), "Final episode video rendered.");
  } catch (error) {
    return routeError(error);
  }
}
