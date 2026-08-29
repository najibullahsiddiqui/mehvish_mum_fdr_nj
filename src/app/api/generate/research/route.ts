import type { Prisma } from "@/generated/prisma/client";
import { runLoggedJsonGeneration } from "@/lib/ai/generation-runner";
import { CREATOR_SYSTEM_PROMPT, buildResearchPrompt } from "@/lib/ai/prompts";
import { researchOutputSchema } from "@/lib/ai/schemas";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getProjectOrThrow, projectInclude } from "@/lib/project-query";
import { serializeChannel, serializeProject, serializeResearchBrief } from "@/lib/serializers";
import { researchGenerateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, researchGenerateSchema);
    const [projectRecord, channelRecord] = await Promise.all([
      getProjectOrThrow(input.projectId),
      prisma.channelProfile.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);
    const project = serializeProject(projectRecord);
    const channel = channelRecord ? serializeChannel(channelRecord) : null;

    const result = await runLoggedJsonGeneration({
      featureName: "research_desk",
      projectId: project.id,
      system: CREATOR_SYSTEM_PROMPT,
      prompt: buildResearchPrompt({
        topic: project.topic,
        channel,
        notes: input.notes,
        referenceLinks: input.referenceLinks,
      }),
      schema: researchOutputSchema,
      maxTokens: 2600,
    });
    const output = result.data;

    const brief = await prisma.researchBrief.create({
      data: {
        projectId: project.id,
        topic: project.topic,
        referenceLinks: input.referenceLinks,
        viewerPain: output.viewerPain,
        videoPromise: output.videoPromise,
        mainPoints: output.mainPoints,
        examples: output.examples,
        commonMistakes: output.commonMistakes,
        contrarianAngle: output.contrarianAngle,
        hookAngles: output.hookAngles,
        titleAngles: output.titleAngles,
        rawOutput: output as Prisma.InputJsonValue,
      },
    });

    await prisma.videoProject.update({
      where: { id: project.id },
      data: { status: "researching" },
      include: projectInclude,
    });

    return jsonOk(serializeResearchBrief(brief), "Research brief generated.");
  } catch (error) {
    return routeError(error);
  }
}
