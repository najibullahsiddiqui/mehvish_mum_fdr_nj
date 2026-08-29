import { runLoggedJsonGeneration } from "@/lib/ai/generation-runner";
import { CREATOR_SYSTEM_PROMPT, buildPerformancePrompt } from "@/lib/ai/prompts";
import { performanceOutputSchema } from "@/lib/ai/schemas";
import { HttpError, jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getProjectOrThrow } from "@/lib/project-query";
import { serializeChannel, serializePerformanceEntry, serializeProject } from "@/lib/serializers";
import { performanceGenerateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, performanceGenerateSchema);
    const publishDate = new Date(input.publishDate);

    if (Number.isNaN(publishDate.getTime())) {
      throw new HttpError("Publish date is invalid.", 422);
    }

    const [projectRecord, channelRecord] = await Promise.all([
      getProjectOrThrow(input.projectId),
      prisma.channelProfile.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);
    const project = serializeProject(projectRecord);
    const channel = channelRecord ? serializeChannel(channelRecord) : null;
    const existingEntry = input.performanceEntryId
      ? await prisma.performanceEntry.findFirst({
          where: {
            id: input.performanceEntryId,
            projectId: project.id,
          },
        })
      : null;

    if (input.performanceEntryId && !existingEntry) {
      throw new HttpError("Performance entry not found.", 404);
    }

    const metrics = existingEntry
      ? {
          publishDate: existingEntry.publishDate.toISOString(),
          views24h: existingEntry.views24h,
          views7d: existingEntry.views7d,
          ctr: existingEntry.ctr,
          avgViewDuration: existingEntry.avgViewDuration,
          subscriberGain: existingEntry.subscriberGain,
          commentsSummary: existingEntry.commentsSummary,
          whatWorked: existingEntry.whatWorked,
          whatFailed: existingEntry.whatFailed,
        }
      : {
          publishDate: input.publishDate,
          views24h: input.views24h,
          views7d: input.views7d,
          ctr: input.ctr,
          avgViewDuration: input.avgViewDuration,
          subscriberGain: input.subscriberGain,
          commentsSummary: input.commentsSummary,
          whatWorked: input.whatWorked,
          whatFailed: input.whatFailed,
        };

    const result = await runLoggedJsonGeneration({
      featureName: "performance_journal",
      projectId: project.id,
      system: CREATOR_SYSTEM_PROMPT,
      prompt: buildPerformancePrompt({
        project,
        channel,
        metrics,
      }),
      schema: performanceOutputSchema,
      maxTokens: 1800,
    });
    const output = result.data;

    const entry = existingEntry
      ? await prisma.performanceEntry.update({
          where: { id: existingEntry.id },
          data: {
            improvementNotes: output.improvementNotes,
            nextVideoIdeas: output.nextVideoIdeas,
          },
        })
      : await prisma.performanceEntry.create({
          data: {
            projectId: project.id,
            publishDate,
            views24h: input.views24h ?? null,
            views7d: input.views7d ?? null,
            ctr: input.ctr ?? null,
            avgViewDuration: input.avgViewDuration ?? null,
            subscriberGain: input.subscriberGain ?? null,
            commentsSummary: input.commentsSummary ?? null,
            whatWorked: input.whatWorked ?? null,
            whatFailed: input.whatFailed ?? null,
            improvementNotes: output.improvementNotes,
            nextVideoIdeas: output.nextVideoIdeas,
          },
        });

    await prisma.videoProject.update({
      where: { id: project.id },
      data: { status: "analyzed" },
    });

    return jsonOk(serializePerformanceEntry(entry), "Performance notes generated.");
  } catch (error) {
    return routeError(error);
  }
}
