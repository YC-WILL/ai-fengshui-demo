CREATE TABLE "PlateSnapshot" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "plateType" TEXT NOT NULL,
    "protocolVersion" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "resultSnapshot" JSONB NOT NULL,
    "resultDate" TEXT,
    "profileUpdatedAt" TIMESTAMP(3),
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlateSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlateAction" (
    "id" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "actionVersion" TEXT NOT NULL,
    "actionData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlateAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlateActionReview" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "actionId" UUID NOT NULL,
    "reviewVersion" TEXT NOT NULL,
    "reviewData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlateActionReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlateSnapshot_requestId_key" ON "PlateSnapshot"("requestId");
CREATE INDEX "PlateSnapshot_userId_createdAt_idx" ON "PlateSnapshot"("userId", "createdAt");
CREATE INDEX "PlateSnapshot_userId_plateType_createdAt_idx" ON "PlateSnapshot"("userId", "plateType", "createdAt");

CREATE UNIQUE INDEX "PlateAction_snapshotId_key" ON "PlateAction"("snapshotId");

CREATE UNIQUE INDEX "PlateActionReview_requestId_key" ON "PlateActionReview"("requestId");
CREATE INDEX "PlateActionReview_actionId_createdAt_idx" ON "PlateActionReview"("actionId", "createdAt");

ALTER TABLE "PlateSnapshot" ADD CONSTRAINT "PlateSnapshot_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlateAction" ADD CONSTRAINT "PlateAction_snapshotId_fkey"
    FOREIGN KEY ("snapshotId") REFERENCES "PlateSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlateActionReview" ADD CONSTRAINT "PlateActionReview_actionId_fkey"
    FOREIGN KEY ("actionId") REFERENCES "PlateAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
