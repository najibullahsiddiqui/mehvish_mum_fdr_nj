import { jsonOk, routeError } from "@/lib/api";
import { getRenderStatus } from "@/lib/render/service";

export async function GET() {
  try {
    return jsonOk(await getRenderStatus());
  } catch (error) {
    return routeError(error);
  }
}
