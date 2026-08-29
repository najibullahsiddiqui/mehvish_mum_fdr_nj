import { HttpError, jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/serializers";
import { ideaUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, ideaUpdateSchema);

    const idea = await prisma.idea.update({
      where: { id },
      data,
    });

    return jsonOk(serializeIdea(idea), "Idea updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existingProject = await prisma.videoProject.findUnique({
      where: { ideaId: id },
      select: { id: true },
    });

    if (existingProject) {
      throw new HttpError("This idea already has a project. Archive or edit the project before deleting the idea.", 409);
    }

    await prisma.idea.delete({
      where: { id },
    });

    return jsonOk({ id }, "Idea deleted.");
  } catch (error) {
    return routeError(error);
  }
}
