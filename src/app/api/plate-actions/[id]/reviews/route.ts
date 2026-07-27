import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { PlateRecordError } from "@/lib/plateRecords";
import {
  createPlateActionReviewForUser,
  createPlateActionReviewRequestSchema,
  plateActionIdSchema
} from "@/lib/plateActions";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const id = plateActionIdSchema.safeParse(params.id);
  if (!id.success) return notFoundResponse();
  const body = await request.json().catch(() => null);
  const parsed = createPlateActionReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "复盘内容格式不正确。" }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser();
    const result = await createPlateActionReviewForUser(
      user.id,
      id.data,
      parsed.data
    );
    return NextResponse.json(
      { ok: true, data: result.review, replayed: result.replayed },
      { status: result.replayed ? 200 : 201 }
    );
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
