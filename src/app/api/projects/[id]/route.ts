import { jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { projectInclude } from "@/lib/project-query";
import { serializeProject } from "@/lib/serializers";
import { projectUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, projectUpdateSchema);

    const project = await prisma.videoProject.update({
      where: { id },
      data,
      include: projectInclude,
    });

    return jsonOk(serializeProject(project), "Project updated.");
  } catch (error) {
    return routeError(error);
  }
}
