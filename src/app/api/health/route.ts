import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/config/brand";
import { THEORY_CATALOG_VERSION } from "@/lib/knowledge/theoryCatalog";
import { QIMEN_CATALOG_VERSION } from "@/lib/knowledge/qimenCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "unknown" = "unknown";
  let activeTheoryCards: number | null = null;
  let qimenCounts: { entities: number; relations: number; methodRules: number; interpretations: number } | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    activeTheoryCards = await prisma.theoryCard.count({
      where: { version: THEORY_CATALOG_VERSION, isActive: true }
    });
    const [entities, relations, methodRules, interpretations] = await Promise.all([
      prisma.traditionalEntity.count({ where: { version: QIMEN_CATALOG_VERSION, system: "qimen", isActive: true } }),
      prisma.traditionalRelation.count({ where: { version: QIMEN_CATALOG_VERSION, system: "qimen", isActive: true } }),
      prisma.traditionalMethodRule.count({ where: { version: QIMEN_CATALOG_VERSION, method: "qimen_hourly_rotating", isActive: true } }),
      prisma.traditionalInterpretationCard.count({ where: { version: QIMEN_CATALOG_VERSION, category: { startsWith: "qimen_" }, isActive: true } })
    ]);
    qimenCounts = { entities, relations, methodRules, interpretations };
    database = "connected";
  } catch {
    database = "unknown";
  }

  return NextResponse.json(
    {
      ok: true,
      service: "guaan",
      brand: brand.brandFullName,
      tagline: brand.taglineZh,
      ai_provider: process.env.AI_PROVIDER ?? "mock",
      payment_provider: process.env.PAYMENT_PROVIDER ?? "mock",
      timestamp: new Date().toISOString(),
      database,
      theory_catalog: {
        version: THEORY_CATALOG_VERSION,
        active_cards: activeTheoryCards
      },
      qimen_catalog: { version: QIMEN_CATALOG_VERSION, active: qimenCounts }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
