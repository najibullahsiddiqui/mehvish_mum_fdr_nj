export const IDEA_STATUSES = [
  "raw_idea",
  "shortlisted",
  "researching",
  "script_ready",
  "recording",
  "editing",
  "uploaded",
  "analyzed",
] as const;

export const PROJECT_STATUSES = [
  "planning",
  "researching",
  "scripting",
  "thumbnail",
  "upload_pack",
  "recording",
  "editing",
  "uploaded",
  "analyzed",
  "archived",
] as const;

export const SCRIPT_TYPES = [
  "long_form",
  "shorts",
  "faceless_voiceover",
  "screen_recording_tutorial",
] as const;

export const GENERATION_LOG_STATUSES = ["STARTED", "SUCCESS", "FAILED"] as const;
export const RANDOM_ROOMS_EPISODE_STATUSES = ["DRAFT", "PLANNED", "REVIEW", "APPROVED", "ARCHIVED"] as const;
export const RANDOM_ROOMS_SCENE_PURPOSES = ["HOOK", "SETUP", "ESCALATION", "PAYOFF", "OUTRO"] as const;
export const RANDOM_ROOMS_SCENE_STATUSES = RANDOM_ROOMS_EPISODE_STATUSES;
export const RANDOM_ROOMS_SHOT_STATUSES = RANDOM_ROOMS_EPISODE_STATUSES;

export type IdeaStatus = (typeof IDEA_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ScriptType = (typeof SCRIPT_TYPES)[number];
export type GenerationLogStatus = (typeof GENERATION_LOG_STATUSES)[number];
export type RandomRoomsEpisodeStatus = (typeof RANDOM_ROOMS_EPISODE_STATUSES)[number];
export type RandomRoomsScenePurpose = (typeof RANDOM_ROOMS_SCENE_PURPOSES)[number];
export type RandomRoomsSceneStatus = (typeof RANDOM_ROOMS_SCENE_STATUSES)[number];
export type RandomRoomsShotStatus = (typeof RANDOM_ROOMS_SHOT_STATUSES)[number];

export type CharacterVoiceProfile = {
  voiceProviderHint: string | null;
  voiceId: string | null;
  voiceStyle: string | null;
  voiceNotes: string | null;
};

export type ChannelProfile = {
  id: string;
  name: string;
  niche: string;
  audience: string;
  language: string;
  tone: string;
  videoStyle: string;
  contentPillars: string[];
  ctaStyle: string;
  doNotSay: string[];
  competitorChannels: string[];
  monetizationGoal: string;
  createdAt: string;
  updatedAt: string;
};

export type Idea = {
  id: string;
  idea: string;
  pillar: string;
  audiencePain: string;
  videoType: string;
  priority: number;
  status: IdeaStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResearchBrief = {
  id: string;
  projectId: string;
  topic: string;
  referenceLinks: string[];
  viewerPain: string;
  videoPromise: string;
  mainPoints: string[];
  examples: string[];
  commonMistakes: string[];
  contrarianAngle: string;
  hookAngles: string[];
  titleAngles: string[];
  createdAt: string;
};

export type ScriptVersion = {
  id: string;
  projectId: string;
  scriptType: ScriptType;
  versionName: string;
  hook: string;
  intro: string;
  body: string;
  cta: string;
  outro: string;
  visualNotes: string[];
  onScreenText: string[];
  contentMarkdown: string;
  createdAt: string;
};

export type ThumbnailPack = {
  id: string;
  projectId: string;
  textOptions: string[];
  visualConcepts: string[];
  emotionAngle: string;
  imageGenerationPrompts: string[];
  canvaInstructions: string;
  photoshopInstructions: string;
  createdAt: string;
};

export type UploadPack = {
  id: string;
  projectId: string;
  titleOptions: string[];
  finalTitle: string;
  description: string;
  tags: string[];
  hashtags: string[];
  chapters: string[];
  pinnedComment: string;
  communityPost: string;
  shortsCutdownIdeas: string[];
  uploadChecklist: string[];
  createdAt: string;
};

export type PerformanceEntry = {
  id: string;
  projectId: string;
  publishDate: string;
  views24h: number | null;
  views7d: number | null;
  ctr: number | null;
  avgViewDuration: string | null;
  subscriberGain: number | null;
  commentsSummary: string | null;
  whatWorked: string | null;
  whatFailed: string | null;
  improvementNotes: string[];
  nextVideoIdeas: string[];
  createdAt: string;
  updatedAt: string;
};

export type GenerationLog = {
  id: string;
  featureName: string;
  provider: string;
  providerId: string | null;
  providerKind: string | null;
  model: string;
  status: GenerationLogStatus;
  attemptCount: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costEstimate: number | null;
  durationMs: number | null;
  projectId: string | null;
  projectTopic: string | null;
  createdAt: string;
};

export type RandomRoomsCharacter = {
  id: string;
  seriesId: string;
  code: string;
  name: string;
  role: string;
  characterType: string;
  personality: string[];
  speakingStyle: string[];
  catchphrases: string[];
  doNotSay: string[];
  visualDescription: string;
  signatureTraits: string[];
  voiceProfile: CharacterVoiceProfile;
  continuityNotes: string | null;
  referenceAssetNotes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsRelationshipCharacter = {
  id: string;
  code: string;
  name: string;
  characterType: string;
  active: boolean;
};

export type RandomRoomsCharacterRelationship = {
  id: string;
  seriesId: string;
  characterAId: string;
  characterBId: string;
  characterA: RandomRoomsRelationshipCharacter | null;
  characterB: RandomRoomsRelationshipCharacter | null;
  relationshipType: string;
  dynamic: string;
  conflictPattern: string;
  comedyPattern: string;
  continuityNotes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsRoomProfile = {
  id: string;
  seriesId: string;
  code: string;
  name: string;
  roomType: string;
  description: string;
  visualStyle: string;
  lighting: string;
  colorMood: string;
  cameraConstraints: string[];
  props: string[];
  environmentRules: string[];
  continuityNotes: string | null;
  referenceAssetNotes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsEpisodeCharacterProfile = {
  id: string;
  code: string;
  name: string;
  role: string;
  characterType: string;
  active: boolean;
};

export type RandomRoomsEpisodeCharacter = {
  id: string;
  episodeId: string;
  characterId: string;
  character: RandomRoomsEpisodeCharacterProfile | null;
  roleInEpisode: string;
  priority: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsDialogueShot = {
  id: string;
  shotNumber: number;
  shotType: string;
};

export type RandomRoomsDialogueLine = {
  id: string;
  sceneId: string;
  shotId: string | null;
  shot: RandomRoomsDialogueShot | null;
  characterId: string;
  character: RandomRoomsEpisodeCharacterProfile | null;
  lineNumber: number;
  text: string;
  emotion: string | null;
  deliveryStyle: string | null;
  captionText: string;
  startOffsetMs: number | null;
  durationEstimateMs: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsShot = {
  id: string;
  sceneId: string;
  shotNumber: number;
  shotType: string;
  cameraFraming: string;
  cameraMovement: string;
  actionDescription: string;
  visualDescription: string;
  imagePrompt: string;
  videoPrompt: string;
  durationSec: number;
  emotion: string;
  continuityNotes: string | null;
  status: RandomRoomsShotStatus;
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsScene = {
  id: string;
  episodeId: string;
  sceneNumber: number;
  roomId: string | null;
  room: RandomRoomsRoomProfile | null;
  title: string;
  summary: string;
  purpose: RandomRoomsScenePurpose | string;
  beat: string;
  durationSec: number;
  status: RandomRoomsSceneStatus;
  notes: string | null;
  shots: RandomRoomsShot[];
  dialogueLines: RandomRoomsDialogueLine[];
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsEpisodeReview = {
  characterCount: number;
  sceneCount: number;
  shotCount: number;
  dialogueLineCount: number;
  plannedDurationSec: number;
  targetDurationSec: number;
  durationDeltaSec: number;
  durationSource: "shots" | "scenes" | "none";
  missingRooms: number;
  missingPrompts: number;
  durationWarning: string | null;
};

export type RandomRoomsEpisode = {
  id: string;
  seriesId: string;
  episodeNumber: number;
  code: string;
  title: string;
  premise: string;
  hook: string;
  comedyAngle: string;
  targetDurationSec: number;
  targetAspectRatio: string;
  language: string;
  status: RandomRoomsEpisodeStatus;
  notes: string | null;
  characterAssignments: RandomRoomsEpisodeCharacter[];
  scenes: RandomRoomsScene[];
  review: RandomRoomsEpisodeReview;
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsSeries = {
  id: string;
  name: string;
  slug: string;
  concept: string;
  tone: string;
  language: string;
  targetFormat: string;
  defaultDurationSec: number;
  contentRules: string[];
  active: boolean;
  characters: RandomRoomsCharacter[];
  relationships: RandomRoomsCharacterRelationship[];
  rooms: RandomRoomsRoomProfile[];
  episodes: RandomRoomsEpisode[];
  createdAt: string;
  updatedAt: string;
};

export type RandomRoomsData = {
  series: RandomRoomsSeries[];
};

export type VideoProject = {
  id: string;
  ideaId: string | null;
  topic: string;
  pillar: string;
  videoType: string;
  targetLength: string;
  language: string;
  status: ProjectStatus;
  notes: string | null;
  researchBriefs: ResearchBrief[];
  scripts: ScriptVersion[];
  thumbnailPacks: ThumbnailPack[];
  uploadPacks: UploadPack[];
  performanceEntries: PerformanceEntry[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardData = {
  channel: ChannelProfile | null;
  ideas: Idea[];
  projects: VideoProject[];
  logs: GenerationLog[];
  randomRooms: RandomRoomsData;
  providerStatus: import("@/lib/providers/types").ProviderStatusSnapshot;
  dbAvailable: boolean;
  dbMessage?: string;
};

export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
      message?: string;
    }
  | {
      ok: false;
      error: string;
      details?: unknown;
    };
