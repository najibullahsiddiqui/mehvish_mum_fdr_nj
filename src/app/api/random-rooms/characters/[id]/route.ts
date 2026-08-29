import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsService } from "@/lib/random-rooms/service";
import { serializeRandomRoomsCharacter } from "@/lib/serializers";
import { randomRoomsCharacterUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsCharacterUpdateSchema);
    const character = await randomRoomsService.updateCharacter(id, data);

    return jsonOk(serializeRandomRoomsCharacter(character), "Character updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const character = await randomRoomsService.deactivateCharacter(id);

    return jsonOk(serializeRandomRoomsCharacter(character), "Character deactivated.");
  } catch (error) {
    return routeError(error);
  }
}
