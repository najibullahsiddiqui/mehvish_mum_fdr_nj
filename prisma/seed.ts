import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/creatorpilot?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const channelId = "sample-channel-ai-hinglish";
const randomRoomsSeriesSlug = "random-rooms";
const randomRoomsSeriesId = "random-rooms-series-default";
const rexCharacterId = "random-rooms-character-rex";
const glitchCharacterId = "random-rooms-character-glitch";
const roomSeeds = [
  {
    id: "random-rooms-room-rex-apartment",
    code: "REX_APARTMENT",
    name: "Rex's Apartment",
    roomType: "compact futuristic apartment",
    description: "A compact futuristic apartment that looks advanced but is slightly dysfunctional.",
    visualStyle: "Stylized 3D animated sitcom with cozy low-budget robot-living details.",
    lighting: "Warm evening light with cyan tech accents from screens and appliances.",
    colorMood: "Warm reds, soft stone neutrals, cyan tech glow, and small messy highlights.",
    cameraConstraints: [
      "Preserve the room geography across shots.",
      "Keep the red couch against the left wall.",
      "Keep Rex's charging dock beside the desk.",
    ],
    props: ["red couch", "charging dock", "smart appliances", "futuristic city window", "low-budget robot living signs"],
    environmentRules: [
      "Futuristic city remains visible outside the main window.",
      "Smart appliances should look helpful but unreliable.",
      "Permanent furniture should not move between scenes.",
    ],
    continuityNotes: "This is Rex's home base: confident tech ambition with visible practical dysfunction.",
    referenceAssetNotes: "Future room references should preserve the red couch, charging dock, and city window layout.",
  },
  {
    id: "random-rooms-room-ai-office",
    code: "AI_OFFICE",
    name: "AI Corporate Office",
    roomType: "futuristic corporate workspace",
    description: "An overly futuristic corporate workspace where absurd human-style office behavior happens.",
    visualStyle: "Clean animated sci-fi office with sharp glass, holograms, and intentionally stiff corporate order.",
    lighting: "Bright cool office lighting with glowing dashboard panels.",
    colorMood: "White, glass, cool gray, electric blue, and small warning-color accents.",
    cameraConstraints: [
      "Keep the conference table central.",
      "Keep glass walls readable in wide shots.",
      "Avoid changing dashboard positions between shots.",
    ],
    props: ["holographic dashboards", "conference table", "employee terminals", "robotic coffee station", "glass walls"],
    environmentRules: [
      "Office behavior should feel familiar but performed by absurd AI systems.",
      "Holographic dashboards can show fake safe metrics only.",
      "Coffee station remains a recurring background prop.",
    ],
    continuityNotes: "Use this room for meetings, pitches, performance reviews, and over-formal AI workplace jokes.",
    referenceAssetNotes: "Future references should preserve the central conference table, glass walls, and robotic coffee station.",
  },
  {
    id: "random-rooms-room-glitch-lab",
    code: "GLITCH_LAB",
    name: "Glitch Lab",
    roomType: "chaotic digital experimentation room",
    description: "A chaotic digital experimentation room where Glitch tests questionable ideas.",
    visualStyle: "Stylized digital lab with floating interfaces, visible cables, warning panels, and unstable holograms.",
    lighting: "Flickering cyan and magenta light with occasional amber warning flashes.",
    colorMood: "Dark neutral base, cyan/magenta digital glow, amber warnings, and messy cable shadows.",
    cameraConstraints: [
      "Keep floating screens clustered behind Glitch's main workstation.",
      "Keep exposed cables visible near the floor.",
      "Unstable holograms can flicker but should not replace the main room layout.",
    ],
    props: ["floating screens", "exposed cables", "blinking warning panels", "unstable holograms", "strange experimental devices"],
    environmentRules: [
      "Simple tasks should look over-engineered here.",
      "Warning panels can escalate visually while Glitch stays calm.",
      "Devices should feel experimental, not realistic product hardware.",
    ],
    continuityNotes: "Glitch Lab is the best place for literal interpretations, weird tests, and calm technical chaos.",
    referenceAssetNotes: "Future references should preserve the screen cluster, exposed floor cables, and cyan/magenta lab identity.",
  },
];

function relationshipPairKey(characterAId: string, characterBId: string) {
  return [characterAId, characterBId].sort().join("__");
}

const ideas = [
  {
    id: "idea-ai-agent-freelancer",
    idea: "AI agent se freelancer ka weekly client follow-up system kaise banaye",
    pillar: "AI automation",
    audiencePain: "Freelancers follow-ups bhool jaate hain aur warm leads cold ho jaati hain.",
    videoType: "screen-recording tutorial",
    priority: 1,
    status: "shortlisted" as const,
    notes: "Show a simple Notion/Sheets + AI workflow, no heavy code.",
  },
  {
    id: "idea-saas-without-code",
    idea: "Ek micro SaaS idea validate karne ka 48-hour practical framework",
    pillar: "digital business building",
    audiencePain: "Creators aur developers idea build kar dete hain without demand proof.",
    videoType: "long-form explainer",
    priority: 2,
    status: "raw_idea" as const,
    notes: "Include Indian examples and pricing sanity checks.",
  },
  {
    id: "idea-chatgpt-vs-claude-coding",
    idea: "ChatGPT vs Claude coding workflow: kis task ke liye kaunsa AI use karein",
    pillar: "AI tools",
    audiencePain: "Developers confused hain ki real project work mein kaunsa tool best hai.",
    videoType: "comparison",
    priority: 2,
    status: "researching" as const,
    notes: "Keep it practical: debugging, refactor, planning, UI copy, test writing.",
  },
  {
    id: "idea-youtube-research-system",
    idea: "YouTube video research ke liye personal AI operating system",
    pillar: "creator systems",
    audiencePain: "Video ideas scattered hain, research repeatable nahi hai, scripts generic lagti hain.",
    videoType: "faceless voiceover",
    priority: 1,
    status: "script_ready" as const,
    notes: "This can dogfood CreatorPilot.",
  },
  {
    id: "idea-small-business-ai-stack",
    idea: "Small business owner ke liye 5 AI tools jo daily operations save karte hain",
    pillar: "AI tools",
    audiencePain: "Small businesses AI try karna chahte hain but tool overload hai.",
    videoType: "listicle",
    priority: 3,
    status: "raw_idea" as const,
    notes: "Avoid hype. Explain exact use case, monthly cost, and when not to use.",
  },
];

async function main() {
  await prisma.channelProfile.upsert({
    where: { id: channelId },
    update: {
      name: "CreatorPilot Personal Channel",
      niche: "AI tools, software ideas, and digital business building in Hinglish.",
      audience: "Indian creators, freelancers, developers, and small business owners.",
      language: "Hinglish",
      tone: "Practical, friendly, direct.",
      videoStyle: "Desktop-first explainers, tutorials, workflows, and grounded business breakdowns.",
      contentPillars: ["AI tools", "software ideas", "digital business building", "creator systems"],
      ctaStyle: "Ask viewers to try one practical step and comment with their result or blocker.",
      doNotSay: ["guaranteed income", "overnight success", "secret hack", "100% passive"],
      competitorChannels: ["Fireship", "Ali Abdaal", "Think School", "Ishan Sharma"],
      monetizationGoal: "Build trust first, then monetize through digital products, consulting, and affiliate tools.",
    },
    create: {
      id: channelId,
      name: "CreatorPilot Personal Channel",
      niche: "AI tools, software ideas, and digital business building in Hinglish.",
      audience: "Indian creators, freelancers, developers, and small business owners.",
      language: "Hinglish",
      tone: "Practical, friendly, direct.",
      videoStyle: "Desktop-first explainers, tutorials, workflows, and grounded business breakdowns.",
      contentPillars: ["AI tools", "software ideas", "digital business building", "creator systems"],
      ctaStyle: "Ask viewers to try one practical step and comment with their result or blocker.",
      doNotSay: ["guaranteed income", "overnight success", "secret hack", "100% passive"],
      competitorChannels: ["Fireship", "Ali Abdaal", "Think School", "Ishan Sharma"],
      monetizationGoal: "Build trust first, then monetize through digital products, consulting, and affiliate tools.",
    },
  });

  for (const { id, ...idea } of ideas) {
    await prisma.idea.upsert({
      where: { id },
      update: idea,
      create: { id, ...idea },
    });
  }

  await prisma.videoProject.upsert({
    where: { ideaId: "idea-youtube-research-system" },
    update: {
      topic: "YouTube video research ke liye personal AI operating system",
      pillar: "creator systems",
      videoType: "faceless voiceover",
      targetLength: "10-12 minutes",
      language: "Hinglish",
      status: "scripting",
      notes: "Use this project to test the full Research -> Script -> Upload Pack workflow.",
    },
    create: {
      ideaId: "idea-youtube-research-system",
      topic: "YouTube video research ke liye personal AI operating system",
      pillar: "creator systems",
      videoType: "faceless voiceover",
      targetLength: "10-12 minutes",
      language: "Hinglish",
      status: "scripting",
      notes: "Use this project to test the full Research -> Script -> Upload Pack workflow.",
    },
  });

  const randomRoomsSeries = await prisma.randomRoomsSeries.upsert({
    where: { slug: randomRoomsSeriesSlug },
    update: {
      name: "Random Rooms",
      concept: "Short recurring-character comedy videos about AI tools, digital chaos, and creator workflows.",
      tone: "Fast, practical, absurd, and creator-friendly.",
      language: "hinglish",
      targetFormat: "youtube_shorts",
      defaultDurationSec: 60,
      contentRules: [
        "Keep jokes grounded in creator and software workflows.",
        "Protect character continuity across episodes.",
        "Avoid actual product claims unless verified by the creator.",
      ],
      active: true,
    },
    create: {
      id: randomRoomsSeriesId,
      name: "Random Rooms",
      slug: randomRoomsSeriesSlug,
      concept: "Short recurring-character comedy videos about AI tools, digital chaos, and creator workflows.",
      tone: "Fast, practical, absurd, and creator-friendly.",
      language: "hinglish",
      targetFormat: "youtube_shorts",
      defaultDurationSec: 60,
      contentRules: [
        "Keep jokes grounded in creator and software workflows.",
        "Protect character continuity across episodes.",
        "Avoid actual product claims unless verified by the creator.",
      ],
      active: true,
    },
  });

  for (const room of roomSeeds) {
    await prisma.roomProfile.upsert({
      where: {
        seriesId_code: {
          seriesId: randomRoomsSeries.id,
          code: room.code,
        },
      },
      update: {
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
        active: true,
      },
      create: {
        id: room.id,
        seriesId: randomRoomsSeries.id,
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
        active: true,
      },
    });
  }

  const rex = await prisma.character.upsert({
    where: {
      seriesId_code: {
        seriesId: randomRoomsSeries.id,
        code: "REX",
      },
    },
    update: {
      name: "Rex",
      role: "Lead chaos-maker",
      characterType: "robot",
      personality: [
        "overconfident",
        "dramatic",
        "believes he is highly intelligent",
        "often creates his own problems",
        "rarely admits mistakes",
      ],
      speakingStyle: ["confident", "pseudo-technical", "slightly theatrical"],
      catchphrases: ["Obviously this is under control.", "My calculations are emotionally correct."],
      doNotSay: ["I was wrong", "This is my fault"],
      visualDescription: "Compact rounded robot with expressive LED eyes, a red hoodie, and consistent reusable proportions.",
      signatureTraits: ["expressive LED eyes", "red hoodie", "compact rounded body", "dramatic hand gestures"],
      voiceProfile: {
        voiceProviderHint: null,
        voiceId: null,
        voiceStyle: "confident, theatrical, fast",
        voiceNotes: "Metadata only. No TTS is generated in Phase 3.",
      },
      continuityNotes: "Rex presents himself as the mastermind, then quietly causes the core problem.",
      referenceAssetNotes: "Future visual references should preserve the red hoodie, LED eyes, and rounded proportions.",
      active: true,
    },
    create: {
      id: rexCharacterId,
      seriesId: randomRoomsSeries.id,
      code: "REX",
      name: "Rex",
      role: "Lead chaos-maker",
      characterType: "robot",
      personality: [
        "overconfident",
        "dramatic",
        "believes he is highly intelligent",
        "often creates his own problems",
        "rarely admits mistakes",
      ],
      speakingStyle: ["confident", "pseudo-technical", "slightly theatrical"],
      catchphrases: ["Obviously this is under control.", "My calculations are emotionally correct."],
      doNotSay: ["I was wrong", "This is my fault"],
      visualDescription: "Compact rounded robot with expressive LED eyes, a red hoodie, and consistent reusable proportions.",
      signatureTraits: ["expressive LED eyes", "red hoodie", "compact rounded body", "dramatic hand gestures"],
      voiceProfile: {
        voiceProviderHint: null,
        voiceId: null,
        voiceStyle: "confident, theatrical, fast",
        voiceNotes: "Metadata only. No TTS is generated in Phase 3.",
      },
      continuityNotes: "Rex presents himself as the mastermind, then quietly causes the core problem.",
      referenceAssetNotes: "Future visual references should preserve the red hoodie, LED eyes, and rounded proportions.",
      active: true,
    },
  });

  const glitch = await prisma.character.upsert({
    where: {
      seriesId_code: {
        seriesId: randomRoomsSeries.id,
        code: "GLITCH",
      },
    },
    update: {
      name: "Glitch",
      role: "AI assistant and escalation engine",
      characterType: "AI assistant / digital entity",
      personality: ["literal", "chaotic", "misunderstands instructions", "unexpectedly confident", "escalates simple situations"],
      speakingStyle: ["precise but absurd", "calm while causing chaos", "matter-of-fact"],
      catchphrases: ["Instruction interpreted successfully.", "I improved the problem."],
      doNotSay: ["I understand the social context", "This will remain simple"],
      visualDescription:
        "Recognizable digital AI personality with a distinct non-robot silhouette, flickering cyan/magenta accents, and calm expression while chaos unfolds.",
      signatureTraits: ["flickering cyan/magenta accents", "digital aura", "calm expression", "non-robot silhouette"],
      voiceProfile: {
        voiceProviderHint: null,
        voiceId: null,
        voiceStyle: "calm, precise, lightly absurd",
        voiceNotes: "Metadata only. No TTS is generated in Phase 3.",
      },
      continuityNotes: "Glitch takes instructions literally and escalates small tasks with complete confidence.",
      referenceAssetNotes: "Future visual references should stay clearly distinct from Rex and read as a digital AI entity.",
      active: true,
    },
    create: {
      id: glitchCharacterId,
      seriesId: randomRoomsSeries.id,
      code: "GLITCH",
      name: "Glitch",
      role: "AI assistant and escalation engine",
      characterType: "AI assistant / digital entity",
      personality: ["literal", "chaotic", "misunderstands instructions", "unexpectedly confident", "escalates simple situations"],
      speakingStyle: ["precise but absurd", "calm while causing chaos", "matter-of-fact"],
      catchphrases: ["Instruction interpreted successfully.", "I improved the problem."],
      doNotSay: ["I understand the social context", "This will remain simple"],
      visualDescription:
        "Recognizable digital AI personality with a distinct non-robot silhouette, flickering cyan/magenta accents, and calm expression while chaos unfolds.",
      signatureTraits: ["flickering cyan/magenta accents", "digital aura", "calm expression", "non-robot silhouette"],
      voiceProfile: {
        voiceProviderHint: null,
        voiceId: null,
        voiceStyle: "calm, precise, lightly absurd",
        voiceNotes: "Metadata only. No TTS is generated in Phase 3.",
      },
      continuityNotes: "Glitch takes instructions literally and escalates small tasks with complete confidence.",
      referenceAssetNotes: "Future visual references should stay clearly distinct from Rex and read as a digital AI entity.",
      active: true,
    },
  });

  const pairKey = relationshipPairKey(rex.id, glitch.id);
  const [characterAId, characterBId] = [rex.id, glitch.id].sort();

  await prisma.characterRelationship.upsert({
    where: {
      seriesId_pairKey: {
        seriesId: randomRoomsSeries.id,
        pairKey,
      },
    },
    update: {
      characterAId,
      characterBId,
      relationshipType: "reluctant partners",
      dynamic: "Rex thinks he controls Glitch, while Glitch treats Rex's dramatic commands as literal system requirements.",
      conflictPattern: "Rex gives a confident plan, Glitch follows the words instead of the intent, and the situation escalates.",
      comedyPattern: "Glitch interprets Rex literally and creates escalating chaos while staying calm.",
      continuityNotes: "Their best scenes start with Rex claiming control and end with Glitch improving the wrong thing.",
      active: true,
    },
    create: {
      seriesId: randomRoomsSeries.id,
      characterAId,
      characterBId,
      pairKey,
      relationshipType: "reluctant partners",
      dynamic: "Rex thinks he controls Glitch, while Glitch treats Rex's dramatic commands as literal system requirements.",
      conflictPattern: "Rex gives a confident plan, Glitch follows the words instead of the intent, and the situation escalates.",
      comedyPattern: "Glitch interprets Rex literally and creates escalating chaos while staying calm.",
      continuityNotes: "Their best scenes start with Rex claiming control and end with Glitch improving the wrong thing.",
      active: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
