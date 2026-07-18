import type { PrismaClient } from "@prisma/client";
import { prisma } from "../db";
import type { ReportType } from "../types";
import {
  buildTheoryGuidance,
  buildTheoryGuidanceFromCards,
  THEORY_CATALOG_VERSION,
  type TheoryCard
} from "./theoryCatalog";

type TheoryCardRow = {
  id: string;
  version: string;
  module: string;
  psychology: string;
  fengshui: string;
  mechanism: string;
  whenToUse: string;
  allowed: string;
  forbidden: string;
  action: string;
  review: string;
};

function parseWhenToUse(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function normalizeTheoryCard(row: TheoryCardRow): TheoryCard | null {
  if (!["self", "relationship", "home", "date"].includes(row.module)) return null;
  return {
    id: row.id,
    module: row.module as TheoryCard["module"],
    psychology: row.psychology,
    fengshui: row.fengshui,
    mechanism: row.mechanism,
    whenToUse: parseWhenToUse(row.whenToUse),
    allowed: row.allowed,
    forbidden: row.forbidden,
    action: row.action,
    review: row.review
  };
}

export async function buildTheoryGuidanceFromDatabase(
  reportType: ReportType,
  ruleResult: unknown,
  client: Pick<PrismaClient, "theoryCard"> = prisma
): Promise<string> {
  try {
    const rows = await client.theoryCard.findMany({
      where: { isActive: true },
      orderBy: [{ version: "desc" }, { id: "asc" }],
      select: {
        id: true,
        version: true,
        module: true,
        psychology: true,
        fengshui: true,
        mechanism: true,
        whenToUse: true,
        allowed: true,
        forbidden: true,
        action: true,
        review: true
      }
    });
    const cards = rows.flatMap(row => {
      const card = normalizeTheoryCard(row);
      return card ? [card] : [];
    });
    if (cards.length === 0) return buildTheoryGuidance(reportType, ruleResult);
    const version = rows.find(row => row.version)?.version ?? THEORY_CATALOG_VERSION;
    return buildTheoryGuidanceFromCards(cards, reportType, ruleResult, version)
      || buildTheoryGuidance(reportType, ruleResult);
  } catch (error) {
    console.warn("[theory] database guidance fallback", error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return buildTheoryGuidance(reportType, ruleResult);
  }
}
