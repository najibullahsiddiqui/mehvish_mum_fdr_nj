import { prisma } from "@/lib/prisma";
import { sampleDashboard } from "@/lib/sample-data";
import type { DashboardData } from "@/lib/types";
import { serializeChannel, serializeGenerationLog, serializeIdea, serializeProject, serializeRandomRoomsSeries } from "@/lib/serializers";
import { getProviderStatusSnapshot } from "@/lib/providers/registry";
import { randomRoomsSeriesInclude } from "@/lib/random-rooms/service";

export async function getDashboardData(): Promise<DashboardData> {
  const providerStatus = await getProviderStatusSnapshot({ checkLocalHealth: true });

  try {
    const [channel, ideas, projects, logs, randomRoomsSeries] = await Promise.all([
      prisma.channelProfile.findFirst({
        orderBy: { createdAt: "asc" },
      }),
      prisma.idea.findMany({
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.videoProject.findMany({
        include: {
          researchBriefs: { orderBy: { createdAt: "desc" } },
          scripts: { orderBy: { createdAt: "desc" } },
          thumbnailPacks: { orderBy: { createdAt: "desc" } },
          uploadPacks: { orderBy: { createdAt: "desc" } },
          performanceEntries: { orderBy: { publishDate: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.generationLog.findMany({
        include: {
          project: {
            select: { topic: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.randomRoomsSeries.findMany({
        include: randomRoomsSeriesInclude,
        orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      }),
    ]);

    return {
      channel: channel ? serializeChannel(channel) : null,
      ideas: ideas.map(serializeIdea),
      projects: projects.map(serializeProject),
      logs: logs.map(serializeGenerationLog),
      randomRooms: {
        series: randomRoomsSeries.map(serializeRandomRoomsSeries),
      },
      providerStatus,
      dbAvailable: true,
    };
  } catch (error) {
    console.warn("CreatorPilot is running in sample mode because the database is unavailable.", error);
    return {
      ...sampleDashboard,
      providerStatus,
    };
  }
}
