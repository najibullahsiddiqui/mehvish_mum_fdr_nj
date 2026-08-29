import type { RandomRoomsCharacter, RandomRoomsCharacterRelationship, RandomRoomsRoomProfile, RandomRoomsSeries } from "@/lib/types";

type PromptSeries = Pick<RandomRoomsSeries, "name" | "concept" | "tone" | "language" | "targetFormat" | "defaultDurationSec" | "contentRules">;
type PromptCharacter = Pick<
  RandomRoomsCharacter,
  "code" | "name" | "role" | "characterType" | "personality" | "speakingStyle" | "catchphrases" | "doNotSay" | "visualDescription" | "signatureTraits" | "continuityNotes"
>;
type PromptRelationship = Pick<RandomRoomsCharacterRelationship, "relationshipType" | "dynamic" | "conflictPattern" | "comedyPattern" | "continuityNotes"> & {
  characterA?: Pick<NonNullable<RandomRoomsCharacterRelationship["characterA"]>, "code" | "name"> | null;
  characterB?: Pick<NonNullable<RandomRoomsCharacterRelationship["characterB"]>, "code" | "name"> | null;
};
type PromptRoom = Pick<
  RandomRoomsRoomProfile,
  "code" | "name" | "roomType" | "description" | "visualStyle" | "lighting" | "colorMood" | "cameraConstraints" | "props" | "environmentRules" | "continuityNotes"
>;

export const RANDOM_ROOMS_SYSTEM_PROMPT = [
  "You are CreatorPilot Personal's Random Rooms episode planner.",
  "Create compact vertical-short comedy production plans for one private creator.",
  "Return only valid JSON with no markdown fences, no comments, and no prose outside JSON.",
  "Do not request or perform image generation, video generation, TTS, rendering, publishing, or media storage.",
].join(" ");

function compactList(items: string[]) {
  return items.length ? items.join("; ") : "None";
}

function characterBlock(character: PromptCharacter) {
  return {
    code: character.code,
    name: character.name,
    role: character.role,
    type: character.characterType,
    personality: character.personality,
    speakingStyle: character.speakingStyle,
    catchphrases: character.catchphrases,
    doNotSay: character.doNotSay,
    visualDescription: character.visualDescription,
    signatureTraits: character.signatureTraits,
    continuityNotes: character.continuityNotes,
  };
}

function relationshipBlock(relationship: PromptRelationship) {
  return {
    pair: `${relationship.characterA?.code || "UNKNOWN"}-${relationship.characterB?.code || "UNKNOWN"}`,
    type: relationship.relationshipType,
    dynamic: relationship.dynamic,
    conflictPattern: relationship.conflictPattern,
    comedyPattern: relationship.comedyPattern,
    continuityNotes: relationship.continuityNotes,
  };
}

function roomBlock(room: PromptRoom | null) {
  if (!room) {
    return null;
  }

  return {
    code: room.code,
    name: room.name,
    type: room.roomType,
    description: room.description,
    visualStyle: room.visualStyle,
    lighting: room.lighting,
    colorMood: room.colorMood,
    cameraConstraints: room.cameraConstraints,
    props: room.props,
    environmentRules: room.environmentRules,
    continuityNotes: room.continuityNotes,
  };
}

export function buildEpisodePlanPrompt(input: {
  series: PromptSeries;
  premise: string;
  characters: PromptCharacter[];
  relationships: PromptRelationship[];
  room?: PromptRoom | null;
  targetDurationSec: number;
  notes?: string;
}) {
  return `
Create one Random Rooms episode plan.

Series:
${JSON.stringify(
  {
    name: input.series.name,
    concept: input.series.concept,
    tone: input.series.tone,
    language: input.series.language,
    targetFormat: input.series.targetFormat,
    contentRules: input.series.contentRules,
  },
  null,
  2,
)}

Premise:
${input.premise}

Selected characters:
${JSON.stringify(input.characters.map(characterBlock), null, 2)}

Relationships:
${JSON.stringify(input.relationships.map(relationshipBlock), null, 2)}

Room:
${JSON.stringify(roomBlock(input.room || null), null, 2)}

Constraints:
- Target duration: ${input.targetDurationSec} seconds.
- Aspect ratio: 9:16.
- Comedy structure: Hook -> Setup -> Escalation -> Punchline/Payoff.
- Keep scenes and dialogue tight.
- Use character codes exactly: ${compactList(input.characters.map((character) => character.code))}.
- imagePrompt and videoPrompt are planning text only.
- No media generation or tool execution.

Creator notes:
${input.notes || "None"}

Return JSON in this exact shape:
{
  "title": "episode title",
  "hook": "first-second hook",
  "comedyAngle": "central joke mechanic",
  "scenes": [
    {
      "purpose": "HOOK",
      "title": "scene title",
      "summary": "short production summary",
      "beat": "story/comedy beat",
      "durationSec": 6,
      "roomCode": "${input.room?.code || ""}",
      "shots": [
        {
          "shotType": "action",
          "cameraFraming": "medium",
          "cameraMovement": "static",
          "actionDescription": "what happens",
          "visualDescription": "what should be visible",
          "imagePrompt": "future still/keyframe planning prompt",
          "videoPrompt": "future motion planning prompt",
          "durationSec": 3,
          "emotion": "confident",
          "continuityNotes": "continuity reminder"
        }
      ],
      "dialogue": [
        {
          "characterCode": "${input.characters[0]?.code || "REX"}",
          "text": "dialogue line",
          "emotion": "confident",
          "deliveryStyle": "fast and direct",
          "captionText": "caption text",
          "durationEstimateMs": 1800
        }
      ]
    }
  ]
}`.trim();
}
