import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { PlateRecordError } from "@/lib/plateRecords";
import {
  plateActionIdSchema,
  updatePlateActionRequestSchema,
  updatePlateActionStatusForUser
} from "@/lib/plateActions";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const id = plateActionIdSchema.safeParse(params.id);
  if (!id.success) return notFoundResponse();
  const body = await request.json().catch(() => null);
  const parsed = updatePlateActionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "行动状态格式不正确。" }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser();
    const action = await updatePlateActionStatusForUser(
      user.id,
      id.data,
      parsed.data.status
    );
    return NextResponse.json({ ok: true, data: action });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

function notFoundResponse() {
  return NextResponse.json({ ok: false, error: "行动不存在。" }, { status: 404 });
}

function errorResponse(error: unknown) {
  if (error instanceof PlateRecordError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { ok: false, error: "行动服务暂时不可用，请稍后重试。" },
    { status: 503 }
  );
}
