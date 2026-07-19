import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { COMPANION_PURPOSES } from "@/lib/companion/core";
import { deleteCompanionPurpose, getCompanionPurpose, saveCompanionPurpose } from "@/lib/companion/repository";

const purposeSchema = z.object({
  purpose: z.enum(["talk", "clarify", "self", "daily"])
});

export async function GET() {
  try {
    const user = await getOrCreateUser();
    const purpose = await getCompanionPurpose(user.id);
    return NextResponse.json({ ok: true, data: { purpose } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "陪伴偏好暂时无法读取，请稍后再试。" },
      { status: 503 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = purposeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "请选择一个陪伴方向。" }, { status: 400 });
  }
  try {
    const user = await getOrCreateUser();
    await saveCompanionPurpose(user.id, parsed.data.purpose);
    return NextResponse.json({
      ok: true,
      data: {
        purpose: parsed.data.purpose,
        title: COMPANION_PURPOSES[parsed.data.purpose].title
      }
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "这份初心暂时没有保存下来，请稍后再试。" },
      { status: 503 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getOrCreateUser();
    await deleteCompanionPurpose(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "这项记录暂时无法删除，请稍后再试。" },
      { status: 503 }
    );
  }
}
