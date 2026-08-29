import { HttpError, jsonOk, routeError } from "@/lib/api";
import { listProductionState } from "@/lib/random-rooms/production-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const seriesId = url.searchParams.get("seriesId")?.trim();
    if (!seriesId) throw new HttpError("seriesId is required.", 400);
    return jsonOk(await listProductionState(seriesId));
  } catch (error) {
    return routeError(error);
  }
}
