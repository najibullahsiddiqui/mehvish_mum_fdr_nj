import type { Prisma } from "@/generated/prisma/client";
import { runLoggedJsonGeneration } from "@/lib/ai/generation-runner";
import { CREATOR_SYSTEM_PROMPT, buildUploadPackPrompt } from "@/lib/ai/prompts";
import { uploadPackOutputSchema } from "@/lib/ai/schemas";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getProjectOrThrow } from "@/lib/project-query";
import { serializeChannel, serializeProject, serializeUploadPack } from "@/lib/serializers";
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
      featureName: "upload_pack",
      projectId: project.id,
      system: CREATOR_SYSTEM_PROMPT,
      prompt: buildUploadPackPrompt({ project, channel, notes: input.notes }),
      schema: uploadPackOutputSchema,
      maxTokens: 3600,
    });
    const output = result.data;

    const pack = await prisma.uploadPack.create({
      data: {
        projectId: project.id,
        titleOptions: output.titleOptions,
        finalTitle: output.finalTitle,
        description: output.description,
        tags: output.tags,
        hashtags: output.hashtags,
        chapters: output.chapters,
        pinnedComment: output.pinnedComment,
        communityPost: output.communityPost,
        shortsCutdownIdeas: output.shortsCutdownIdeas,
        uploadChecklist: output.uploadChecklist,
        rawOutput: output as Prisma.InputJsonValue,
      },
    });

    await prisma.videoProject.update({
      where: { id: project.id },
      data: { status: "upload_pack" },
    });

    return jsonOk(serializeUploadPack(pack), "Upload pack generated.");
  } catch (error) {
    return routeError(error);
  }
}
