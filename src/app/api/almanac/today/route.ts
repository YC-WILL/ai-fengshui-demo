import { NextResponse } from "next/server";
import { buildAlmanac } from "@/lib/domain/almanac";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = buildAlmanac(new Date());
  return NextResponse.json({ ok: true, data });
}
