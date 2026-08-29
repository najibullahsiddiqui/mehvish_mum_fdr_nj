import { jsonOk, routeError } from "@/lib/api";
import { getProviderStatusSnapshot } from "@/lib/providers/registry";

export async function GET() {
  try {
    const status = await getProviderStatusSnapshot({ checkLocalHealth: true });
    return jsonOk(status);
  } catch (error) {
    return routeError(error);
  }
}
