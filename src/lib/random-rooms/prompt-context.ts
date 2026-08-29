import type {
  CharacterVoiceProfile,
  RandomRoomsCharacter,
  RandomRoomsCharacterRelationship,
  RandomRoomsDialogueLine,
  RandomRoomsEpisode,
  RandomRoomsEpisodeCharacter,
  RandomRoomsRoomProfile,
  RandomRoomsScene,
  RandomRoomsSeries,
  RandomRoomsShot,
} from "@/lib/types";

type CharacterPromptInput = Pick<
  RandomRoomsCharacter,
  | "code"
  | "name"
  | "role"
  | "characterType"
  | "personality"
  | "speakingStyle"
  | "catchphrases"
  | "doNotSay"
  | "visualDescription"
  | "signatureTraits"
  | "continuityNotes"
  | "referenceAssetNotes"
> & {
  voiceProfile?: Partial<CharacterVoiceProfile> | null;
};

type RelationshipPromptInput = Pick<
  RandomRoomsCharacterRelationship,
  "relationshipType" | "dynamic" | "conflictPattern" | "comedyPattern" | "continuityNotes"
> & {
  characterA?: Pick<NonNullable<RandomRoomsCharacterRelationship["characterA"]>, "code" | "name"> | null;
  characterB?: Pick<NonNullable<RandomRoomsCharacterRelationship["characterB"]>, "code" | "name"> | null;
};

type RoomPromptInput = Pick<
  RandomRoomsRoomProfile,
  | "code"
  | "name"
  | "roomType"
  | "description"
  | "visualStyle"
  | "lighting"
  | "colorMood"
  | "cameraConstraints"
  | "props"
  | "environmentRules"
  | "continuityNotes"
  | "referenceAssetNotes"
>;

type SeriesPromptInput = Pick<
  RandomRoomsSeries,
  "name" | "concept" | "tone" | "language" | "targetFormat" | "defaultDurationSec" | "contentRules"
>;

type EpisodeCharacterPromptInput = Pick<RandomRoomsEpisodeCharacter, "roleInEpisode" | "priority" | "notes"> & {
  character?: Pick<NonNullable<RandomRoomsEpisodeCharacter["character"]>, "code" | "name" | "role" | "characterType" | "active"> | null;
};

type EpisodePromptInput = Pick<
  RandomRoomsEpisode,
  "code" | "episodeNumber" | "title" | "premise" | "hook" | "comedyAngle" | "targetDurationSec" | "targetAspectRatio" | "language" | "status" | "notes"
> & {
  series?: SeriesPromptInput | null;
  characterAssignments?: EpisodeCharacterPromptInput[];
  relationships?: RelationshipPromptInput[];
  rooms?: RoomPromptInput[];
};

type ScenePromptInput = Pick<RandomRoomsScene, "sceneNumber" | "title" | "summary" | "purpose" | "beat" | "durationSec" | "status" | "notes"> & {
  episode?: Pick<EpisodePromptInput, "code" | "title" | "premise" | "hook" | "comedyAngle"> | null;
  room?: RoomPromptInput | null;
  characters?: EpisodeCharacterPromptInput[];
  relationships?: RelationshipPromptInput[];
};

type ShotPromptInput = Pick<
  RandomRoomsShot,
  | "shotNumber"
  | "shotType"
  | "cameraFraming"
  | "cameraMovement"
  | "actionDescription"
  | "visualDescription"
  | "imagePrompt"
  | "videoPrompt"
  | "durationSec"
  | "emotion"
  | "continuityNotes"
  | "status"
> & {
  scene?: Pick<ScenePromptInput, "sceneNumber" | "title" | "purpose" | "beat" | "summary"> | null;
  room?: RoomPromptInput | null;
};

type DialoguePromptInput = Pick<
  RandomRoomsDialogueLine,
  "lineNumber" | "text" | "emotion" | "deliveryStyle" | "captionText" | "startOffsetMs" | "durationEstimateMs" | "notes"
> & {
  character?: Pick<NonNullable<RandomRoomsDialogueLine["character"]>, "code" | "name" | "role" | "characterType"> | null;
  scene?: Pick<ScenePromptInput, "sceneNumber" | "title" | "purpose" | "beat"> | null;
  shot?: Pick<NonNullable<RandomRoomsDialogueLine["shot"]>, "shotNumber" | "shotType"> | null;
};

function listBlock(title: string, items: string[]) {
  if (!items.length) {
    return null;
  }

  return `${title}:\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function textBlock(title: string, value: string | null | undefined) {
  return value?.trim() ? `${title}:\n${value.trim()}` : null;
}

function voiceBlock(profile: Partial<CharacterVoiceProfile> | null | undefined) {
  if (!profile) {
    return null;
  }

  const rows = [
    profile.voiceProviderHint ? `- Provider hint: ${profile.voiceProviderHint}` : null,
    profile.voiceId ? `- Voice ID: ${profile.voiceId}` : null,
    profile.voiceStyle ? `- Style: ${profile.voiceStyle}` : null,
    profile.voiceNotes ? `- Notes: ${profile.voiceNotes}` : null,
  ].filter(Boolean);

  return rows.length ? `Voice Profile Metadata:\n${rows.join("\n")}` : null;
}

function characterLabel(character: RelationshipPromptInput["characterA"]) {
  if (!character) {
    return "Unknown Character";
  }

  return `${character.name} (${character.code})`;
}

function seriesBlock(series: SeriesPromptInput | null | undefined) {
  if (!series) {
    return null;
  }

  return [
    `Series: ${series.name}`,
    textBlock("Concept", series.concept),
    textBlock("Tone", series.tone),
    `Language: ${series.language}`,
    `Format: ${series.targetFormat}`,
    `Default Duration: ${series.defaultDurationSec} sec`,
    listBlock("Content Rules", series.contentRules),
  ]
    .filter(Boolean)
    .join("\n");
}

function episodeCharacterLine(assignment: EpisodeCharacterPromptInput) {
  const character = assignment.character;
  const label = character ? `${character.name} (${character.code})` : "Unknown Character";
  const state = character?.active === false ? " inactive" : "";
  const notes = assignment.notes ? ` Notes: ${assignment.notes}` : "";

  return `- ${label}: ${assignment.roleInEpisode}; priority ${assignment.priority}; ${character?.role || "role unknown"}; ${character?.characterType || "type unknown"}${state}.${notes}`;
}

function sceneLabel(scene: Pick<ScenePromptInput, "sceneNumber" | "title" | "purpose"> | null | undefined) {
  if (!scene) {
    return null;
  }

  return `Scene ${scene.sceneNumber}: ${scene.title} (${scene.purpose})`;
}

export function buildCharacterPromptContext(character: CharacterPromptInput) {
  return [
    `Character: ${character.name}`,
    `Code: ${character.code}`,
    `Role: ${character.role}`,
    `Type: ${character.characterType}`,
    listBlock("Personality", character.personality),
    listBlock("Speaking Style", character.speakingStyle),
    listBlock("Catchphrases", character.catchphrases),
    listBlock("Rules", character.doNotSay.map((rule) => `Do not say: ${rule}`)),
    textBlock("Visual Identity", character.visualDescription),
    listBlock("Signature Traits", character.signatureTraits),
    voiceBlock(character.voiceProfile),
    textBlock("Continuity Notes", character.continuityNotes),
    textBlock("Reference Asset Notes", character.referenceAssetNotes),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildRelationshipPromptContext(relationship: RelationshipPromptInput) {
  return [
    `Relationship: ${characterLabel(relationship.characterA)} <-> ${characterLabel(relationship.characterB)}`,
    `Type: ${relationship.relationshipType}`,
    textBlock("Dynamic", relationship.dynamic),
    textBlock("Conflict Pattern", relationship.conflictPattern),
    textBlock("Comedy Pattern", relationship.comedyPattern),
    textBlock("Continuity Notes", relationship.continuityNotes),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildRoomPromptContext(room: RoomPromptInput) {
  return [
    `Room: ${room.name}`,
    `Code: ${room.code}`,
    textBlock("Type", room.roomType),
    textBlock("Description", room.description),
    textBlock("Visual Style", room.visualStyle),
    textBlock("Lighting", room.lighting),
    textBlock("Color Mood", room.colorMood),
    listBlock("Key Props", room.props),
    listBlock("Continuity Rules", room.environmentRules),
    listBlock("Camera Constraints", room.cameraConstraints),
    textBlock("Continuity Notes", room.continuityNotes),
    textBlock("Reference Asset Notes", room.referenceAssetNotes),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildEpisodeContext(episode: EpisodePromptInput) {
  return [
    seriesBlock(episode.series),
    [
      `Episode: ${episode.title}`,
      `Code: ${episode.code}`,
      `Number: ${episode.episodeNumber}`,
      `Status: ${episode.status}`,
      `Target: ${episode.targetDurationSec} sec at ${episode.targetAspectRatio}`,
      `Language: ${episode.language}`,
      textBlock("Premise", episode.premise),
      textBlock("Hook", episode.hook),
      textBlock("Comedy Angle", episode.comedyAngle),
      textBlock("Notes", episode.notes),
    ]
      .filter(Boolean)
      .join("\n"),
    episode.characterAssignments?.length ? `Characters:\n${episode.characterAssignments.map(episodeCharacterLine).join("\n")}` : null,
    episode.relationships?.length ? episode.relationships.map(buildRelationshipPromptContext).join("\n\n") : null,
    episode.rooms?.length ? episode.rooms.map(buildRoomPromptContext).join("\n\n") : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildSceneContext(scene: ScenePromptInput) {
  return [
    sceneLabel(scene),
    scene.episode
      ? [
          `Episode: ${scene.episode.title}`,
          `Episode Code: ${scene.episode.code}`,
          textBlock("Episode Premise", scene.episode.premise),
          textBlock("Episode Hook", scene.episode.hook),
          textBlock("Episode Comedy Angle", scene.episode.comedyAngle),
        ]
          .filter(Boolean)
          .join("\n")
      : null,
    [
      textBlock("Summary", scene.summary),
      textBlock("Beat", scene.beat),
      `Duration: ${scene.durationSec} sec`,
      `Status: ${scene.status}`,
      textBlock("Notes", scene.notes),
    ]
      .filter(Boolean)
      .join("\n"),
    scene.room ? buildRoomPromptContext(scene.room) : textBlock("Room", "No room selected; use scene notes as the justification."),
    scene.characters?.length ? `Characters:\n${scene.characters.map(episodeCharacterLine).join("\n")}` : null,
    scene.relationships?.length ? scene.relationships.map(buildRelationshipPromptContext).join("\n\n") : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildShotContext(shot: ShotPromptInput) {
  return [
    shot.scene ? sceneLabel(shot.scene) : null,
    [
      `Shot ${shot.shotNumber}: ${shot.shotType}`,
      `Framing: ${shot.cameraFraming}`,
      `Movement: ${shot.cameraMovement}`,
      `Duration: ${shot.durationSec} sec`,
      `Emotion: ${shot.emotion}`,
      `Status: ${shot.status}`,
      textBlock("Action", shot.actionDescription),
      textBlock("Visual Description", shot.visualDescription),
      textBlock("Image Prompt", shot.imagePrompt),
      textBlock("Video Prompt", shot.videoPrompt),
      textBlock("Continuity Notes", shot.continuityNotes),
    ]
      .filter(Boolean)
      .join("\n"),
    shot.room ? buildRoomPromptContext(shot.room) : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildDialogueContext(line: DialoguePromptInput) {
  const character = line.character ? `${line.character.name} (${line.character.code})` : "Unknown Character";

  return [
    line.scene ? sceneLabel(line.scene) : null,
    line.shot ? `Shot ${line.shot.shotNumber}: ${line.shot.shotType}` : null,
    [
      `Dialogue ${line.lineNumber}`,
      `Character: ${character}`,
      `Role: ${line.character?.role || "Unknown"}`,
      `Type: ${line.character?.characterType || "Unknown"}`,
      textBlock("Line", line.text),
      textBlock("Emotion", line.emotion),
      textBlock("Delivery Style", line.deliveryStyle),
      textBlock("Caption Text", line.captionText),
      line.startOffsetMs === null || line.startOffsetMs === undefined ? null : `Start Offset: ${line.startOffsetMs} ms`,
      line.durationEstimateMs === null || line.durationEstimateMs === undefined
        ? null
        : `Duration Estimate: ${line.durationEstimateMs} ms`,
      textBlock("Notes", line.notes),
    ]
      .filter(Boolean)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}
