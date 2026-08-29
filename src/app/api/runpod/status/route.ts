import { jsonOk, routeError } from "@/lib/api";
import { getRunPodStatusSnapshot } from "@/lib/random-rooms/production-service";

export async function GET() {
  try {
    return jsonOk(await getRunPodStatusSnapshot(true));
  } catch (error) {
    return routeError(error);
  }
}
