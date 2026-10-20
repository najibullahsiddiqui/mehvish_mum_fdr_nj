import { jsonOk, routeError } from "@/lib/api";
import { listReferenceAssets, uploadReferenceAsset } from "@/lib/random-rooms/reference-service";

function parseOwner(request: Request) {
  const url = new URL(request.url);
  const ownerType = url.searchParams.get("ownerType");
  const ownerId = url.searchParams.get("ownerId");
  if ((ownerType !== "character" && ownerType !== "room") || !ownerId) {
    throw new Error("ownerType=character|room and ownerId are required.");
  }
  return { ownerType, ownerId } as const;
}

export async function GET(request: Request) {
  try {
    return jsonOk(await listReferenceAssets(parseOwner(request)));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const ownerType = form.get("ownerType");
    const ownerId = form.get("ownerId");
    const file = form.get("file");
    if ((ownerType !== "character" && ownerType !== "room") || typeof ownerId !== "string" || !(file instanceof File)) {
      throw new Error("ownerType, ownerId, and image file are required.");
    }
    return jsonOk(await uploadReferenceAsset({ ownerType, ownerId, file }), "Reference image uploaded.");
  } catch (error) {
    return routeError(error);
  }
}
