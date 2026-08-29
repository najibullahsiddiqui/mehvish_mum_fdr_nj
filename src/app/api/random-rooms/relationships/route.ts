import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsService } from "@/lib/random-rooms/service";
import { serializeRandomRoomsCharacterRelationship } from "@/lib/serializers";
import { randomRoomsRelationshipCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const seriesId = new URL(request.url).searchParams.get("seriesId") || undefined;
    const relationships = await randomRoomsService.listRelationships(seriesId);

    return jsonOk(relationships.map(serializeRandomRoomsCharacterRelationship));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, randomRoomsRelationshipCreateSchema);
    const relationship = await randomRoomsService.createRelationship(data);

    return jsonOk(serializeRandomRoomsCharacterRelationship(relationship), "Character relationship created.");
  } catch (error) {
    return routeError(error);
  }
}
