import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/config/brand";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "unknown" = "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
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
      database
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
