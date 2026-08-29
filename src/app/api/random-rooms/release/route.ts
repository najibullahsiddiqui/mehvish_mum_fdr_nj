import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { getReleaseState, savePublicationDraft } from "@/lib/random-rooms/release-service";

const draftSchema = z.object({
  episodeId: z.string().trim().min(1),
  title: z.string().trim().max(100).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().trim().min(1)).max(60).optional(),
  hashtags: z.array(z.string().trim().min(1)).max(15).optional(),
  privacyStatus: z.enum(["private", "unlisted", "public"]).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const episodeId = new URL(request.url).searchParams.get("episodeId")?.trim();
    if (!episodeId) throw new Error("episodeId is required.");
    return jsonOk(await getReleaseState(episodeId));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, draftSchema);
    return jsonOk(await savePublicationDraft(input), "Release metadata saved.");
  } catch (error) {
    return routeError(error);
  }
}
