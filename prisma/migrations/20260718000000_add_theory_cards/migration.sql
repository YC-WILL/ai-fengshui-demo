CREATE TABLE "TheoryCard" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "psychology" TEXT NOT NULL,
    "fengshui" TEXT NOT NULL,
    "mechanism" TEXT NOT NULL,
    "whenToUse" TEXT NOT NULL,
    "allowed" TEXT NOT NULL,
    "forbidden" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "review" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT '自主整理',
    "sourceNote" TEXT,
    "license" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TheoryCard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TheoryCard_module_idx" ON "TheoryCard"("module");
CREATE INDEX "TheoryCard_version_idx" ON "TheoryCard"("version");
CREATE INDEX "TheoryCard_isActive_idx" ON "TheoryCard"("isActive");
