import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsService } from "@/lib/random-rooms/service";
import { serializeRandomRoomsSeries } from "@/lib/serializers";
import { randomRoomsSeriesUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsSeriesUpdateSchema);
    const series = await randomRoomsService.updateSeries(id, data);

    return jsonOk(serializeRandomRoomsSeries(series), "Random Rooms series updated.");
  } catch (error) {
    return routeError(error);
  }
}
