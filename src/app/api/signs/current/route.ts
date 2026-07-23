import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { signErrorResponse } from "@/lib/signs/http";
import { getCurrentSignForUser } from "@/lib/signs/service";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const result = await getCurrentSignForUser(user.id);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    return signErrorResponse(error);
  }
}
