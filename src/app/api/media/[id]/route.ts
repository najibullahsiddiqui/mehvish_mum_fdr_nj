import { readFile } from "node:fs/promises";
import { routeError } from "@/lib/api";
import { resolveLocalMediaAsset } from "@/lib/render/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const resolved = await resolveLocalMediaAsset(id);
    const bytes = await readFile(resolved.path);
    return new Response(bytes, {
      headers: {
        "content-type": resolved.asset.mimeType || "application/octet-stream",
        "content-length": String(bytes.length),
        "cache-control": "private, max-age=60",
        "content-disposition": `inline; filename="${resolved.asset.assetType.toLowerCase()}-${resolved.asset.id}.mp4"`,
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
