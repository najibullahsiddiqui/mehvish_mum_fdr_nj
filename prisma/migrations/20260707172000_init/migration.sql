-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('raw_idea', 'shortlisted', 'researching', 'script_ready', 'recording', 'editing', 'uploaded', 'analyzed');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'researching', 'scripting', 'thumbnail', 'upload_pack', 'recording', 'editing', 'uploaded', 'analyzed', 'archived');

-- CreateEnum
CREATE TYPE "ScriptType" AS ENUM ('long_form', 'shorts', 'faceless_voiceover', 'screen_recording_tutorial');

-- CreateTable
CREATE TABLE "ChannelProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "videoStyle" TEXT NOT NULL,
    "contentPillars" TEXT[],
    "ctaStyle" TEXT NOT NULL,
    "doNotSay" TEXT[],
    "competitorChannels" TEXT[],
    "monetizationGoal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "audiencePain" TEXT NOT NULL,
    "videoType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "status" "IdeaStatus" NOT NULL DEFAULT 'raw_idea',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoProject" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT,
    "topic" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "videoType" TEXT NOT NULL,
    "targetLength" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'planning',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchBrief" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "referenceLinks" TEXT[],
    "viewerPain" TEXT NOT NULL,
    "videoPromise" TEXT NOT NULL,
    "mainPoints" TEXT[],
    "examples" TEXT[],
    "commonMistakes" TEXT[],
    "contrarianAngle" TEXT NOT NULL,
    "hookAngles" TEXT[],
    "titleAngles" TEXT[],
    "rawOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scriptType" "ScriptType" NOT NULL,
    "versionName" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "outro" TEXT NOT NULL,
    "visualNotes" TEXT[],
    "onScreenText" TEXT[],
    "contentMarkdown" TEXT NOT NULL,
    "structuredOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScriptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThumbnailPack" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "textOptions" TEXT[],
    "visualConcepts" TEXT[],
    "emotionAngle" TEXT NOT NULL,
    "imageGenerationPrompts" TEXT[],
    "canvaInstructions" TEXT NOT NULL,
    "photoshopInstructions" TEXT NOT NULL,
    "rawOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThumbnailPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadPack" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "titleOptions" TEXT[],
    "finalTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "hashtags" TEXT[],
    "chapters" TEXT[],
    "pinnedComment" TEXT NOT NULL,
    "communityPost" TEXT NOT NULL,
    "shortsCutdownIdeas" TEXT[],
    "uploadChecklist" TEXT[],
    "rawOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "views24h" INTEGER,
    "views7d" INTEGER,
    "ctr" DOUBLE PRECISION,
    "avgViewDuration" TEXT,
    "subscriberGain" INTEGER,
    "commentsSummary" TEXT,
    "whatWorked" TEXT,
    "whatFailed" TEXT,
    "improvementNotes" TEXT[],
    "nextVideoIdeas" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costEstimate" DOUBLE PRECISION,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Idea_status_idx" ON "Idea"("status");

-- CreateIndex
CREATE INDEX "Idea_pillar_idx" ON "Idea"("pillar");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProject_ideaId_key" ON "VideoProject"("ideaId");

-- CreateIndex
CREATE INDEX "VideoProject_status_idx" ON "VideoProject"("status");

-- CreateIndex
CREATE INDEX "VideoProject_pillar_idx" ON "VideoProject"("pillar");

-- CreateIndex
CREATE INDEX "ResearchBrief_projectId_idx" ON "ResearchBrief"("projectId");

-- CreateIndex
CREATE INDEX "ScriptVersion_projectId_idx" ON "ScriptVersion"("projectId");

-- CreateIndex
CREATE INDEX "ScriptVersion_scriptType_idx" ON "ScriptVersion"("scriptType");

-- CreateIndex
CREATE INDEX "ThumbnailPack_projectId_idx" ON "ThumbnailPack"("projectId");

-- CreateIndex
CREATE INDEX "UploadPack_projectId_idx" ON "UploadPack"("projectId");

-- CreateIndex
CREATE INDEX "PerformanceEntry_projectId_idx" ON "PerformanceEntry"("projectId");

-- CreateIndex
CREATE INDEX "PerformanceEntry_publishDate_idx" ON "PerformanceEntry"("publishDate");

-- CreateIndex
CREATE INDEX "GenerationLog_featureName_idx" ON "GenerationLog"("featureName");

-- CreateIndex
CREATE INDEX "GenerationLog_projectId_idx" ON "GenerationLog"("projectId");

-- CreateIndex
CREATE INDEX "GenerationLog_createdAt_idx" ON "GenerationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchBrief" ADD CONSTRAINT "ResearchBrief_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptVersion" ADD CONSTRAINT "ScriptVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThumbnailPack" ADD CONSTRAINT "ThumbnailPack_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadPack" ADD CONSTRAINT "UploadPack_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceEntry" ADD CONSTRAINT "PerformanceEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationLog" ADD CONSTRAINT "GenerationLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
