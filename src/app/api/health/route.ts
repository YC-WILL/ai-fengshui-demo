import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/config/brand";
import { THEORY_CATALOG_VERSION } from "@/lib/knowledge/theoryCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "unknown" = "unknown";
  let activeTheoryCards: number | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    activeTheoryCards = await prisma.theoryCard.count({
      where: { version: THEORY_CATALOG_VERSION, isActive: true }
    });
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
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
