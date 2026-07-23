import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { signErrorResponse } from "@/lib/signs/http";
import { startSignInterpretation } from "@/lib/signs/service";
import { startSignInterpretationSchema } from "@/lib/signs/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = startSignInterpretationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "解签问题不完整" },
      { status: 400 }
    );
  }

  try {
    const user = await getOrCreateUser();
    const result = await startSignInterpretation({
      userId: user.id,
      drawId: params.id,
      domainCode: parsed.data.domainCode,
      question: parsed.data.question
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    return signErrorResponse(error);
  }
}
