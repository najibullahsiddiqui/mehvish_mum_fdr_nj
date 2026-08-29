import { HttpError, jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { buildProjectCreateData } from "@/lib/project-create";
import { projectInclude } from "@/lib/project-query";
import { serializeProject } from "@/lib/serializers";
import { projectCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const projects = await prisma.videoProject.findMany({
      include: projectInclude,
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk(projects.map(serializeProject));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, projectCreateSchema);
    let idea:
      | {
          id: string;
          idea: string;
          pillar: string;
          videoType: string;
          notes: string | null;
        }
      | null = null;

    if (data.ideaId) {
      idea = await prisma.idea.findUnique({
        where: { id: data.ideaId },
        select: { id: true, idea: true, pillar: true, videoType: true, notes: true },
      });

      if (!idea) {
        throw new HttpError("Idea not found.", 404);
      }

      const existingProject = await prisma.videoProject.findUnique({
        where: { ideaId: idea.id },
        include: projectInclude,
      });

      if (existingProject) {
        return jsonOk(serializeProject(existingProject), "Project already exists for this idea.");
      }
    }

    const project = await prisma.videoProject.create({
      data: buildProjectCreateData(data, idea),
      include: projectInclude,
    });

    if (idea) {
      await prisma.idea.update({
        where: { id: idea.id },
        data: { status: "researching" },
      });
    }

    return jsonOk(serializeProject(project), "Project created.");
  } catch (error) {
    return routeError(error);
  }
}
