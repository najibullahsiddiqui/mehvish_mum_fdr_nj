import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { reviewFinalVideo } from "@/lib/random-rooms/pipeline-service";

const schema = z.object({
  assetId: z.string().trim().min(1),
  decision: z.enum(["approve", "reject"]),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    return jsonOk(await reviewFinalVideo(body.assetId, body.decision), `Final video ${body.decision}d.`);
  } catch (error) {
    return routeError(error);
  }
}
