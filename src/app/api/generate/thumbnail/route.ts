import type { Prisma } from "@/generated/prisma/client";
import { runLoggedJsonGeneration } from "@/lib/ai/generation-runner";
import { CREATOR_SYSTEM_PROMPT, buildThumbnailPrompt } from "@/lib/ai/prompts";
import { thumbnailOutputSchema } from "@/lib/ai/schemas";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getProjectOrThrow } from "@/lib/project-query";
import { serializeChannel, serializeProject, serializeThumbnailPack } from "@/lib/serializers";
import { projectGenerationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, projectGenerationSchema);
    const [projectRecord, channelRecord] = await Promise.all([
      getProjectOrThrow(input.projectId),
      prisma.channelProfile.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);
    const project = serializeProject(projectRecord);
    const channel = channelRecord ? serializeChannel(channelRecord) : null;

    const result = await runLoggedJsonGeneration({
      featureName: "thumbnail_lab",
      projectId: project.id,
      system: CREATOR_SYSTEM_PROMPT,
      prompt: buildThumbnailPrompt({ project, channel, notes: input.notes }),
      schema: thumbnailOutputSchema,
      maxTokens: 2600,
    });
    const output = result.data;

    const pack = await prisma.thumbnailPack.create({
      data: {
        projectId: project.id,
        textOptions: output.textOptions,
        visualConcepts: output.visualConcepts,
        emotionAngle: output.emotionAngle,
        imageGenerationPrompts: output.imageGenerationPrompts,
        canvaInstructions: output.canvaInstructions,
        photoshopInstructions: output.photoshopInstructions,
        rawOutput: output as Prisma.InputJsonValue,
      },
    });

    await prisma.videoProject.update({
      where: { id: project.id },
      data: { status: "thumbnail" },
    });

    return jsonOk(serializeThumbnailPack(pack), "Thumbnail pack generated.");
  } catch (error) {
    return routeError(error);
  }
}
