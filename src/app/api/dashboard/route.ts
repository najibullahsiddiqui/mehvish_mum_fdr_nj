import { getDashboardData } from "@/lib/dashboard-data";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const data = await getDashboardData();
  return jsonOk(data);
}
