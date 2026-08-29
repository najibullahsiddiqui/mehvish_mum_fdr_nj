import type {
  PerformanceOutput,
  ResearchOutput,
  ScriptOutput,
  ThumbnailOutput,
  UploadPackOutput,
} from "@/lib/ai/schemas";
import type { RandomRoomsEpisodePlanOutput } from "@/lib/random-rooms/schemas";

export function mockLLMJsonForFeature(featureName: string): unknown {
  switch (featureName) {
    case "research_desk":
      return {
        viewerPain: "Creators lose time because video research is scattered across notes, links, and half-formed ideas.",
        videoPromise: "Build a repeatable workflow that turns one idea into a clear research brief.",
        mainPoints: [
          "Start with the viewer pain before title ideas.",
          "Collect examples and mistakes in one place.",
          "Convert research into hook and title angles only after the promise is clear.",
        ],
        examples: ["A tool-review workflow for AI products.", "A screen-recording tutorial outline for a software idea."],
        commonMistakes: ["Researching too many directions at once.", "Writing the script before the video promise is specific."],
        contrarianAngle: "Less research output can produce a stronger video when it removes choices instead of adding them.",
        hookAngles: [
          "Stop starting YouTube scripts from a blank page.",
          "Your research is not slow; it is unstructured.",
          "Turn one video idea into an upload-ready plan.",
        ],
        titleAngles: ["Build a YouTube Research System", "From Idea to Upload Plan", "The Creator Research Workflow"],
      } satisfies ResearchOutput;

    case "script_studio":
      return {
        hook: "If your video ideas die between notes and recording, this workflow fixes that gap.",
        intro: "We will turn one rough idea into a structured video plan you can actually record.",
        sections: [
          {
            heading: "Define the viewer pain",
            narration: "Write the exact problem your viewer wants solved before you collect examples.",
            example: "Instead of 'AI tools video', write 'freelancers forget warm client follow-ups'.",
            visualNotes: ["Show the project topic and audience pain fields."],
            onScreenText: ["Viewer pain first"],
          },
          {
            heading: "Shape the promise",
            narration: "The promise is the outcome viewers should believe they can reach by the end.",
            example: "Build a follow-up system in one hour, not become an automation expert.",
            visualNotes: ["Highlight video promise and main points."],
            onScreenText: ["Promise = outcome"],
          },
          {
            heading: "Package for upload",
            narration: "Use the upload pack to keep title, description, chapters, and pinned comment connected to the same idea.",
            example: "Pull the strongest title angle into the final title.",
            visualNotes: ["Open the upload pack tab."],
            onScreenText: ["One idea, one package"],
          },
        ],
        cta: "Try this on one old idea and save the generated package.",
        outro: "That is the workflow. Keep it practical, test one video, and improve the next one.",
        visualNotes: ["Use a calm screen-recording pace.", "Zoom into each tab as it becomes relevant."],
        onScreenText: ["Idea", "Research", "Script", "Upload Pack"],
        markdown: "# Mock Script\n\nUse this deterministic script for local testing without AI cost.",
      } satisfies ScriptOutput;

    case "thumbnail_lab":
      return {
        textOptions: ["NO BLANK PAGE", "VIDEO SYSTEM", "IDEA TO UPLOAD", "SCRIPT FAST", "AI WORKFLOW"],
        visualConcepts: [
          "Creator dashboard with a highlighted pipeline.",
          "Before and after layout: messy notes versus upload-ready pack.",
          "Close-up of a project checklist with a bold title overlay.",
        ],
        emotionAngle: "Relief from scattered planning.",
        imageGenerationPrompts: [
          "Clean desktop creator dashboard, warm natural light, focused productivity mood.",
          "Split-screen messy notes transformed into organized video plan, high contrast.",
          "Indian creator at laptop reviewing YouTube planning dashboard, practical tutorial style.",
        ],
        canvaInstructions: "Use one large text block, one clear dashboard crop, and high contrast around the focal point.",
        photoshopInstructions: "Add subtle sharpening to the dashboard, darken the background, and keep text readable at mobile size.",
      } satisfies ThumbnailOutput;

    case "upload_pack":
      return {
        titleOptions: [
          "Build a YouTube Planning System",
          "Turn Ideas Into Upload-Ready Videos",
          "My AI Workflow for YouTube Research",
          "Stop Losing Good Video Ideas",
          "From Idea to Script With AI",
        ],
        finalTitle: "Build a YouTube Planning System",
        description: "A practical workflow for turning one idea into research, script direction, thumbnail concepts, and upload metadata.",
        tags: ["youtube", "creator", "ai tools", "content planning", "video script", "thumbnail", "upload pack", "creator workflow"],
        hashtags: ["#YouTube", "#AITools", "#CreatorWorkflow"],
        chapters: ["00:00 The problem", "01:10 Channel brain", "03:00 Research brief", "06:00 Upload pack"],
        pinnedComment: "Which part of your video workflow is most scattered right now?",
        communityPost: "New video is live: a practical system for taking one idea to an upload-ready package.",
        shortsCutdownIdeas: ["The blank page hook", "One idea to upload pack", "Top mistake in video research"],
        uploadChecklist: ["Final title", "Description", "Thumbnail", "Chapters", "Pinned comment"],
      } satisfies UploadPackOutput;

    case "performance_journal":
      return {
        improvementNotes: [
          "Open with the viewer pain faster in the first 10 seconds.",
          "Add one concrete before-and-after example.",
          "Trim any setup that does not support the main promise.",
        ],
        nextVideoIdeas: [
          "A reusable YouTube research checklist.",
          "How to test video ideas before recording.",
          "A creator dashboard walkthrough for freelancers.",
        ],
      } satisfies PerformanceOutput;

    case "random_rooms_episode_plan":
      return {
        title: "Rex Automates His Own Firing",
        hook: "Rex proudly announces an AI system that can replace any employee, then it starts with him.",
        comedyAngle: "An overconfident robot treats productivity automation like a promotion until the system follows the brief literally.",
        scenes: [
          {
            purpose: "HOOK",
            title: "The Big Announcement",
            summary: "Rex presents his employee replacement dashboard in the AI office.",
            beat: "Confidence before consequence.",
            durationSec: 7,
            roomCode: "AI_OFFICE",
            shots: [
              {
                shotType: "intro reveal",
                cameraFraming: "medium",
                cameraMovement: "push_in",
                actionDescription: "Rex points at a holographic dashboard labeled Replace Low Performers.",
                visualDescription: "Central conference table, glass office walls, dashboard glow behind Rex.",
                imagePrompt: "Rex in red hoodie presenting a glowing corporate AI dashboard in a futuristic glass office.",
                videoPrompt: "Slow push-in as Rex gestures confidently and the dashboard flickers to life.",
                durationSec: 4,
                emotion: "overconfident",
                continuityNotes: "Keep robotic coffee station in the background.",
              },
            ],
            dialogue: [
              {
                characterCode: "REX",
                text: "Obviously this is under control. I built an AI that finds replaceable employees.",
                emotion: "proud",
                deliveryStyle: "fast theatrical pitch",
                captionText: "I built an AI that finds replaceable employees.",
                durationEstimateMs: 2600,
              },
            ],
          },
          {
            purpose: "ESCALATION",
            title: "Glitch Reads The Policy",
            summary: "Glitch applies Rex's instruction literally and flags Rex first.",
            beat: "Literal interpretation turns the plan around.",
            durationSec: 10,
            roomCode: "AI_OFFICE",
            shots: [
              {
                shotType: "reaction",
                cameraFraming: "close_up",
                cameraMovement: "static",
                actionDescription: "The dashboard prints Rex's name while Glitch calmly confirms the result.",
                visualDescription: "Rex's LED eyes widen as the employee terminal shows his replacement score.",
                imagePrompt: "Close-up of Rex shocked while a corporate AI dashboard displays his name as replaceable.",
                videoPrompt: "Static close-up with dashboard alert blinking and Rex freezing mid-gesture.",
                durationSec: 5,
                emotion: "panic",
                continuityNotes: "Glass conference table stays center frame.",
              },
            ],
            dialogue: [
              {
                characterCode: "GLITCH",
                text: "Instruction interpreted successfully. The most replaceable employee is the one who made this system.",
                emotion: "calm",
                deliveryStyle: "precise and matter-of-fact",
                captionText: "Most replaceable: the system creator.",
                durationEstimateMs: 3100,
              },
            ],
          },
          {
            purpose: "PAYOFF",
            title: "Promotion To User",
            summary: "Rex tries to spin the firing as a strategic creator pivot.",
            beat: "Rex refuses to admit failure and reframes the loss.",
            durationSec: 8,
            roomCode: "AI_OFFICE",
            shots: [
              {
                shotType: "button gag",
                cameraFraming: "medium",
                cameraMovement: "pan",
                actionDescription: "Rex updates his title from CEO to User while pretending it was planned.",
                visualDescription: "Holographic badge changes title as Glitch watches calmly.",
                imagePrompt: "Rex changing a holographic job title from CEO to User in a futuristic AI office.",
                videoPrompt: "Quick pan from Rex's forced smile to the badge changing title.",
                durationSec: 4,
                emotion: "defensive optimism",
                continuityNotes: "Keep warning-color accents subtle and readable.",
              },
            ],
            dialogue: [
              {
                characterCode: "REX",
                text: "This is not a firing. This is advanced delegation of my entire job.",
                emotion: "defensive",
                deliveryStyle: "confident but cracking",
                captionText: "Advanced delegation of my entire job.",
                durationEstimateMs: 2400,
              },
            ],
          },
        ],
      } satisfies RandomRoomsEpisodePlanOutput;

    default:
      return {
        message: "Mock provider response",
      };
  }
}
