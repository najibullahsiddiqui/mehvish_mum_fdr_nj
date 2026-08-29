import type { ChannelProfile, ScriptType, VideoProject } from "@/lib/types";

type PromptChannel = Pick<
  ChannelProfile,
  | "name"
  | "niche"
  | "audience"
  | "language"
  | "tone"
  | "videoStyle"
  | "contentPillars"
  | "ctaStyle"
  | "doNotSay"
  | "competitorChannels"
  | "monetizationGoal"
>;

type PromptProject = Pick<VideoProject, "topic" | "pillar" | "videoType" | "targetLength" | "language" | "notes">;

export const CREATOR_SYSTEM_PROMPT = [
  "You are CreatorPilot Personal, a private YouTube planning assistant.",
  "You help one creator produce practical, non-hype YouTube videos from idea to upload-ready package.",
  "Prefer concrete examples, clear structure, and Hinglish phrasing when the channel language asks for it.",
  "Avoid claims that guarantee income, growth, or results.",
  "Return only valid JSON with no markdown fences, no comments, and no prose outside JSON.",
].join(" ");

function channelBlock(channel: PromptChannel | null) {
  if (!channel) {
    return "No channel profile is saved yet. Use a practical, friendly, direct creator voice.";
  }

  return JSON.stringify(
    {
      name: channel.name,
      niche: channel.niche,
      audience: channel.audience,
      language: channel.language,
      tone: channel.tone,
      videoStyle: channel.videoStyle,
      contentPillars: channel.contentPillars,
      ctaStyle: channel.ctaStyle,
      doNotSay: channel.doNotSay,
      competitorChannels: channel.competitorChannels,
      monetizationGoal: channel.monetizationGoal,
    },
    null,
    2,
  );
}

function projectBlock(project: PromptProject) {
  return JSON.stringify(
    {
      topic: project.topic,
      pillar: project.pillar,
      videoType: project.videoType,
      targetLength: project.targetLength,
      language: project.language,
      notes: project.notes,
    },
    null,
    2,
  );
}

export function buildResearchPrompt(input: {
  topic: string;
  channel: PromptChannel | null;
  notes?: string;
  referenceLinks?: string[];
}) {
  return `
Create a research brief for this YouTube video.

Channel profile:
${channelBlock(input.channel)}

Topic: ${input.topic}
Creator notes: ${input.notes || "None"}
Reference links:
${(input.referenceLinks || []).map((link) => `- ${link}`).join("\n") || "- None"}

Return JSON in this exact shape:
{
  "viewerPain": "specific viewer pain",
  "videoPromise": "specific promise of the video",
  "mainPoints": ["point 1", "point 2", "point 3"],
  "examples": ["example 1", "example 2"],
  "commonMistakes": ["mistake 1", "mistake 2"],
  "contrarianAngle": "a useful non-obvious angle",
  "hookAngles": ["hook 1", "hook 2", "hook 3"],
  "titleAngles": ["title angle 1", "title angle 2", "title angle 3"]
}`.trim();
}

export function buildScriptPrompt(input: {
  project: PromptProject;
  channel: PromptChannel | null;
  scriptType: ScriptType;
  notes?: string;
}) {
  const typeInstructions: Record<ScriptType, string> = {
    long_form: "Write a detailed long-form YouTube script with strong retention, clear sections, examples, CTA, and outro.",
    shorts: "Write a short vertical script under 60 seconds with a fast hook, tight beats, and a punchy ending.",
    faceless_voiceover: "Write a faceless voiceover script with visual direction, B-roll notes, and concise narration.",
    screen_recording_tutorial:
      "Write a screen-recording tutorial script with step-by-step actions, cursor/visual notes, and on-screen labels.",
  };

  return `
${typeInstructions[input.scriptType]}

Channel profile:
${channelBlock(input.channel)}

Project:
${projectBlock(input.project)}

Extra notes: ${input.notes || "None"}

The script must include hook, intro, main sections, examples, CTA, outro, visual notes, and on-screen text.

Return JSON in this exact shape:
{
  "hook": "opening hook",
  "intro": "intro narration",
  "sections": [
    {
      "heading": "section heading",
      "narration": "script narration",
      "example": "specific example",
      "visualNotes": ["visual note"],
      "onScreenText": ["on screen text"]
    }
  ],
  "cta": "call to action",
  "outro": "outro",
  "visualNotes": ["global visual note"],
  "onScreenText": ["global on-screen text"],
  "markdown": "complete script in clean markdown"
}`.trim();
}

export function buildThumbnailPrompt(input: {
  project: PromptProject;
  channel: PromptChannel | null;
  notes?: string;
}) {
  return `
Generate thumbnail strategy for this YouTube project.

Channel profile:
${channelBlock(input.channel)}

Project:
${projectBlock(input.project)}

Extra notes: ${input.notes || "None"}

Return JSON in this exact shape:
{
  "textOptions": ["2-5 word thumbnail text option"],
  "visualConcepts": ["clear visual concept"],
  "emotionAngle": "dominant emotion to trigger",
  "imageGenerationPrompts": ["detailed prompt for an image model"],
  "canvaInstructions": "step-by-step Canva layout instructions",
  "photoshopInstructions": "step-by-step Photoshop layout instructions"
}`.trim();
}

export function buildUploadPackPrompt(input: {
  project: PromptProject;
  channel: PromptChannel | null;
  notes?: string;
}) {
  return `
Create an upload-ready YouTube metadata pack.

Channel profile:
${channelBlock(input.channel)}

Project:
${projectBlock(input.project)}

Extra notes: ${input.notes || "None"}

Return JSON in this exact shape:
{
  "titleOptions": ["title option"],
  "finalTitle": "best final title",
  "description": "full YouTube description",
  "tags": ["tag"],
  "hashtags": ["#hashtag"],
  "chapters": ["00:00 Chapter name"],
  "pinnedComment": "pinned comment",
  "communityPost": "community post",
  "shortsCutdownIdeas": ["shorts idea"],
  "uploadChecklist": ["checklist item"]
}`.trim();
}

export function buildPerformancePrompt(input: {
  project: PromptProject;
  channel: PromptChannel | null;
  metrics: Record<string, unknown>;
}) {
  return `
Analyze this published YouTube video's manual performance journal and generate improvement notes plus next video ideas.

Channel profile:
${channelBlock(input.channel)}

Project:
${projectBlock(input.project)}

Performance metrics and creator notes:
${JSON.stringify(input.metrics, null, 2)}

Return JSON in this exact shape:
{
  "improvementNotes": ["specific improvement note"],
  "nextVideoIdeas": ["specific next video idea"]
}`.trim();
}
