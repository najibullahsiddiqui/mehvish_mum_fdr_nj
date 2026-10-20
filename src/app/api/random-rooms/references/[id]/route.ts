import { z } from "zod";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { deleteReferenceAsset, setPrimaryReference } from "@/lib/random-rooms/reference-service";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({ isPrimary: z.literal(true) });

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await parseBody(request, patchSchema);
    return jsonOk(await setPrimaryReference(id), "Primary reference updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return jsonOk(await deleteReferenceAsset(id), "Reference removed.");
  } catch (error) {
    return routeError(error);
  }
}
