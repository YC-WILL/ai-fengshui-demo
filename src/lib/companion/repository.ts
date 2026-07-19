import type { PrismaClient } from "@prisma/client";
import { prisma } from "../db";
import {
  COMPANION_PROFILE_REPORT_TYPE,
  COMPANION_TURN_REPORT_TYPE,
  isCompanionPurpose,
  type CompanionPurpose,
  type CompanionTurn
} from "./core";

type CompanionClient = Pick<PrismaClient, "report">;

export async function getCompanionPurpose(
  userId: string,
  client: CompanionClient = prisma
): Promise<CompanionPurpose | null> {
  const row = await client.report.findFirst({
    where: { userId, reportType: COMPANION_PROFILE_REPORT_TYPE },
    orderBy: { updatedAt: "desc" },
    select: { inputData: true }
  });
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.inputData) as { purpose?: unknown };
    return isCompanionPurpose(parsed.purpose) ? parsed.purpose : null;
  } catch {
    return null;
  }
}

export async function saveCompanionPurpose(
  userId: string,
  purpose: CompanionPurpose,
  client: CompanionClient = prisma
): Promise<void> {
  const existing = await client.report.findFirst({
    where: { userId, reportType: COMPANION_PROFILE_REPORT_TYPE },
    orderBy: { updatedAt: "desc" },
    select: { id: true }
  });
  const data = {
    inputData: JSON.stringify({ purpose }),
    ruleResult: JSON.stringify({ userConfirmed: true }),
    safetyResult: JSON.stringify({ profilePreference: true }),
    status: "generated",
    isPaid: true
  };
  if (existing) {
    await client.report.update({ where: { id: existing.id }, data });
  } else {
    await client.report.create({
      data: { userId, reportType: COMPANION_PROFILE_REPORT_TYPE, ...data }
    });
  }
}

export async function deleteCompanionPurpose(
  userId: string,
  client: CompanionClient = prisma
): Promise<void> {
  await client.report.deleteMany({
    where: { userId, reportType: COMPANION_PROFILE_REPORT_TYPE }
  });
}

export async function getRecentCompanionTurns(
  userId: string,
  take = 12,
  client: CompanionClient = prisma
): Promise<CompanionTurn[]> {
  const rows = await client.report.findMany({
    where: { userId, reportType: COMPANION_TURN_REPORT_TYPE, status: "generated" },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, inputData: true, aiResult: true, createdAt: true }
  });
  return rows.reverse().flatMap(row => {
    try {
      const parsed = JSON.parse(row.inputData) as { message?: unknown };
      if (typeof parsed.message !== "string" || typeof row.aiResult !== "string") return [];
      return [{
        id: row.id,
        message: parsed.message,
        reply: row.aiResult,
        createdAt: row.createdAt.toISOString()
      }];
    } catch {
      return [];
    }
  });
}

export async function saveCompanionTurn(
  userId: string,
  message: string,
  reply: string,
  metadata: Record<string, unknown>,
  safetyResult: Record<string, unknown>,
  client: CompanionClient = prisma
): Promise<{ id: string; createdAt: Date }> {
  return client.report.create({
    data: {
      userId,
      reportType: COMPANION_TURN_REPORT_TYPE,
      inputData: JSON.stringify({ message }),
      ruleResult: JSON.stringify(metadata),
      aiResult: reply,
      safetyResult: JSON.stringify(safetyResult),
      status: "generated",
      isPaid: true
    },
    select: { id: true, createdAt: true }
  });
}
