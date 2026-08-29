import { z } from "zod";
import {
  CHARACTER_CODE_PATTERN,
  deriveRandomRoomsSlug,
  normalizeCharacterCode,
  normalizeEpisodeCode,
  normalizeRandomRoomsSlug,
} from "@/lib/random-rooms/normalize";
import {
  IDEA_STATUSES,
  PROJECT_STATUSES,
  RANDOM_ROOMS_EPISODE_STATUSES,
  RANDOM_ROOMS_SCENE_PURPOSES,
  RANDOM_ROOMS_SCENE_STATUSES,
  RANDOM_ROOMS_SHOT_STATUSES,
  SCRIPT_TYPES,
} from "@/lib/types";

const nullableText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const optionalNullableText = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? value : null;
  });

const nonEmptyText = z.string().trim().min(1);
const stringList = z.array(nonEmptyText);
const optionalStringList = stringList.default([]);
const requiredStringList = stringList.min(1);

const randomRoomsSlug = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeRandomRoomsSlug)
  .pipe(z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));

const stableRandomRoomsCode = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeCharacterCode)
  .pipe(z.string().regex(CHARACTER_CODE_PATTERN, "Use 2-24 uppercase letters, numbers, or underscores."));
const characterCode = stableRandomRoomsCode;
const roomCode = stableRandomRoomsCode;
const episodeCode = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeEpisodeCode)
  .pipe(z.string().regex(CHARACTER_CODE_PATTERN, "Use 2-24 uppercase letters, numbers, or underscores."));
const roomShortText = z.string().trim().min(1).max(160);
const roomMediumText = z.string().trim().min(1).max(800);
const roomLongText = z.string().trim().min(1).max(2400);
const episodeShortText = z.string().trim().min(1).max(180);
const episodeLongText = z.string().trim().min(1).max(2400);
const optionalPlanningText = z
  .string()
  .trim()
  .max(2400)
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? value : null;
  });
const nullablePlanningText = z
  .string()
  .trim()
  .max(2400)
  .optional()
  .transform((value) => (value ? value : null));
const optionalGenerationText = z.string().trim().max(4000).optional().default("");
const aspectRatio = z
  .string()
  .trim()
  .regex(/^\d{1,2}:\d{1,2}$/, "Use an aspect ratio like 9:16.")
  .default("9:16");
const targetDurationSec = z.coerce.number().int().min(5).max(300).default(30);
const planningDurationSec = z.coerce.number().int().min(1).max(300);
const optionalPlanningDurationSec = planningDurationSec.optional();
const positiveOrderNumber = z.coerce.number().int().min(1).max(999);
const optionalPositiveOrderNumber = positiveOrderNumber.optional();
const optionalTimingMs = z.coerce.number().int().min(0).max(3_600_000).nullable().optional();
const optionalRoomText = z
  .string()
  .trim()
  .max(2400)
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? value : null;
  });

const characterVoiceProfileText = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    return value ? value : null;
  });

export const characterVoiceProfileSchema = z
  .object({
    voiceProviderHint: characterVoiceProfileText,
    voiceId: characterVoiceProfileText,
    voiceStyle: characterVoiceProfileText,
    voiceNotes: characterVoiceProfileText,
  })
  .default({
    voiceProviderHint: null,
    voiceId: null,
    voiceStyle: null,
    voiceNotes: null,
  })
  .transform((profile) => ({
    voiceProviderHint: profile.voiceProviderHint ?? null,
    voiceId: profile.voiceId ?? null,
    voiceStyle: profile.voiceStyle ?? null,
    voiceNotes: profile.voiceNotes ?? null,
  }));

export const randomRoomsSeriesCreateSchema = z
  .object({
    name: nonEmptyText.default("Random Rooms"),
    slug: randomRoomsSlug.optional(),
    concept: z.string().trim().default(""),
    tone: z.string().trim().default(""),
    language: nonEmptyText.default("hinglish"),
    targetFormat: nonEmptyText.default("youtube_shorts"),
    defaultDurationSec: z.coerce.number().int().min(5).max(3600).default(60),
    contentRules: optionalStringList,
    active: z.boolean().default(true),
  })
  .transform((data) => ({
    ...data,
    slug: data.slug ?? deriveRandomRoomsSlug(data.name),
  }));

export const randomRoomsSeriesUpdateSchema = z.object({
  name: nonEmptyText.optional(),
  slug: randomRoomsSlug.optional(),
  concept: z.string().trim().optional(),
  tone: z.string().trim().optional(),
  language: nonEmptyText.optional(),
  targetFormat: nonEmptyText.optional(),
  defaultDurationSec: z.coerce.number().int().min(5).max(3600).optional(),
  contentRules: stringList.optional(),
  active: z.boolean().optional(),
});

export const randomRoomsCharacterCreateSchema = z.object({
  seriesId: nonEmptyText,
  code: characterCode,
  name: nonEmptyText,
  role: nonEmptyText,
  characterType: nonEmptyText,
  personality: requiredStringList,
  speakingStyle: requiredStringList,
  catchphrases: optionalStringList,
  doNotSay: optionalStringList,
  visualDescription: nonEmptyText,
  signatureTraits: optionalStringList,
  voiceProfile: characterVoiceProfileSchema,
  continuityNotes: nullableText,
  referenceAssetNotes: nullableText,
  active: z.boolean().default(true),
});

export const randomRoomsCharacterUpdateSchema = z.object({
  code: characterCode.optional(),
  name: nonEmptyText.optional(),
  role: nonEmptyText.optional(),
  characterType: nonEmptyText.optional(),
  personality: requiredStringList.optional(),
  speakingStyle: requiredStringList.optional(),
  catchphrases: stringList.optional(),
  doNotSay: stringList.optional(),
  visualDescription: nonEmptyText.optional(),
  signatureTraits: stringList.optional(),
  voiceProfile: characterVoiceProfileSchema.optional(),
  continuityNotes: optionalNullableText.optional(),
  referenceAssetNotes: optionalNullableText.optional(),
  active: z.boolean().optional(),
});

export const randomRoomsRelationshipCreateSchema = z
  .object({
    seriesId: nonEmptyText,
    characterAId: nonEmptyText,
    characterBId: nonEmptyText,
    relationshipType: nonEmptyText,
    dynamic: nonEmptyText,
    conflictPattern: nonEmptyText,
    comedyPattern: nonEmptyText,
    continuityNotes: nullableText,
    active: z.boolean().default(true),
  })
  .refine((data) => data.characterAId !== data.characterBId, {
    path: ["characterBId"],
    message: "Choose two different characters.",
  });

export const randomRoomsRelationshipUpdateSchema = z
  .object({
    characterAId: nonEmptyText.optional(),
    characterBId: nonEmptyText.optional(),
    relationshipType: nonEmptyText.optional(),
    dynamic: nonEmptyText.optional(),
    conflictPattern: nonEmptyText.optional(),
    comedyPattern: nonEmptyText.optional(),
    continuityNotes: optionalNullableText.optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => !data.characterAId || !data.characterBId || data.characterAId !== data.characterBId, {
    path: ["characterBId"],
    message: "Choose two different characters.",
  });

export const randomRoomsRoomCreateSchema = z.object({
  seriesId: nonEmptyText,
  code: roomCode,
  name: roomShortText,
  roomType: roomShortText,
  description: roomLongText,
  visualStyle: roomMediumText,
  lighting: roomMediumText,
  colorMood: roomMediumText,
  cameraConstraints: optionalStringList,
  props: optionalStringList,
  environmentRules: optionalStringList,
  continuityNotes: nullableText,
  referenceAssetNotes: nullableText,
  active: z.boolean().default(true),
});

export const randomRoomsRoomUpdateSchema = z.object({
  code: roomCode.optional(),
  name: roomShortText.optional(),
  roomType: roomShortText.optional(),
  description: roomLongText.optional(),
  visualStyle: roomMediumText.optional(),
  lighting: roomMediumText.optional(),
  colorMood: roomMediumText.optional(),
  cameraConstraints: stringList.optional(),
  props: stringList.optional(),
  environmentRules: stringList.optional(),
  continuityNotes: optionalRoomText.optional(),
  referenceAssetNotes: optionalRoomText.optional(),
  active: z.boolean().optional(),
});

export const randomRoomsEpisodeCreateSchema = z.object({
  seriesId: nonEmptyText,
  episodeNumber: optionalPositiveOrderNumber,
  code: episodeCode.optional(),
  title: episodeShortText,
  premise: episodeLongText,
  hook: z.string().trim().max(1200).default(""),
  comedyAngle: z.string().trim().max(1200).default(""),
  targetDurationSec,
  targetAspectRatio: aspectRatio,
  language: nonEmptyText.default("hinglish"),
  status: z.enum(RANDOM_ROOMS_EPISODE_STATUSES).default("DRAFT"),
  notes: nullablePlanningText,
});

export const randomRoomsEpisodeUpdateSchema = z.object({
  episodeNumber: optionalPositiveOrderNumber,
  code: episodeCode.optional(),
  title: episodeShortText.optional(),
  premise: episodeLongText.optional(),
  hook: z.string().trim().max(1200).optional(),
  comedyAngle: z.string().trim().max(1200).optional(),
  targetDurationSec: targetDurationSec.optional(),
  targetAspectRatio: aspectRatio.optional(),
  language: nonEmptyText.optional(),
  status: z.enum(RANDOM_ROOMS_EPISODE_STATUSES).optional(),
  notes: optionalPlanningText.optional(),
});

export const randomRoomsEpisodeCharacterCreateSchema = z.object({
  characterId: nonEmptyText,
  roleInEpisode: episodeShortText,
  priority: z.coerce.number().int().min(1).max(20).default(1),
  notes: nullablePlanningText,
});

export const randomRoomsEpisodeCharacterUpdateSchema = z.object({
  roleInEpisode: episodeShortText.optional(),
  priority: z.coerce.number().int().min(1).max(20).optional(),
  notes: optionalPlanningText.optional(),
});

const randomRoomsSceneBaseSchema = z.object({
  sceneNumber: optionalPositiveOrderNumber,
  roomId: nullablePlanningText,
  title: episodeShortText,
  summary: episodeLongText,
  purpose: z.enum(RANDOM_ROOMS_SCENE_PURPOSES).default("SETUP"),
  beat: episodeLongText,
  durationSec: planningDurationSec.default(8),
  status: z.enum(RANDOM_ROOMS_SCENE_STATUSES).default("DRAFT"),
  notes: nullablePlanningText,
});

export const randomRoomsSceneCreateSchema = randomRoomsSceneBaseSchema.refine((data) => !!data.roomId || !!data.notes, {
  path: ["roomId"],
  message: "Add a room or explain why this scene has no room in notes.",
});

export const randomRoomsSceneUpdateSchema = z.object({
  sceneNumber: optionalPositiveOrderNumber,
  roomId: optionalPlanningText.optional(),
  title: episodeShortText.optional(),
  summary: episodeLongText.optional(),
  purpose: z.enum(RANDOM_ROOMS_SCENE_PURPOSES).optional(),
  beat: episodeLongText.optional(),
  durationSec: optionalPlanningDurationSec,
  status: z.enum(RANDOM_ROOMS_SCENE_STATUSES).optional(),
  notes: optionalPlanningText.optional(),
});

export const randomRoomsShotCreateSchema = z.object({
  shotNumber: optionalPositiveOrderNumber,
  shotType: episodeShortText.default("action"),
  cameraFraming: episodeShortText.default("medium"),
  cameraMovement: episodeShortText.default("static"),
  actionDescription: episodeLongText,
  visualDescription: episodeLongText,
  imagePrompt: optionalGenerationText,
  videoPrompt: optionalGenerationText,
  durationSec: planningDurationSec.default(3),
  emotion: episodeShortText.default("neutral"),
  continuityNotes: nullablePlanningText,
  status: z.enum(RANDOM_ROOMS_SHOT_STATUSES).default("DRAFT"),
});

export const randomRoomsShotUpdateSchema = z.object({
  shotNumber: optionalPositiveOrderNumber,
  shotType: episodeShortText.optional(),
  cameraFraming: episodeShortText.optional(),
  cameraMovement: episodeShortText.optional(),
  actionDescription: episodeLongText.optional(),
  visualDescription: episodeLongText.optional(),
  imagePrompt: z.string().trim().max(4000).optional(),
  videoPrompt: z.string().trim().max(4000).optional(),
  durationSec: optionalPlanningDurationSec,
  emotion: episodeShortText.optional(),
  continuityNotes: optionalPlanningText.optional(),
  status: z.enum(RANDOM_ROOMS_SHOT_STATUSES).optional(),
});

export const randomRoomsDialogueLineCreateSchema = z.object({
  lineNumber: optionalPositiveOrderNumber,
  shotId: nullablePlanningText,
  characterId: nonEmptyText,
  text: z.string().trim().min(1).max(1400),
  emotion: z.string().trim().max(180).optional().transform((value) => (value ? value : null)),
  deliveryStyle: z.string().trim().max(240).optional().transform((value) => (value ? value : null)),
  captionText: z.string().trim().max(1400).optional(),
  startOffsetMs: optionalTimingMs,
  durationEstimateMs: optionalTimingMs,
  notes: nullablePlanningText,
});

export const randomRoomsDialogueLineUpdateSchema = z.object({
  lineNumber: optionalPositiveOrderNumber,
  shotId: optionalPlanningText.optional(),
  characterId: nonEmptyText.optional(),
  text: z.string().trim().min(1).max(1400).optional(),
  emotion: optionalPlanningText.optional(),
  deliveryStyle: optionalPlanningText.optional(),
  captionText: z.string().trim().max(1400).optional(),
  startOffsetMs: optionalTimingMs,
  durationEstimateMs: optionalTimingMs,
  notes: optionalPlanningText.optional(),
});

export const randomRoomsReorderSchema = z.object({
  orderedIds: z.array(nonEmptyText).min(1),
});

export const randomRoomsEpisodePlanGenerateSchema = z.object({
  seriesId: nonEmptyText,
  premise: episodeLongText,
  selectedCharacterIds: z.array(nonEmptyText).min(1).max(6),
  roomId: nullablePlanningText,
  targetDurationSec,
  notes: z.string().trim().max(2400).optional(),
});

export const channelSchema = z.object({
  name: z.string().trim().min(1),
  niche: z.string().trim().min(1),
  audience: z.string().trim().min(1),
  language: z.string().trim().min(1),
  tone: z.string().trim().min(1),
  videoStyle: z.string().trim().min(1),
  contentPillars: z.array(z.string().trim().min(1)).min(1),
  ctaStyle: z.string().trim().min(1),
  doNotSay: z.array(z.string().trim().min(1)).default([]),
  competitorChannels: z.array(z.string().trim().min(1)).default([]),
  monetizationGoal: z.string().trim().min(1),
});

export const ideaCreateSchema = z.object({
  idea: z.string().trim().min(1),
  pillar: z.string().trim().min(1),
  audiencePain: z.string().trim().min(1),
  videoType: z.string().trim().min(1),
  priority: z.coerce.number().int().min(1).max(5).default(3),
  status: z.enum(IDEA_STATUSES).default("raw_idea"),
  notes: nullableText,
});

export const ideaUpdateSchema = ideaCreateSchema.partial();

export const projectCreateSchema = z.object({
  ideaId: z.string().trim().min(1).optional(),
  topic: z.string().trim().optional(),
  pillar: z.string().trim().optional(),
  videoType: z.string().trim().optional(),
  targetLength: z.string().trim().default("8-10 minutes"),
  language: z.string().trim().default("Hinglish"),
  status: z.enum(PROJECT_STATUSES).default("planning"),
  notes: nullableText,
});

export const projectUpdateSchema = z.object({
  topic: z.string().trim().min(1).optional(),
  pillar: z.string().trim().min(1).optional(),
  videoType: z.string().trim().min(1).optional(),
  targetLength: z.string().trim().min(1).optional(),
  language: z.string().trim().min(1).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  notes: optionalNullableText,
});

export const researchGenerateSchema = z.object({
  projectId: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  referenceLinks: z.array(z.string().trim().url()).default([]),
});

export const scriptGenerateSchema = z.object({
  projectId: z.string().trim().min(1),
  scriptType: z.enum(SCRIPT_TYPES).default("long_form"),
  versionName: z.string().trim().min(1).default("AI draft"),
  notes: z.string().trim().optional(),
});

export const projectGenerationSchema = z.object({
  projectId: z.string().trim().min(1),
  notes: z.string().trim().optional(),
});

export const performanceSaveSchema = z.object({
  projectId: z.string().trim().min(1),
  publishDate: z.string().trim().min(1),
  views24h: z.coerce.number().int().min(0).nullable().optional(),
  views7d: z.coerce.number().int().min(0).nullable().optional(),
  ctr: z.coerce.number().min(0).nullable().optional(),
  avgViewDuration: optionalNullableText,
  subscriberGain: z.coerce.number().int().nullable().optional(),
  commentsSummary: optionalNullableText,
  whatWorked: optionalNullableText,
  whatFailed: optionalNullableText,
});

export const performanceGenerateSchema = performanceSaveSchema.extend({
  performanceEntryId: z.string().trim().min(1).optional(),
});
