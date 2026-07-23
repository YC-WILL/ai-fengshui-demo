CREATE TABLE "SignSystem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "theoryBasis" TEXT NOT NULL,
    "drawCount" INTEGER NOT NULL,
    "drawPolicy" JSONB NOT NULL,
    "contentStatus" TEXT NOT NULL DEFAULT 'foundation',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignSystem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignDirection" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "actionPrinciple" TEXT NOT NULL,
    "caution" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignDirection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignDomain" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "clarifyingQuestions" JSONB NOT NULL,
    "allowedUse" TEXT NOT NULL,
    "forbiddenUse" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignDomain_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignPeriodProfile" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "crossesMidnight" BOOLEAN NOT NULL DEFAULT false,
    "dateAnchorHour" INTEGER NOT NULL DEFAULT 6,
    "focus" TEXT NOT NULL,
    "guidingQuestion" TEXT NOT NULL,
    "directionEmphasis" JSONB NOT NULL,
    "actionHorizon" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignPeriodProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignEntry" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "hexagramNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "signType" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "primaryDirectionCode" TEXT NOT NULL,
    "secondaryDirectionCode" TEXT,
    "contentStatus" TEXT NOT NULL DEFAULT 'foundation',
    "sourceNote" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignMethodRule" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rule" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignMethodRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignSystem_code_key" ON "SignSystem"("code");
CREATE INDEX "SignSystem_version_idx" ON "SignSystem"("version");
CREATE INDEX "SignSystem_isActive_idx" ON "SignSystem"("isActive");
CREATE UNIQUE INDEX "SignDirection_code_key" ON "SignDirection"("code");
CREATE INDEX "SignDirection_version_idx" ON "SignDirection"("version");
CREATE INDEX "SignDirection_isActive_idx" ON "SignDirection"("isActive");
CREATE UNIQUE INDEX "SignDomain_code_key" ON "SignDomain"("code");
CREATE INDEX "SignDomain_version_idx" ON "SignDomain"("version");
CREATE INDEX "SignDomain_isActive_idx" ON "SignDomain"("isActive");
CREATE UNIQUE INDEX "SignPeriodProfile_systemId_code_version_key" ON "SignPeriodProfile"("systemId", "code", "version");
CREATE INDEX "SignPeriodProfile_systemId_sequence_idx" ON "SignPeriodProfile"("systemId", "sequence");
CREATE INDEX "SignPeriodProfile_version_idx" ON "SignPeriodProfile"("version");
CREATE INDEX "SignPeriodProfile_isActive_idx" ON "SignPeriodProfile"("isActive");
CREATE UNIQUE INDEX "SignEntry_systemId_number_key" ON "SignEntry"("systemId", "number");
CREATE UNIQUE INDEX "SignEntry_systemId_hexagramNumber_key" ON "SignEntry"("systemId", "hexagramNumber");
CREATE INDEX "SignEntry_primaryDirectionCode_idx" ON "SignEntry"("primaryDirectionCode");
CREATE INDEX "SignEntry_stage_idx" ON "SignEntry"("stage");
CREATE INDEX "SignEntry_version_idx" ON "SignEntry"("version");
CREATE INDEX "SignEntry_isActive_idx" ON "SignEntry"("isActive");
CREATE UNIQUE INDEX "SignMethodRule_systemId_code_version_key" ON "SignMethodRule"("systemId", "code", "version");
CREATE INDEX "SignMethodRule_systemId_step_idx" ON "SignMethodRule"("systemId", "step");
CREATE INDEX "SignMethodRule_version_idx" ON "SignMethodRule"("version");
CREATE INDEX "SignMethodRule_isActive_idx" ON "SignMethodRule"("isActive");

ALTER TABLE "SignPeriodProfile" ADD CONSTRAINT "SignPeriodProfile_systemId_fkey"
  FOREIGN KEY ("systemId") REFERENCES "SignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignEntry" ADD CONSTRAINT "SignEntry_systemId_fkey"
  FOREIGN KEY ("systemId") REFERENCES "SignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignEntry" ADD CONSTRAINT "SignEntry_hexagramNumber_fkey"
  FOREIGN KEY ("hexagramNumber") REFERENCES "ZhouyiHexagram"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SignMethodRule" ADD CONSTRAINT "SignMethodRule_systemId_fkey"
  FOREIGN KEY ("systemId") REFERENCES "SignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
