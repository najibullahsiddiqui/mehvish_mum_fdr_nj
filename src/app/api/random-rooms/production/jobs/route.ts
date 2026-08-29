import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { submitShotImageJob, submitShotVideoJob } from "@/lib/random-rooms/production-service";

const submitSchema = z.object({
  shotId: z.string().trim().min(1),
  kind: z.enum(["image", "video"]).default("video"),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, submitSchema);
    if (body.kind === "image") {
      return jsonOk(await submitShotImageJob(body.shotId), "RunPod image job submitted.");
    }
    return jsonOk(await submitShotVideoJob(body.shotId), "RunPod video job submitted.");
  } catch (error) {
    return routeError(error);
  }
}
