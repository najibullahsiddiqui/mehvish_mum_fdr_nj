import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { submitShotVideoJob } from "@/lib/random-rooms/production-service";

const submitSchema = z.object({
  shotId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, submitSchema);
    return jsonOk(await submitShotVideoJob(body.shotId), "RunPod video job submitted.");
  } catch (error) {
    return routeError(error);
  }
}
