CREATE TABLE "ZhouyiTrigram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "binary" TEXT NOT NULL,
    "canonicalImage" TEXT NOT NULL,
    "canonicalVirtue" TEXT NOT NULL,
    "familyRole" TEXT NOT NULL,
    "laterHeavenDirection" TEXT NOT NULL,
    "laterFivePhase" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ZhouyiTrigram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ZhouyiHexagram" (
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "binary" TEXT NOT NULL,
    "lowerTrigramId" TEXT NOT NULL,
    "upperTrigramId" TEXT NOT NULL,
    "judgment" TEXT NOT NULL,
    "tuan" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "wenyan" TEXT,
    "extraLineLabel" TEXT,
    "extraLineText" TEXT,
    "extraLineImage" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceRevision" TEXT NOT NULL,
    "sourceLicense" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ZhouyiHexagram_pkey" PRIMARY KEY ("number")
);

CREATE TABLE "ZhouyiLine" (
    "id" TEXT NOT NULL,
    "hexagramNumber" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "lineType" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "imageText" TEXT NOT NULL,
    "isCentral" BOOLEAN NOT NULL,
    "isInProperPosition" BOOLEAN NOT NULL,
    "correspondingPosition" INTEGER NOT NULL,
    "hasCorrespondence" BOOLEAN NOT NULL,
    "changesToHexagramNumber" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceRevision" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ZhouyiLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ZhouyiTrigram_name_key" ON "ZhouyiTrigram"("name");
CREATE UNIQUE INDEX "ZhouyiTrigram_symbol_key" ON "ZhouyiTrigram"("symbol");
CREATE UNIQUE INDEX "ZhouyiTrigram_binary_key" ON "ZhouyiTrigram"("binary");
CREATE INDEX "ZhouyiTrigram_version_idx" ON "ZhouyiTrigram"("version");
CREATE INDEX "ZhouyiTrigram_isActive_idx" ON "ZhouyiTrigram"("isActive");

CREATE UNIQUE INDEX "ZhouyiHexagram_name_key" ON "ZhouyiHexagram"("name");
CREATE UNIQUE INDEX "ZhouyiHexagram_symbol_key" ON "ZhouyiHexagram"("symbol");
CREATE UNIQUE INDEX "ZhouyiHexagram_binary_key" ON "ZhouyiHexagram"("binary");
CREATE INDEX "ZhouyiHexagram_lowerTrigramId_idx" ON "ZhouyiHexagram"("lowerTrigramId");
CREATE INDEX "ZhouyiHexagram_upperTrigramId_idx" ON "ZhouyiHexagram"("upperTrigramId");
CREATE INDEX "ZhouyiHexagram_version_idx" ON "ZhouyiHexagram"("version");
CREATE INDEX "ZhouyiHexagram_isActive_idx" ON "ZhouyiHexagram"("isActive");

CREATE UNIQUE INDEX "ZhouyiLine_hexagramNumber_position_key" ON "ZhouyiLine"("hexagramNumber", "position");
CREATE INDEX "ZhouyiLine_hexagramNumber_idx" ON "ZhouyiLine"("hexagramNumber");
CREATE INDEX "ZhouyiLine_changesToHexagramNumber_idx" ON "ZhouyiLine"("changesToHexagramNumber");
CREATE INDEX "ZhouyiLine_version_idx" ON "ZhouyiLine"("version");
CREATE INDEX "ZhouyiLine_isActive_idx" ON "ZhouyiLine"("isActive");

ALTER TABLE "ZhouyiHexagram" ADD CONSTRAINT "ZhouyiHexagram_lowerTrigramId_fkey"
    FOREIGN KEY ("lowerTrigramId") REFERENCES "ZhouyiTrigram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ZhouyiHexagram" ADD CONSTRAINT "ZhouyiHexagram_upperTrigramId_fkey"
    FOREIGN KEY ("upperTrigramId") REFERENCES "ZhouyiTrigram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ZhouyiLine" ADD CONSTRAINT "ZhouyiLine_hexagramNumber_fkey"
    FOREIGN KEY ("hexagramNumber") REFERENCES "ZhouyiHexagram"("number") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ZhouyiLine" ADD CONSTRAINT "ZhouyiLine_changesToHexagramNumber_fkey"
    FOREIGN KEY ("changesToHexagramNumber") REFERENCES "ZhouyiHexagram"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
