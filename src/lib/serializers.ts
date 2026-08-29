import {
  GENERATION_LOG_STATUSES,
  RANDOM_ROOMS_EPISODE_STATUSES,
  RANDOM_ROOMS_SCENE_STATUSES,
  RANDOM_ROOMS_SHOT_STATUSES,
  type GenerationLogStatus,
  ChannelProfile,
  GenerationLog,
  Idea,
  PerformanceEntry,
  RandomRoomsCharacter,
  RandomRoomsCharacterRelationship,
  RandomRoomsDialogueLine,
  RandomRoomsDialogueShot,
  RandomRoomsEpisode,
  RandomRoomsEpisodeCharacter,
  RandomRoomsEpisodeCharacterProfile,
  RandomRoomsEpisodeStatus,
  RandomRoomsRelationshipCharacter,
  RandomRoomsRoomProfile,
  RandomRoomsScene,
  RandomRoomsSceneStatus,
  RandomRoomsSeries,
  RandomRoomsShot,
  RandomRoomsShotStatus,
  ResearchBrief,
  ScriptVersion,
  ThumbnailPack,
  UploadPack,
  VideoProject,
} from "@/lib/types";
import { buildEpisodeReview } from "@/lib/random-rooms/manifest";

type WithDates<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: Date | string;
};

type DbResearchBrief = WithDates<ResearchBrief, "createdAt"> & {
  rawOutput?: unknown;
};

type DbScriptVersion = WithDates<ScriptVersion, "createdAt"> & {
  structuredOutput?: unknown;
};

type DbThumbnailPack = WithDates<ThumbnailPack, "createdAt"> & {
  rawOutput?: unknown;
};

type DbUploadPack = WithDates<UploadPack, "createdAt"> & {
  rawOutput?: unknown;
};

type DbPerformanceEntry = WithDates<PerformanceEntry, "createdAt" | "updatedAt" | "publishDate">;

type DbRandomRoomsCharacter = WithDates<Omit<RandomRoomsCharacter, "voiceProfile">, "createdAt" | "updatedAt"> & {
  voiceProfile?: unknown;
};

type DbRandomRoomsRelationshipCharacter = Pick<RandomRoomsRelationshipCharacter, "id" | "code" | "name" | "characterType" | "active">;

type DbRandomRoomsCharacterRelationship = WithDates<
  Omit<RandomRoomsCharacterRelationship, "characterA" | "characterB">,
  "createdAt" | "updatedAt"
> & {
  characterA?: DbRandomRoomsRelationshipCharacter | null;
  characterB?: DbRandomRoomsRelationshipCharacter | null;
};

type DbRandomRoomsRoomProfile = WithDates<RandomRoomsRoomProfile, "createdAt" | "updatedAt">;

type DbRandomRoomsEpisodeCharacterProfile = Pick<RandomRoomsEpisodeCharacterProfile, "id" | "code" | "name" | "role" | "characterType" | "active">;

type DbRandomRoomsEpisodeCharacter = WithDates<
  Omit<RandomRoomsEpisodeCharacter, "character">,
  "createdAt" | "updatedAt"
> & {
  character?: DbRandomRoomsEpisodeCharacterProfile | null;
};

type DbRandomRoomsDialogueShot = Pick<RandomRoomsDialogueShot, "id" | "shotNumber" | "shotType">;

type DbRandomRoomsDialogueLine = WithDates<
  Omit<RandomRoomsDialogueLine, "character" | "shot">,
  "createdAt" | "updatedAt"
> & {
  character?: DbRandomRoomsEpisodeCharacterProfile | null;
  shot?: DbRandomRoomsDialogueShot | null;
};

type DbRandomRoomsShot = WithDates<Omit<RandomRoomsShot, "status">, "createdAt" | "updatedAt"> & {
  status: string;
};

type DbRandomRoomsScene = WithDates<
  Omit<RandomRoomsScene, "room" | "shots" | "dialogueLines" | "status">,
  "createdAt" | "updatedAt"
> & {
  status: string;
  room?: DbRandomRoomsRoomProfile | null;
  shots?: DbRandomRoomsShot[];
  dialogueLines?: DbRandomRoomsDialogueLine[];
};

type DbRandomRoomsEpisode = WithDates<
  Omit<RandomRoomsEpisode, "characterAssignments" | "scenes" | "review" | "status">,
  "createdAt" | "updatedAt"
> & {
  status: string;
  characterAssignments?: DbRandomRoomsEpisodeCharacter[];
  scenes?: DbRandomRoomsScene[];
};

type DbRandomRoomsSeries = WithDates<Omit<RandomRoomsSeries, "characters" | "relationships" | "rooms" | "episodes">, "createdAt" | "updatedAt"> & {
  characters?: DbRandomRoomsCharacter[];
  relationships?: DbRandomRoomsCharacterRelationship[];
  rooms?: DbRandomRoomsRoomProfile[];
  episodes?: DbRandomRoomsEpisode[];
};

type DbVideoProject = WithDates<
  Omit<VideoProject, "researchBriefs" | "scripts" | "thumbnailPacks" | "uploadPacks" | "performanceEntries">,
  "createdAt" | "updatedAt"
> & {
  researchBriefs: DbResearchBrief[];
  scripts: DbScriptVersion[];
  thumbnailPacks: DbThumbnailPack[];
  uploadPacks: DbUploadPack[];
  performanceEntries: DbPerformanceEntry[];
};

const iso = (value: Date | string) => (typeof value === "string" ? value : value.toISOString());

function serializeVoiceProfile(value: unknown): RandomRoomsCharacter["voiceProfile"] {
  const profile = typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const text = (key: string) => {
    const entry = profile[key];
    return typeof entry === "string" && entry.trim() ? entry.trim() : null;
  };

  return {
    voiceProviderHint: text("voiceProviderHint"),
    voiceId: text("voiceId"),
    voiceStyle: text("voiceStyle"),
    voiceNotes: text("voiceNotes"),
  };
}

export function serializeChannel(channel: WithDates<ChannelProfile, "createdAt" | "updatedAt">): ChannelProfile {
  return {
    ...channel,
    createdAt: iso(channel.createdAt),
    updatedAt: iso(channel.updatedAt),
  };
}

export function serializeIdea(idea: WithDates<Idea, "createdAt" | "updatedAt">): Idea {
  return {
    ...idea,
    createdAt: iso(idea.createdAt),
    updatedAt: iso(idea.updatedAt),
  };
}

export function serializeResearchBrief(brief: DbResearchBrief): ResearchBrief {
  return {
    id: brief.id,
    projectId: brief.projectId,
    topic: brief.topic,
    referenceLinks: brief.referenceLinks,
    viewerPain: brief.viewerPain,
    videoPromise: brief.videoPromise,
    mainPoints: brief.mainPoints,
    examples: brief.examples,
    commonMistakes: brief.commonMistakes,
    contrarianAngle: brief.contrarianAngle,
    hookAngles: brief.hookAngles,
    titleAngles: brief.titleAngles,
    createdAt: iso(brief.createdAt),
  };
}

export function serializeScriptVersion(script: DbScriptVersion): ScriptVersion {
  return {
    id: script.id,
    projectId: script.projectId,
    scriptType: script.scriptType,
    versionName: script.versionName,
    hook: script.hook,
    intro: script.intro,
    body: script.body,
    cta: script.cta,
    outro: script.outro,
    visualNotes: script.visualNotes,
    onScreenText: script.onScreenText,
    contentMarkdown: script.contentMarkdown,
    createdAt: iso(script.createdAt),
  };
}

export function serializeThumbnailPack(pack: DbThumbnailPack): ThumbnailPack {
  return {
    id: pack.id,
    projectId: pack.projectId,
    textOptions: pack.textOptions,
    visualConcepts: pack.visualConcepts,
    emotionAngle: pack.emotionAngle,
    imageGenerationPrompts: pack.imageGenerationPrompts,
    canvaInstructions: pack.canvaInstructions,
    photoshopInstructions: pack.photoshopInstructions,
    createdAt: iso(pack.createdAt),
  };
}

export function serializeUploadPack(pack: DbUploadPack): UploadPack {
  return {
    id: pack.id,
    projectId: pack.projectId,
    titleOptions: pack.titleOptions,
    finalTitle: pack.finalTitle,
    description: pack.description,
    tags: pack.tags,
    hashtags: pack.hashtags,
    chapters: pack.chapters,
    pinnedComment: pack.pinnedComment,
    communityPost: pack.communityPost,
    shortsCutdownIdeas: pack.shortsCutdownIdeas,
    uploadChecklist: pack.uploadChecklist,
    createdAt: iso(pack.createdAt),
  };
}

export function serializePerformanceEntry(entry: DbPerformanceEntry): PerformanceEntry {
  return {
    ...entry,
    publishDate: iso(entry.publishDate),
    createdAt: iso(entry.createdAt),
    updatedAt: iso(entry.updatedAt),
  };
}

export function serializeRandomRoomsCharacter(character: DbRandomRoomsCharacter): RandomRoomsCharacter {
  return {
    id: character.id,
    seriesId: character.seriesId,
    code: character.code,
    name: character.name,
    role: character.role,
    characterType: character.characterType,
    personality: character.personality,
    speakingStyle: character.speakingStyle,
    catchphrases: character.catchphrases,
    doNotSay: character.doNotSay,
    visualDescription: character.visualDescription,
    signatureTraits: character.signatureTraits,
    voiceProfile: serializeVoiceProfile(character.voiceProfile),
    continuityNotes: character.continuityNotes,
    referenceAssetNotes: character.referenceAssetNotes,
    active: character.active,
    createdAt: iso(character.createdAt),
    updatedAt: iso(character.updatedAt),
  };
}

function serializeRelationshipCharacter(character: DbRandomRoomsRelationshipCharacter | null | undefined): RandomRoomsRelationshipCharacter | null {
  if (!character) {
    return null;
  }

  return {
    id: character.id,
    code: character.code,
    name: character.name,
    characterType: character.characterType,
    active: character.active,
  };
}

export function serializeRandomRoomsCharacterRelationship(
  relationship: DbRandomRoomsCharacterRelationship,
): RandomRoomsCharacterRelationship {
  return {
    id: relationship.id,
    seriesId: relationship.seriesId,
    characterAId: relationship.characterAId,
    characterBId: relationship.characterBId,
    characterA: serializeRelationshipCharacter(relationship.characterA),
    characterB: serializeRelationshipCharacter(relationship.characterB),
    relationshipType: relationship.relationshipType,
    dynamic: relationship.dynamic,
    conflictPattern: relationship.conflictPattern,
    comedyPattern: relationship.comedyPattern,
    continuityNotes: relationship.continuityNotes,
    active: relationship.active,
    createdAt: iso(relationship.createdAt),
    updatedAt: iso(relationship.updatedAt),
  };
}

export function serializeRandomRoomsRoomProfile(room: DbRandomRoomsRoomProfile): RandomRoomsRoomProfile {
  return {
    id: room.id,
    seriesId: room.seriesId,
    code: room.code,
    name: room.name,
    roomType: room.roomType,
    description: room.description,
    visualStyle: room.visualStyle,
    lighting: room.lighting,
    colorMood: room.colorMood,
    cameraConstraints: room.cameraConstraints,
    props: room.props,
    environmentRules: room.environmentRules,
    continuityNotes: room.continuityNotes,
    referenceAssetNotes: room.referenceAssetNotes,
    active: room.active,
    createdAt: iso(room.createdAt),
    updatedAt: iso(room.updatedAt),
  };
}

function serializeEpisodeCharacterProfile(
  character: DbRandomRoomsEpisodeCharacterProfile | null | undefined,
): RandomRoomsEpisodeCharacterProfile | null {
  if (!character) {
    return null;
  }

  return {
    id: character.id,
    code: character.code,
    name: character.name,
    role: character.role,
    characterType: character.characterType,
    active: character.active,
  };
}

export function serializeRandomRoomsEpisodeCharacter(assignment: DbRandomRoomsEpisodeCharacter): RandomRoomsEpisodeCharacter {
  return {
    id: assignment.id,
    episodeId: assignment.episodeId,
    characterId: assignment.characterId,
    character: serializeEpisodeCharacterProfile(assignment.character),
    roleInEpisode: assignment.roleInEpisode,
    priority: assignment.priority,
    notes: assignment.notes,
    createdAt: iso(assignment.createdAt),
    updatedAt: iso(assignment.updatedAt),
  };
}

function serializeDialogueShot(shot: DbRandomRoomsDialogueShot | null | undefined): RandomRoomsDialogueShot | null {
  if (!shot) {
    return null;
  }

  return {
    id: shot.id,
    shotNumber: shot.shotNumber,
    shotType: shot.shotType,
  };
}

export function serializeRandomRoomsShot(shot: DbRandomRoomsShot): RandomRoomsShot {
  return {
    id: shot.id,
    sceneId: shot.sceneId,
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
    status: serializeShotStatus(shot.status),
    createdAt: iso(shot.createdAt),
    updatedAt: iso(shot.updatedAt),
  };
}

export function serializeRandomRoomsDialogueLine(line: DbRandomRoomsDialogueLine): RandomRoomsDialogueLine {
  return {
    id: line.id,
    sceneId: line.sceneId,
    shotId: line.shotId,
    shot: serializeDialogueShot(line.shot),
    characterId: line.characterId,
    character: serializeEpisodeCharacterProfile(line.character),
    lineNumber: line.lineNumber,
    text: line.text,
    emotion: line.emotion,
    deliveryStyle: line.deliveryStyle,
    captionText: line.captionText,
    startOffsetMs: line.startOffsetMs,
    durationEstimateMs: line.durationEstimateMs,
    notes: line.notes,
    createdAt: iso(line.createdAt),
    updatedAt: iso(line.updatedAt),
  };
}

export function serializeRandomRoomsScene(scene: DbRandomRoomsScene): RandomRoomsScene {
  return {
    id: scene.id,
    episodeId: scene.episodeId,
    sceneNumber: scene.sceneNumber,
    roomId: scene.roomId,
    room: scene.room ? serializeRandomRoomsRoomProfile(scene.room) : null,
    title: scene.title,
    summary: scene.summary,
    purpose: scene.purpose,
    beat: scene.beat,
    durationSec: scene.durationSec,
    status: serializeSceneStatus(scene.status),
    notes: scene.notes,
    shots: (scene.shots || []).map(serializeRandomRoomsShot),
    dialogueLines: (scene.dialogueLines || []).map(serializeRandomRoomsDialogueLine),
    createdAt: iso(scene.createdAt),
    updatedAt: iso(scene.updatedAt),
  };
}

export function serializeRandomRoomsEpisode(episode: DbRandomRoomsEpisode): RandomRoomsEpisode {
  const serialized = {
    id: episode.id,
    seriesId: episode.seriesId,
    episodeNumber: episode.episodeNumber,
    code: episode.code,
    title: episode.title,
    premise: episode.premise,
    hook: episode.hook,
    comedyAngle: episode.comedyAngle,
    targetDurationSec: episode.targetDurationSec,
    targetAspectRatio: episode.targetAspectRatio,
    language: episode.language,
    status: serializeEpisodeStatus(episode.status),
    notes: episode.notes,
    characterAssignments: (episode.characterAssignments || []).map(serializeRandomRoomsEpisodeCharacter),
    scenes: (episode.scenes || []).map(serializeRandomRoomsScene),
    createdAt: iso(episode.createdAt),
    updatedAt: iso(episode.updatedAt),
  };

  return {
    ...serialized,
    review: buildEpisodeReview(serialized),
  };
}

export function serializeRandomRoomsSeries(series: DbRandomRoomsSeries): RandomRoomsSeries {
  return {
    id: series.id,
    name: series.name,
    slug: series.slug,
    concept: series.concept,
    tone: series.tone,
    language: series.language,
    targetFormat: series.targetFormat,
    defaultDurationSec: series.defaultDurationSec,
    contentRules: series.contentRules,
    active: series.active,
    characters: (series.characters || []).map(serializeRandomRoomsCharacter),
    relationships: (series.relationships || []).map(serializeRandomRoomsCharacterRelationship),
    rooms: (series.rooms || []).map(serializeRandomRoomsRoomProfile),
    episodes: (series.episodes || []).map(serializeRandomRoomsEpisode),
    createdAt: iso(series.createdAt),
    updatedAt: iso(series.updatedAt),
  };
}

export function serializeProject(project: DbVideoProject): VideoProject {
  return {
    id: project.id,
    ideaId: project.ideaId,
    topic: project.topic,
    pillar: project.pillar,
    videoType: project.videoType,
    targetLength: project.targetLength,
    language: project.language,
    status: project.status,
    notes: project.notes,
    researchBriefs: project.researchBriefs.map(serializeResearchBrief),
    scripts: project.scripts.map(serializeScriptVersion),
    thumbnailPacks: project.thumbnailPacks.map(serializeThumbnailPack),
    uploadPacks: project.uploadPacks.map(serializeUploadPack),
    performanceEntries: project.performanceEntries.map(serializePerformanceEntry),
    createdAt: iso(project.createdAt),
    updatedAt: iso(project.updatedAt),
  };
}

type DbGenerationLog = WithDates<Omit<GenerationLog, "projectTopic" | "status">, "createdAt"> & {
  status: string;
  project?: {
    topic: string;
  } | null;
};

function serializeGenerationLogStatus(status: string): GenerationLogStatus {
  return GENERATION_LOG_STATUSES.includes(status as GenerationLogStatus) ? (status as GenerationLogStatus) : "SUCCESS";
}

function serializeEpisodeStatus(status: string): RandomRoomsEpisodeStatus {
  return RANDOM_ROOMS_EPISODE_STATUSES.includes(status as RandomRoomsEpisodeStatus) ? (status as RandomRoomsEpisodeStatus) : "DRAFT";
}

function serializeSceneStatus(status: string): RandomRoomsSceneStatus {
  return RANDOM_ROOMS_SCENE_STATUSES.includes(status as RandomRoomsSceneStatus) ? (status as RandomRoomsSceneStatus) : "DRAFT";
}

function serializeShotStatus(status: string): RandomRoomsShotStatus {
  return RANDOM_ROOMS_SHOT_STATUSES.includes(status as RandomRoomsShotStatus) ? (status as RandomRoomsShotStatus) : "DRAFT";
}

export function serializeGenerationLog(log: DbGenerationLog): GenerationLog {
  return {
    id: log.id,
    featureName: log.featureName,
    provider: log.provider,
    providerId: log.providerId,
    providerKind: log.providerKind,
    model: log.model,
    status: serializeGenerationLogStatus(log.status),
    attemptCount: log.attemptCount,
    errorCode: log.errorCode,
    errorMessage: log.errorMessage,
    inputTokens: log.inputTokens,
    outputTokens: log.outputTokens,
    costEstimate: log.costEstimate,
    durationMs: log.durationMs,
    projectId: log.projectId,
    projectTopic: log.project?.topic || null,
    createdAt: iso(log.createdAt),
  };
}
