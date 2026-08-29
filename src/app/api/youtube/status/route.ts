import { jsonOk } from "@/lib/api";
import { publicYouTubeStatus } from "@/lib/youtube/config";

export async function GET() {
  return jsonOk(publicYouTubeStatus());
}
