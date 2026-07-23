import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { signErrorResponse } from "@/lib/signs/http";
import { drawSignForUser } from "@/lib/signs/service";
import { drawSignRequestSchema } from "@/lib/signs/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = drawSignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "签号和时段由服务端确定，请刷新后重试。" },
      { status: 400 }
    );
  }

  try {
    const user = await getOrCreateUser();
    const draw = await drawSignForUser(user.id);
    return NextResponse.json({ ok: true, data: draw });
  } catch (error: unknown) {
    return signErrorResponse(error);
  }
}
