import { jsonOk, parseBody, routeError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeChannel } from "@/lib/serializers";
import { channelSchema } from "@/lib/validation";

export async function GET() {
  try {
    const channel = await prisma.channelProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });

    return jsonOk(channel ? serializeChannel(channel) : null);
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await parseBody(request, channelSchema);
    const existing = await prisma.channelProfile.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const channel = existing
      ? await prisma.channelProfile.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.channelProfile.create({
          data,
        });

    return jsonOk(serializeChannel(channel), "Channel brain saved.");
  } catch (error) {
    return routeError(error);
  }
}
