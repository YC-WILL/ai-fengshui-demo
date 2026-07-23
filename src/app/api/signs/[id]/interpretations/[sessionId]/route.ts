import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { signErrorResponse } from "@/lib/signs/http";
import {
  continueSignInterpretation,
  getSignInterpretationForUser
} from "@/lib/signs/service";
import { continueSignInterpretationSchema } from "@/lib/signs/validation";

interface RouteContext {
  params: { id: string; sessionId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getOrCreateUser();
    const result = await getSignInterpretationForUser(
      user.id,
      params.id,
      params.sessionId
    );
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    return signErrorResponse(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const body = await req.json().catch(() => null);
  const parsed = continueSignInterpretationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "追问内容不完整" },
      { status: 400 }
    );
  }

  try {
    const user = await getOrCreateUser();
    const result = await continueSignInterpretation({
      userId: user.id,
      drawId: params.id,
      sessionId: params.sessionId,
      message: parsed.data.message
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    return signErrorResponse(error);
  }
}
