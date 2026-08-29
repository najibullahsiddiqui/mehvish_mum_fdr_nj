import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsService } from "@/lib/random-rooms/service";
import { serializeRandomRoomsCharacterRelationship } from "@/lib/serializers";
import { randomRoomsRelationshipUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsRelationshipUpdateSchema);
    const relationship = await randomRoomsService.updateRelationship(id, data);

    return jsonOk(serializeRandomRoomsCharacterRelationship(relationship), "Character relationship updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const relationship = await randomRoomsService.deactivateRelationship(id);

    return jsonOk(serializeRandomRoomsCharacterRelationship(relationship), "Character relationship deactivated.");
  } catch (error) {
    return routeError(error);
  }
}
