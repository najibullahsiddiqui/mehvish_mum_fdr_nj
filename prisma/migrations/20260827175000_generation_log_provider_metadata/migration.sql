ALTER TABLE "GenerationLog"
ADD COLUMN "providerId" TEXT,
ADD COLUMN "providerKind" TEXT,
ADD COLUMN "attemptCount" INTEGER,
ADD COLUMN "errorCode" TEXT;

CREATE INDEX "GenerationLog_providerId_idx" ON "GenerationLog"("providerId");
CREATE INDEX "GenerationLog_providerKind_idx" ON "GenerationLog"("providerKind");
CREATE INDEX "GenerationLog_errorCode_idx" ON "GenerationLog"("errorCode");
