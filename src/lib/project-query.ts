import { HttpError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const projectInclude = {
  researchBriefs: { orderBy: { createdAt: "desc" } },
  scripts: { orderBy: { createdAt: "desc" } },
  thumbnailPacks: { orderBy: { createdAt: "desc" } },
  uploadPacks: { orderBy: { createdAt: "desc" } },
  performanceEntries: { orderBy: { publishDate: "desc" } },
} as const;

export async function getProjectOrThrow(projectId: string) {
  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
    include: projectInclude,
  });

  if (!project) {
    throw new HttpError("Project not found.", 404);
  }

  return project;
}
