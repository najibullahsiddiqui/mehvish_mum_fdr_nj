import { HttpError, jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsEpisode } from "@/lib/serializers";
import { RANDOM_ROOMS_EPISODE_STATUSES, type RandomRoomsEpisodeStatus } from "@/lib/types";
import { randomRoomsEpisodeCreateSchema } from "@/lib/validation";

function statusFilter(value: string | null) {
  if (value === null) {
    return undefined;
  }

  if (!RANDOM_ROOMS_EPISODE_STATUSES.includes(value as RandomRoomsEpisodeStatus)) {
    throw new HttpError("Use a valid episode status.", 422);
  }

  return value;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const episodes = await randomRoomsPlanningService.listEpisodes({
      seriesId: params.get("seriesId") || undefined,
      status: statusFilter(params.get("status")),
    });

    return jsonOk(episodes.map(serializeRandomRoomsEpisode));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, randomRoomsEpisodeCreateSchema);
    const episode = await randomRoomsPlanningService.createEpisode(data);

    return jsonOk(serializeRandomRoomsEpisode(episode), "Episode created.");
  } catch (error) {
    return routeError(error);
  }
}
