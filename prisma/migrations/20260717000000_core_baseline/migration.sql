CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" TEXT,
    "birthDate" TEXT,
    "birthTime" TEXT,
    "birthLocation" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Shanghai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "inputData" TEXT NOT NULL,
    "ruleResult" TEXT,
    "aiResult" TEXT,
    "safetyResult" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModelLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "reasoningEffort" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "rawRequest" TEXT,
    "rawResponse" TEXT,
    "safetyFlags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentSafetyRule" (
    "id" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentSafetyRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

CREATE INDEX "Report_userId_idx" ON "Report"("userId");
CREATE INDEX "Report_reportType_idx" ON "Report"("reportType");
CREATE INDEX "Report_status_idx" ON "Report"("status");

CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_reportId_idx" ON "Payment"("reportId");

CREATE INDEX "ModelLog_userId_idx" ON "ModelLog"("userId");
CREATE INDEX "ModelLog_createdAt_idx" ON "ModelLog"("createdAt");

ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ModelLog" ADD CONSTRAINT "ModelLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ModelLog" ADD CONSTRAINT "ModelLog_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
