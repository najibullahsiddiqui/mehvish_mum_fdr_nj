import { jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/serializers";
import { ideaCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const ideas = await prisma.idea.findMany({
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    });

    return jsonOk(ideas.map(serializeIdea));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, ideaCreateSchema);
    const idea = await prisma.idea.create({ data });

    return jsonOk(serializeIdea(idea), "Idea added.");
  } catch (error) {
    return routeError(error);
  }
}
