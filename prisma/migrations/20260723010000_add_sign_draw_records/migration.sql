CREATE TABLE "SignDraw" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signEntryId" TEXT NOT NULL,
    "signDate" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "randomIndex" INTEGER NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "catalogVersion" TEXT NOT NULL,
    "signSnapshot" JSONB NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignDraw_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignInterpretationSession" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "initialQuestion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignInterpretationSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignInterpretationTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "responseData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignInterpretationTurn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignDraw_userId_signDate_period_key" ON "SignDraw"("userId", "signDate", "period");
CREATE INDEX "SignDraw_userId_drawnAt_idx" ON "SignDraw"("userId", "drawnAt");
CREATE INDEX "SignDraw_signEntryId_idx" ON "SignDraw"("signEntryId");
CREATE INDEX "SignInterpretationSession_userId_createdAt_idx" ON "SignInterpretationSession"("userId", "createdAt");
CREATE INDEX "SignInterpretationSession_drawId_idx" ON "SignInterpretationSession"("drawId");
CREATE INDEX "SignInterpretationSession_domainId_idx" ON "SignInterpretationSession"("domainId");
CREATE INDEX "SignInterpretationTurn_sessionId_createdAt_idx" ON "SignInterpretationTurn"("sessionId", "createdAt");

ALTER TABLE "SignDraw" ADD CONSTRAINT "SignDraw_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignDraw" ADD CONSTRAINT "SignDraw_signEntryId_fkey"
  FOREIGN KEY ("signEntryId") REFERENCES "SignEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SignInterpretationSession" ADD CONSTRAINT "SignInterpretationSession_drawId_fkey"
  FOREIGN KEY ("drawId") REFERENCES "SignDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignInterpretationSession" ADD CONSTRAINT "SignInterpretationSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignInterpretationSession" ADD CONSTRAINT "SignInterpretationSession_domainId_fkey"
  FOREIGN KEY ("domainId") REFERENCES "SignDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SignInterpretationTurn" ADD CONSTRAINT "SignInterpretationTurn_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "SignInterpretationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
