import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsService } from "@/lib/random-rooms/service";
import { serializeRandomRoomsSeries } from "@/lib/serializers";
import { randomRoomsSeriesCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const series = await randomRoomsService.listSeries();

    return jsonOk(series.map(serializeRandomRoomsSeries));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, randomRoomsSeriesCreateSchema);
    const series = await randomRoomsService.createSeries(data);

    return jsonOk(serializeRandomRoomsSeries(series), "Random Rooms series created.");
  } catch (error) {
    return routeError(error);
  }
}
