import { getProjectOrThrow } from "@/lib/project-query";
import { routeError } from "@/lib/api";
import { projectExportFilename, renderProjectMarkdown } from "@/lib/project-export";
import { serializeProject } from "@/lib/serializers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = serializeProject(await getProjectOrThrow(id));
    const filename = projectExportFilename(project.topic);

    return new Response(renderProjectMarkdown(project), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
