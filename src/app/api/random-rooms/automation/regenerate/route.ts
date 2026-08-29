import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { regenerateProductionTarget } from "@/lib/random-rooms/pipeline-service";

const schema = z.object({
  stage: z.enum(["voice", "image", "video", "render"]),
  targetId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    return jsonOk(await regenerateProductionTarget(body), `${body.stage} regeneration started.`);
  } catch (error) {
    return routeError(error);
  }
}
