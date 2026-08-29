import { HttpError, jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getProjectOrThrow } from "@/lib/project-query";
import { serializePerformanceEntry } from "@/lib/serializers";
import { performanceSaveSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, performanceSaveSchema);
    const publishDate = new Date(input.publishDate);

    if (Number.isNaN(publishDate.getTime())) {
      throw new HttpError("Publish date is invalid.", 422);
    }

    await getProjectOrThrow(input.projectId);

    const entry = await prisma.performanceEntry.create({
      data: {
        projectId: input.projectId,
        publishDate,
        views24h: input.views24h ?? null,
        views7d: input.views7d ?? null,
        ctr: input.ctr ?? null,
        avgViewDuration: input.avgViewDuration ?? null,
        subscriberGain: input.subscriberGain ?? null,
        commentsSummary: input.commentsSummary ?? null,
        whatWorked: input.whatWorked ?? null,
        whatFailed: input.whatFailed ?? null,
        improvementNotes: [],
        nextVideoIdeas: [],
      },
    });

    await prisma.videoProject.update({
      where: { id: input.projectId },
      data: { status: "uploaded" },
    });

    return jsonOk(serializePerformanceEntry(entry), "Performance metrics saved.");
  } catch (error) {
    return routeError(error);
  }
}
