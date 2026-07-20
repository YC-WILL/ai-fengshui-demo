CREATE TABLE "TraditionalEntity" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER,
    "attributes" JSONB NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TraditionalEntity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TraditionalRelation" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "subjectCodes" JSONB NOT NULL,
    "objectCodes" JSONB NOT NULL,
    "resultCode" TEXT,
    "attributes" JSONB NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TraditionalRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TraditionalMethodRule" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rule" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TraditionalMethodRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TraditionalInterpretationCard" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "allowedUse" TEXT NOT NULL,
    "forbiddenUse" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TraditionalInterpretationCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TraditionalEntity_category_code_version_key" ON "TraditionalEntity"("category", "code", "version");
CREATE INDEX "TraditionalEntity_system_idx" ON "TraditionalEntity"("system");
CREATE INDEX "TraditionalEntity_category_idx" ON "TraditionalEntity"("category");
CREATE INDEX "TraditionalEntity_version_idx" ON "TraditionalEntity"("version");
CREATE INDEX "TraditionalEntity_isActive_idx" ON "TraditionalEntity"("isActive");

CREATE INDEX "TraditionalRelation_system_idx" ON "TraditionalRelation"("system");
CREATE INDEX "TraditionalRelation_relationType_idx" ON "TraditionalRelation"("relationType");
CREATE INDEX "TraditionalRelation_version_idx" ON "TraditionalRelation"("version");
CREATE INDEX "TraditionalRelation_isActive_idx" ON "TraditionalRelation"("isActive");

CREATE UNIQUE INDEX "TraditionalMethodRule_method_code_version_key" ON "TraditionalMethodRule"("method", "code", "version");
CREATE INDEX "TraditionalMethodRule_method_step_idx" ON "TraditionalMethodRule"("method", "step");
CREATE INDEX "TraditionalMethodRule_version_idx" ON "TraditionalMethodRule"("version");
CREATE INDEX "TraditionalMethodRule_isActive_idx" ON "TraditionalMethodRule"("isActive");

CREATE UNIQUE INDEX "TraditionalInterpretationCard_category_code_version_key" ON "TraditionalInterpretationCard"("category", "code", "version");
CREATE INDEX "TraditionalInterpretationCard_category_idx" ON "TraditionalInterpretationCard"("category");
CREATE INDEX "TraditionalInterpretationCard_version_idx" ON "TraditionalInterpretationCard"("version");
CREATE INDEX "TraditionalInterpretationCard_isActive_idx" ON "TraditionalInterpretationCard"("isActive");
