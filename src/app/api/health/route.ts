import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
      service: "ai-fengshui-demo",
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
