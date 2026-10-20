import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/lib/api";
import { ensureSeriesMediaDirectory, safeMediaSegment } from "@/lib/media/storage";
import { prisma } from "@/lib/prisma";

const MAX_REFERENCE_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
]);

export type ReferenceOwner =
  | { ownerType: "character"; ownerId: string }
  | { ownerType: "room"; ownerId: string };

async function ownerContext(owner: ReferenceOwner) {
  if (owner.ownerType === "character") {
    const character = await prisma.character.findUnique({
      where: { id: owner.ownerId },
      include: { series: true },
    });
    if (!character) throw new HttpError("Character not found.", 404);
    return {
      seriesId: character.seriesId,
      seriesSlug: character.series.slug,
      code: character.code,
      assetType: "CHARACTER_REFERENCE",
      characterId: character.id,
      roomId: null,
    };
  }

  const room = await prisma.roomProfile.findUnique({
    where: { id: owner.ownerId },
    include: { series: true },
  });
  if (!room) throw new HttpError("Room not found.", 404);
  return {
    seriesId: room.seriesId,
    seriesSlug: room.series.slug,
    code: room.code,
    assetType: "ROOM_REFERENCE",
    characterId: null,
    roomId: room.id,
  };
}

export async function listReferenceAssets(owner: ReferenceOwner) {
  const context = await ownerContext(owner);
  return prisma.mediaAsset.findMany({
    where: {
      assetType: context.assetType,
      characterId: context.characterId || undefined,
      roomId: context.roomId || undefined,
      status: { not: "SUPERSEDED" },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

export async function uploadReferenceAsset(input: ReferenceOwner & { file: File }) {
  const context = await ownerContext(input);
  const extension = IMAGE_TYPES.get(input.file.type);
  if (!extension) throw new HttpError("Reference image must be PNG, JPEG, or WebP.", 422);
  if (input.file.size <= 0 || input.file.size > MAX_REFERENCE_BYTES) {
    throw new HttpError("Reference image must be between 1 byte and 12 MB.", 422);
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const duplicate = await prisma.mediaAsset.findFirst({
    where: {
      assetType: context.assetType,
      checksum,
      characterId: context.characterId || undefined,
      roomId: context.roomId || undefined,
      status: { not: "SUPERSEDED" },
    },
  });
  if (duplicate) return duplicate;

  const directory = await ensureSeriesMediaDirectory(
    context.seriesSlug,
    context.assetType === "CHARACTER_REFERENCE" ? "character-references" : "room-references",
  );
  await mkdir(directory, { recursive: true });
  const filename = `${safeMediaSegment(context.code)}-${checksum.slice(0, 12)}${extension}`;
  const localPath = path.join(directory, filename);
  await writeFile(localPath, bytes);

  const existingPrimary = await prisma.mediaAsset.findFirst({
    where: {
      assetType: context.assetType,
      characterId: context.characterId || undefined,
      roomId: context.roomId || undefined,
      isPrimary: true,
      status: { in: ["READY", "APPROVED"] },
    },
  });

  return prisma.mediaAsset.create({
    data: {
      seriesId: context.seriesId,
      characterId: context.characterId,
      roomId: context.roomId,
      assetType: context.assetType,
      status: "APPROVED",
      isPrimary: !existingPrimary,
      provider: "upload",
      localPath,
      mimeType: input.file.type,
      checksum,
      metadata: {
        originalFilename: input.file.name,
        bytes: input.file.size,
      },
    },
  });
}

export async function setPrimaryReference(assetId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset || !["CHARACTER_REFERENCE", "ROOM_REFERENCE"].includes(asset.assetType)) {
    throw new HttpError("Reference asset not found.", 404);
  }
  if (!asset.characterId && !asset.roomId) throw new HttpError("Reference asset has no owner.", 422);

  const whereOwner =
    asset.assetType === "CHARACTER_REFERENCE"
      ? { characterId: asset.characterId || undefined, assetType: asset.assetType }
      : { roomId: asset.roomId || undefined, assetType: asset.assetType };

  await prisma.$transaction([
    prisma.mediaAsset.updateMany({
      where: { ...whereOwner, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { isPrimary: true, status: "APPROVED" },
    }),
  ]);

  return prisma.mediaAsset.findUnique({ where: { id: asset.id } });
}

export async function deleteReferenceAsset(assetId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset || !["CHARACTER_REFERENCE", "ROOM_REFERENCE"].includes(asset.assetType)) {
    throw new HttpError("Reference asset not found.", 404);
  }
  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { status: "SUPERSEDED", isPrimary: false },
  });

  if (asset.isPrimary) {
    const next = await prisma.mediaAsset.findFirst({
      where: {
        assetType: asset.assetType,
        characterId: asset.characterId || undefined,
        roomId: asset.roomId || undefined,
        status: { in: ["READY", "APPROVED"] },
        id: { not: asset.id },
      },
      orderBy: { createdAt: "desc" },
    });
    if (next) await prisma.mediaAsset.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  return { id: asset.id };
}
