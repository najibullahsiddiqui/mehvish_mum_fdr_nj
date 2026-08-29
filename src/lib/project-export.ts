import type { VideoProject } from "@/lib/types";

function list(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None yet";
}

export function projectExportFilename(topic: string) {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);

  return `${slug || "creatorpilot-project"}.md`;
}

export function renderProjectMarkdown(project: VideoProject) {
  const latestResearch = project.researchBriefs[0];
  const latestScript = project.scripts[0];
  const latestThumbnail = project.thumbnailPacks[0];
  const latestUpload = project.uploadPacks[0];
  const latestPerformance = project.performanceEntries[0];

  return `# ${project.topic}

## Project
- Pillar: ${project.pillar}
- Video type: ${project.videoType}
- Target length: ${project.targetLength}
- Language: ${project.language}
- Status: ${project.status}
- Notes: ${project.notes || "None"}

## Research Brief
${latestResearch ? `### Viewer Pain
${latestResearch.viewerPain}

### Video Promise
${latestResearch.videoPromise}

### Main Points
${list(latestResearch.mainPoints)}

### Examples
${list(latestResearch.examples)}

### Common Mistakes
${list(latestResearch.commonMistakes)}

### Contrarian Angle
${latestResearch.contrarianAngle}

### Hook Angles
${list(latestResearch.hookAngles)}

### Title Angles
${list(latestResearch.titleAngles)}` : "No research brief generated yet."}

## Script
${latestScript ? latestScript.contentMarkdown : "No script version saved yet."}

## Thumbnail Lab
${latestThumbnail ? `### Text Options
${list(latestThumbnail.textOptions)}

### Visual Concepts
${list(latestThumbnail.visualConcepts)}

### Emotion Angle
${latestThumbnail.emotionAngle}

### Image Generation Prompts
${list(latestThumbnail.imageGenerationPrompts)}

### Canva Instructions
${latestThumbnail.canvaInstructions}

### Photoshop Instructions
${latestThumbnail.photoshopInstructions}` : "No thumbnail pack generated yet."}

## Upload Pack
${latestUpload ? `### Title Options
${list(latestUpload.titleOptions)}

### Final Title
${latestUpload.finalTitle}

### Description
${latestUpload.description}

### Tags
${list(latestUpload.tags)}

### Hashtags
${list(latestUpload.hashtags)}

### Chapters
${list(latestUpload.chapters)}

### Pinned Comment
${latestUpload.pinnedComment}

### Community Post
${latestUpload.communityPost}

### Shorts Cutdown Ideas
${list(latestUpload.shortsCutdownIdeas)}

### Upload Checklist
${list(latestUpload.uploadChecklist)}` : "No upload pack generated yet."}

## Performance Journal
${latestPerformance ? `### Metrics
- Publish date: ${latestPerformance.publishDate}
- Views after 24h: ${latestPerformance.views24h ?? "n/a"}
- Views after 7 days: ${latestPerformance.views7d ?? "n/a"}
- CTR: ${latestPerformance.ctr ?? "n/a"}
- Average view duration: ${latestPerformance.avgViewDuration ?? "n/a"}
- Subscriber gain: ${latestPerformance.subscriberGain ?? "n/a"}

### Comments Summary
${latestPerformance.commentsSummary || "n/a"}

### What Worked
${latestPerformance.whatWorked || "n/a"}

### What Failed
${latestPerformance.whatFailed || "n/a"}

### Improvement Notes
${list(latestPerformance.improvementNotes)}

### Next Video Ideas
${list(latestPerformance.nextVideoIdeas)}` : "No performance entry saved yet."}
`;
}
