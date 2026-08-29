import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { synthesizeDialogueVoice } from "@/lib/random-rooms/production-service";

const schema = z.object({ dialogueLineId: z.string().trim().min(1) });

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    return jsonOk(await synthesizeDialogueVoice(body.dialogueLineId), "Voice asset generated.");
  } catch (error) {
    return routeError(error);
  }
}
