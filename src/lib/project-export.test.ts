import { describe, expect, it } from "vitest";
import { projectExportFilename, renderProjectMarkdown } from "@/lib/project-export";
import type { VideoProject } from "@/lib/types";

const baseProject: VideoProject = {
  id: "project_1",
  ideaId: "idea_1",
  topic: "CreatorPilot Workflow",
  pillar: "creator systems",
  videoType: "screen-recording tutorial",
  targetLength: "8-10 minutes",
  language: "Hinglish",
  status: "upload_pack",
  notes: null,
  researchBriefs: [],
  scripts: [],
  thumbnailPacks: [],
  uploadPacks: [],
  performanceEntries: [],
  createdAt: "2026-07-07T10:00:00.000Z",
  updatedAt: "2026-07-08T10:00:00.000Z",
};

describe("project export", () => {
  it("creates stable markdown filenames", () => {
    expect(projectExportFilename("CreatorPilot: Idea -> Upload Pack!")).toBe("creatorpilot-idea-upload-pack.md");
    expect(projectExportFilename("!!!")).toBe("creatorpilot-project.md");
  });

  it("renders placeholders when generated assets are missing", () => {
    const markdown = renderProjectMarkdown(baseProject);

    expect(markdown).toContain("# CreatorPilot Workflow");
    expect(markdown).toContain("- Notes: None");
    expect(markdown).toContain("No research brief generated yet.");
    expect(markdown).toContain("No script version saved yet.");
    expect(markdown).toContain("No thumbnail pack generated yet.");
    expect(markdown).toContain("No upload pack generated yet.");
    expect(markdown).toContain("No performance entry saved yet.");
  });

  it("renders the latest project package sections", () => {
    const markdown = renderProjectMarkdown({
      ...baseProject,
      notes: "Use as a dogfood video.",
      researchBriefs: [
        {
          id: "research_1",
          projectId: "project_1",
          topic: "CreatorPilot Workflow",
          referenceLinks: ["https://example.com"],
          viewerPain: "Video planning is scattered.",
          videoPromise: "One repeatable workflow from idea to upload.",
          mainPoints: ["Capture ideas", "Research viewer pain", "Export the upload pack"],
          examples: ["AI tool comparison", "Screen recording tutorial"],
          commonMistakes: ["Starting with the title", "Skipping viewer promise"],
          contrarianAngle: "Less AI output can create better videos.",
          hookAngles: ["Stop starting from a blank page", "Plan faster without generic scripts", "Turn one idea into a package"],
          titleAngles: ["Build a YouTube Planning System", "Idea to Upload Pack", "CreatorPilot Workflow"],
          createdAt: "2026-07-07T10:00:00.000Z",
        },
      ],
      scripts: [
        {
          id: "script_1",
          projectId: "project_1",
          scriptType: "long_form",
          versionName: "AI draft",
          hook: "Hook",
          intro: "Intro",
          body: "Body",
          cta: "CTA",
          outro: "Outro",
          visualNotes: ["Show dashboard"],
          onScreenText: ["Idea to upload"],
          contentMarkdown: "# Script\n\nFull script body",
          createdAt: "2026-07-07T10:10:00.000Z",
        },
      ],
      thumbnailPacks: [
        {
          id: "thumbnail_1",
          projectId: "project_1",
          textOptions: ["AI SYSTEM", "NO BLANK PAGE"],
          visualConcepts: ["Dashboard with checklist"],
          emotionAngle: "Relief",
          imageGenerationPrompts: ["Creator desk with dashboard"],
          canvaInstructions: "Use bold type and a clear focal point.",
          photoshopInstructions: "Add contrast and a soft shadow.",
          createdAt: "2026-07-07T10:20:00.000Z",
        },
      ],
      uploadPacks: [
        {
          id: "upload_1",
          projectId: "project_1",
          titleOptions: ["Build a YouTube Planning System", "Idea to Upload Pack"],
          finalTitle: "Build a YouTube Planning System",
          description: "A practical CreatorPilot workflow.",
          tags: ["ai", "youtube", "creator"],
          hashtags: ["#AI", "#YouTube"],
          chapters: ["00:00 Intro", "01:00 Workflow"],
          pinnedComment: "What part should I build next?",
          communityPost: "New workflow video is live.",
          shortsCutdownIdeas: ["Hook clip", "Checklist clip"],
          uploadChecklist: ["Title", "Thumbnail"],
          createdAt: "2026-07-07T10:30:00.000Z",
        },
      ],
      performanceEntries: [
        {
          id: "performance_1",
          projectId: "project_1",
          publishDate: "2026-07-09T00:00:00.000Z",
          views24h: 500,
          views7d: 2500,
          ctr: 6.8,
          avgViewDuration: "4:21",
          subscriberGain: 44,
          commentsSummary: "Viewers liked the workflow.",
          whatWorked: "Clear promise.",
          whatFailed: "Intro was long.",
          improvementNotes: ["Shorten the intro", "Add more examples"],
          nextVideoIdeas: ["Prompt library", "Research checklist"],
          createdAt: "2026-07-09T01:00:00.000Z",
          updatedAt: "2026-07-09T01:00:00.000Z",
        },
      ],
    });

    expect(markdown).toContain("### Viewer Pain\nVideo planning is scattered.");
    expect(markdown).toContain("- Capture ideas");
    expect(markdown).toContain("# Script\n\nFull script body");
    expect(markdown).toContain("### Text Options\n- AI SYSTEM");
    expect(markdown).toContain("### Final Title\nBuild a YouTube Planning System");
    expect(markdown).toContain("- Views after 24h: 500");
    expect(markdown).toContain("### Next Video Ideas\n- Prompt library");
  });
});
