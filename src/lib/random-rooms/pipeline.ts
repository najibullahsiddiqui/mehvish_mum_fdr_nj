export type PipelineJobLike = { jobType: string; status: string };

export type PipelineSummaryInput = {
  dialogueLines: Array<{ id: string; hasVoice: boolean }>;
  shots: Array<{ id: string; hasImage: boolean; hasVideo: boolean }>;
  hasFinalVideo: boolean;
  jobs: PipelineJobLike[];
};

const ACTIVE = new Set(["SUBMITTING", "QUEUED", "RUNNING", "IN_QUEUE", "IN_PROGRESS"]);
const FAILED = new Set(["FAILED", "TIMED_OUT", "CANCELLED"]);

function stage(total: number, ready: number, jobs: PipelineJobLike[], jobType: string) {
  const relevant = jobs.filter((job) => job.jobType === jobType);
  return {
    total,
    ready,
    missing: Math.max(0, total - ready),
    active: relevant.filter((job) => ACTIVE.has(job.status)).length,
    failed: relevant.filter((job) => FAILED.has(job.status)).length,
  };
}

export function summarizePipelineState(input: PipelineSummaryInput) {
  const voiceReady = input.dialogueLines.filter((line) => line.hasVoice).length;
  const imageReady = input.shots.filter((shot) => shot.hasImage).length;
  const videoReady = input.shots.filter((shot) => shot.hasVideo).length;
  const voice = stage(input.dialogueLines.length, voiceReady, input.jobs, "VOICE");
  const image = stage(input.shots.length, imageReady, input.jobs, "IMAGE");
  const video = stage(input.shots.length, videoReady, input.jobs, "VIDEO");
  const renderReady = voice.missing === 0 && video.missing === 0 && input.shots.length > 0;

  let overallStatus = "NEEDS_MEDIA";
  if (input.hasFinalVideo) overallStatus = "COMPLETE";
  else if (input.jobs.some((job) => ACTIVE.has(job.status))) overallStatus = "GENERATING";
  else if (renderReady) overallStatus = "READY_TO_RENDER";

  return {
    voice,
    image,
    video,
    render: { ready: renderReady, complete: input.hasFinalVideo },
    overallStatus,
  };
}
