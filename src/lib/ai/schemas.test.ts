import { describe, expect, it } from "vitest";
import {
  performanceOutputSchema,
  researchOutputSchema,
  scriptOutputSchema,
  thumbnailOutputSchema,
  uploadPackOutputSchema,
} from "@/lib/ai/schemas";

describe("AI output schemas", () => {
  it("accepts a complete research output", () => {
    const result = researchOutputSchema.safeParse({
      viewerPain: "Creators lose time researching every video from scratch.",
      videoPromise: "Build a repeatable research workflow.",
      mainPoints: ["Capture source links", "Extract viewer pains", "Turn notes into a brief"],
      examples: ["A tool review workflow", "A tutorial outline workflow"],
      commonMistakes: ["Starting with title ideas only", "Skipping proof examples"],
      contrarianAngle: "Research should reduce choices, not create more options.",
      hookAngles: ["Stop scripting from a blank page", "Your research is too scattered", "Make one reusable video brief"],
      titleAngles: ["Build a YouTube Research System", "AI Video Research Workflow", "From Idea to Brief"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects thin research outputs", () => {
    const result = researchOutputSchema.safeParse({
      viewerPain: "Too little research.",
      videoPromise: "Better briefs.",
      mainPoints: ["Only one point"],
      examples: [],
      commonMistakes: [],
      contrarianAngle: "",
      hookAngles: [],
      titleAngles: [],
    });

    expect(result.success).toBe(false);
  });

  it("applies defaults inside script sections", () => {
    const result = scriptOutputSchema.parse({
      hook: "This workflow saves your next script.",
      intro: "We will build it step by step.",
      sections: [
        {
          heading: "Set the promise",
          narration: "Define the viewer outcome before writing.",
        },
        {
          heading: "Build the outline",
          narration: "Turn the promise into teachable sections.",
          example: "Use three objections as sections.",
        },
      ],
      cta: "Try this on your next idea.",
      outro: "See you in the next one.",
      markdown: "# Script",
    });

    expect(result.sections[0].visualNotes).toEqual([]);
    expect(result.sections[0].onScreenText).toEqual([]);
  });

  it("validates thumbnail, upload pack, and performance outputs", () => {
    expect(
      thumbnailOutputSchema.safeParse({
        textOptions: ["AI SYSTEM", "NO BLANK PAGE", "SCRIPT FAST", "IDEA TO UPLOAD", "RESEARCH OS"],
        visualConcepts: ["Dashboard close-up", "Before and after notes", "Creator at laptop"],
        emotionAngle: "Relief from scattered planning.",
        imageGenerationPrompts: ["Clean creator desk", "Dashboard screenshot style", "Notebook to app transformation"],
        canvaInstructions: "Use bold text with a clear focal point.",
        photoshopInstructions: "Add contrast and subtle shadow around the face.",
      }).success,
    ).toBe(true);

    expect(
      uploadPackOutputSchema.safeParse({
        titleOptions: ["One", "Two", "Three", "Four", "Five"],
        finalTitle: "Build a YouTube Research System",
        description: "A practical workflow for creators.",
        tags: ["ai", "youtube", "creator", "research", "script", "workflow", "tools", "business"],
        hashtags: ["#AI", "#YouTube", "#Creators"],
        chapters: ["00:00 Intro", "01:00 Research", "04:00 Script"],
        pinnedComment: "What will you build first?",
        communityPost: "New workflow video is live.",
        shortsCutdownIdeas: ["Hook clip", "Mistake clip", "Checklist clip"],
        uploadChecklist: ["Title", "Description", "Thumbnail", "Tags", "Pinned comment"],
      }).success,
    ).toBe(true);

    expect(
      performanceOutputSchema.safeParse({
        improvementNotes: ["Sharper hook", "Shorter intro", "More proof examples"],
        nextVideoIdeas: ["Research templates", "Prompt library", "Script review checklist"],
      }).success,
    ).toBe(true);
  });
});
