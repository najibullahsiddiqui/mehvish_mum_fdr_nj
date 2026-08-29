export const CHARACTER_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,23}$/;

export function normalizeCharacterCode(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeRoomCode(value: string) {
  return normalizeCharacterCode(value);
}

export function normalizeEpisodeCode(value: string) {
  return normalizeCharacterCode(value);
}

export function episodeCodeFromNumber(episodeNumber: number) {
  return `RR_EP_${String(episodeNumber).padStart(4, "0")}`;
}

export function normalizeRandomRoomsSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deriveRandomRoomsSlug(value: string) {
  return normalizeRandomRoomsSlug(value) || "random-rooms";
}

export function normalizeRelationshipPair(characterAId: string, characterBId: string) {
  return [characterAId, characterBId].sort();
}

export function relationshipPairKey(characterAId: string, characterBId: string) {
  return normalizeRelationshipPair(characterAId, characterBId).join("__");
}
