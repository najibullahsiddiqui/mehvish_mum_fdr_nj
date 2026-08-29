import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsService } from "@/lib/random-rooms/service";
import { serializeRandomRoomsCharacter } from "@/lib/serializers";
import { randomRoomsCharacterCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const seriesId = new URL(request.url).searchParams.get("seriesId") || undefined;
    const characters = await randomRoomsService.listCharacters(seriesId);

    return jsonOk(characters.map(serializeRandomRoomsCharacter));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, randomRoomsCharacterCreateSchema);
    const character = await randomRoomsService.createCharacter(data);

    return jsonOk(serializeRandomRoomsCharacter(character), "Character created.");
  } catch (error) {
    return routeError(error);
  }
}
