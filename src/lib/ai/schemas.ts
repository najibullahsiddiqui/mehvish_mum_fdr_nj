import { z } from "zod";

export const researchOutputSchema = z.object({
  viewerPain: z.string().min(1),
  videoPromise: z.string().min(1),
  mainPoints: z.array(z.string()).min(3),
  examples: z.array(z.string()).min(2),
  commonMistakes: z.array(z.string()).min(2),
  contrarianAngle: z.string().min(1),
  hookAngles: z.array(z.string()).min(3),
  titleAngles: z.array(z.string()).min(3),
});

export const scriptOutputSchema = z.object({
  hook: z.string().min(1),
  intro: z.string().min(1),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1),
        narration: z.string().min(1),
        example: z.string().optional().default(""),
        visualNotes: z.array(z.string()).default([]),
        onScreenText: z.array(z.string()).default([]),
      }),
    )
    .min(2),
  cta: z.string().min(1),
  outro: z.string().min(1),
  visualNotes: z.array(z.string()).default([]),
  onScreenText: z.array(z.string()).default([]),
  markdown: z.string().min(1),
});

export const thumbnailOutputSchema = z.object({
  textOptions: z.array(z.string()).min(5),
  visualConcepts: z.array(z.string()).min(3),
  emotionAngle: z.string().min(1),
  imageGenerationPrompts: z.array(z.string()).min(3),
  canvaInstructions: z.string().min(1),
  photoshopInstructions: z.string().min(1),
});

export const uploadPackOutputSchema = z.object({
  titleOptions: z.array(z.string()).min(5),
  finalTitle: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).min(8),
  hashtags: z.array(z.string()).min(3),
  chapters: z.array(z.string()).min(3),
  pinnedComment: z.string().min(1),
  communityPost: z.string().min(1),
  shortsCutdownIdeas: z.array(z.string()).min(3),
  uploadChecklist: z.array(z.string()).min(5),
});

export const performanceOutputSchema = z.object({
  improvementNotes: z.array(z.string()).min(3),
  nextVideoIdeas: z.array(z.string()).min(3),
});

export type ResearchOutput = z.infer<typeof researchOutputSchema>;
export type ScriptOutput = z.infer<typeof scriptOutputSchema>;
export type ThumbnailOutput = z.infer<typeof thumbnailOutputSchema>;
export type UploadPackOutput = z.infer<typeof uploadPackOutputSchema>;
export type PerformanceOutput = z.infer<typeof performanceOutputSchema>;
