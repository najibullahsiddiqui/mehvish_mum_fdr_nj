import { z } from "zod";
import type { RandomRoomsEpisode } from "@/lib/types";

const manifestCharacterSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  roleInEpisode: z.string(),
});

const manifestRoomSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  roomType: z.string(),
});

const manifestShotSchema = z.object({
  id: z.string(),
  shotNumber: z.number().int(),
  shotType: z.string(),
  cameraFraming: z.string(),
  cameraMovement: z.string(),
  actionDescription: z.string(),
  visualDescription: z.string(),
  imagePrompt: z.string(),
  videoPrompt: z.string(),
  durationSec: z.number().int(),
  emotion: z.string(),
  continuityNotes: z.string().nullable(),
});

const manifestDialogueSchema = z.object({
  id: z.string(),
  lineNumber: z.number().int(),
  shotId: z.string().nullable(),
  characterCode: z.string(),
  characterName: z.string(),
  text: z.string(),
  emotion: z.string().nullable(),
  deliveryStyle: z.string().nullable(),
  captionText: z.string(),
  startOffsetMs: z.number().int().nullable(),
  durationEstimateMs: z.number().int().nullable(),
});

export const productionManifestSchema = z.object({
  episode: z.object({
    id: z.string(),
    code: z.string(),
    episodeNumber: z.number().int(),
    title: z.string(),
    premise: z.string(),
    hook: z.string(),
    comedyAngle: z.string(),
    targetDurationSec: z.number().int(),
    targetAspectRatio: z.string(),
    language: z.string(),
    status: z.string(),
    plannedDurationSec: z.number().int(),
    durationSource: z.enum(["shots", "scenes", "none"]),
  }),
  characters: z.array(manifestCharacterSchema),
  rooms: z.array(manifestRoomSchema),
  scenes: z.array(
    z.object({
      scene: z.object({
        id: z.string(),
        sceneNumber: z.number().int(),
        title: z.string(),
        summary: z.string(),
        purpose: z.string(),
        beat: z.string(),
        roomCode: z.string().nullable(),
        durationSec: z.number().int(),
        status: z.string(),
      }),
      shots: z.array(manifestShotSchema),
      dialogue: z.array(manifestDialogueSchema),
    }),
  ),
});

export type ProductionManifest = z.infer<typeof productionManifestSchema>;

export function calculateEpisodeDuration(episode: Pick<RandomRoomsEpisode, "scenes">) {
  const shotDuration = episode.scenes.reduce(
    (total, scene) => total + scene.shots.reduce((sceneTotal, shot) => sceneTotal + shot.durationSec, 0),
    0,
  );

  if (shotDuration > 0) {
    return {
      durationSec: shotDuration,
      source: "shots" as const,
    };
  }

  const sceneDuration = episode.scenes.reduce((total, scene) => total + scene.durationSec, 0);

  if (sceneDuration > 0) {
    return {
      durationSec: sceneDuration,
      source: "scenes" as const,
    };
  }

  return {
    durationSec: 0,
    source: "none" as const,
  };
}

export function buildEpisodeReview(episode: Pick<RandomRoomsEpisode, "targetDurationSec" | "characterAssignments" | "scenes">) {
  const duration = calculateEpisodeDuration(episode);
  const shotCount = episode.scenes.reduce((total, scene) => total + scene.shots.length, 0);
  const dialogueLineCount = episode.scenes.reduce((total, scene) => total + scene.dialogueLines.length, 0);
  const missingRooms = episode.scenes.filter((scene) => !scene.roomId).length;
  const missingPrompts = episode.scenes.reduce(
    (total, scene) => total + scene.shots.filter((shot) => !shot.imagePrompt.trim() || !shot.videoPrompt.trim()).length,
    0,
  );
  const durationDeltaSec = duration.durationSec - episode.targetDurationSec;
  const durationWarning =
    duration.durationSec === 0
      ? null
      : duration.durationSec < 20
        ? `Planned duration is ${20 - duration.durationSec} sec under the recommended 20 sec minimum.`
        : duration.durationSec > 45
          ? `Planned duration is ${duration.durationSec - 45} sec over the recommended 45 sec maximum.`
          : null;

  return {
    characterCount: episode.characterAssignments.length,
    sceneCount: episode.scenes.length,
    shotCount,
    dialogueLineCount,
    plannedDurationSec: duration.durationSec,
    targetDurationSec: episode.targetDurationSec,
    durationDeltaSec,
    durationSource: duration.source,
    missingRooms,
    missingPrompts,
    durationWarning,
  };
}

export function buildProductionManifest(episode: RandomRoomsEpisode): ProductionManifest {
  const duration = calculateEpisodeDuration(episode);
  const roomMap = new Map<string, NonNullable<RandomRoomsEpisode["scenes"][number]["room"]>>();

  for (const scene of episode.scenes) {
    if (scene.room) {
      roomMap.set(scene.room.id, scene.room);
    }
  }

  const manifest = {
    episode: {
      id: episode.id,
      code: episode.code,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      premise: episode.premise,
      hook: episode.hook,
      comedyAngle: episode.comedyAngle,
      targetDurationSec: episode.targetDurationSec,
      targetAspectRatio: episode.targetAspectRatio,
      language: episode.language,
      status: episode.status,
      plannedDurationSec: duration.durationSec,
      durationSource: duration.source,
    },
    characters: episode.characterAssignments.map((assignment) => ({
      id: assignment.characterId,
      code: assignment.character?.code || "UNKNOWN",
      name: assignment.character?.name || "Unknown Character",
      roleInEpisode: assignment.roleInEpisode,
    })),
    rooms: [...roomMap.values()].map((room) => ({
      id: room.id,
      code: room.code,
      name: room.name,
      roomType: room.roomType,
    })),
    scenes: episode.scenes.map((scene) => ({
      scene: {
        id: scene.id,
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        summary: scene.summary,
        purpose: scene.purpose,
        beat: scene.beat,
        roomCode: scene.room?.code || null,
        durationSec: scene.durationSec,
        status: scene.status,
      },
      shots: scene.shots.map((shot) => ({
        id: shot.id,
        shotNumber: shot.shotNumber,
        shotType: shot.shotType,
        cameraFraming: shot.cameraFraming,
        cameraMovement: shot.cameraMovement,
        actionDescription: shot.actionDescription,
        visualDescription: shot.visualDescription,
        imagePrompt: shot.imagePrompt,
        videoPrompt: shot.videoPrompt,
        durationSec: shot.durationSec,
        emotion: shot.emotion,
        continuityNotes: shot.continuityNotes,
      })),
      dialogue: scene.dialogueLines.map((line) => ({
        id: line.id,
        lineNumber: line.lineNumber,
        shotId: line.shotId,
        characterCode: line.character?.code || "UNKNOWN",
        characterName: line.character?.name || "Unknown Character",
        text: line.text,
        emotion: line.emotion,
        deliveryStyle: line.deliveryStyle,
        captionText: line.captionText,
        startOffsetMs: line.startOffsetMs,
        durationEstimateMs: line.durationEstimateMs,
      })),
    })),
  };

  return productionManifestSchema.parse(manifest);
}
