import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { signErrorResponse } from "@/lib/signs/http";
import { getSignByIdForUser } from "@/lib/signs/service";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getOrCreateUser();
    const draw = await getSignByIdForUser(user.id, params.id);
    return NextResponse.json({ ok: true, data: draw });
  } catch (error: unknown) {
    return signErrorResponse(error);
  }
}
