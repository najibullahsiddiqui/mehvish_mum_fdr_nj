import type { Prisma } from "@/generated/prisma/client";
import { runLoggedJsonGeneration } from "@/lib/ai/generation-runner";
import { CREATOR_SYSTEM_PROMPT, buildScriptPrompt } from "@/lib/ai/prompts";
import { scriptOutputSchema, type ScriptOutput } from "@/lib/ai/schemas";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getProjectOrThrow } from "@/lib/project-query";
import { serializeChannel, serializeProject, serializeScriptVersion } from "@/lib/serializers";
import { scriptGenerateSchema } from "@/lib/validation";

function sectionsToBody(output: ScriptOutput) {
  return output.sections
    .map((section) => {
      const example = section.example ? `\n\nExample: ${section.example}` : "";
      return `## ${section.heading}\n\n${section.narration}${example}`;
    })
    .join("\n\n");
}

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, scriptGenerateSchema);
    const [projectRecord, channelRecord] = await Promise.all([
      getProjectOrThrow(input.projectId),
      prisma.channelProfile.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);
    const project = serializeProject(projectRecord);
    const channel = channelRecord ? serializeChannel(channelRecord) : null;

    const result = await runLoggedJsonGeneration({
      featureName: "script_studio",
      projectId: project.id,
      system: CREATOR_SYSTEM_PROMPT,
      prompt: buildScriptPrompt({
        project,
        channel,
        scriptType: input.scriptType,
        notes: input.notes,
      }),
      schema: scriptOutputSchema,
      maxTokens: 5000,
    });
    const output = result.data;

    const script = await prisma.scriptVersion.create({
      data: {
        projectId: project.id,
        scriptType: input.scriptType,
        versionName: input.versionName,
        hook: output.hook,
        intro: output.intro,
        body: sectionsToBody(output),
        cta: output.cta,
        outro: output.outro,
        visualNotes: output.visualNotes,
        onScreenText: output.onScreenText,
        contentMarkdown: output.markdown,
        structuredOutput: output as Prisma.InputJsonValue,
      },
    });

    await prisma.videoProject.update({
      where: { id: project.id },
      data: { status: "scripting" },
    });

    if (project.ideaId) {
      await prisma.idea.update({
        where: { id: project.ideaId },
        data: { status: "script_ready" },
      });
    }

    return jsonOk(serializeScriptVersion(script), "Script version saved.");
  } catch (error) {
    return routeError(error);
  }
}
