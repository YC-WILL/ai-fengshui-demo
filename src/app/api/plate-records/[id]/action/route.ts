import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { plateRecordIdSchema, PlateRecordError } from "@/lib/plateRecords";
import {
  createPlateActionForUser,
  createPlateActionRequestSchema,
  getPlateActionForSnapshot
} from "@/lib/plateActions";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const id = plateRecordIdSchema.safeParse(params.id);
  if (!id.success) return notFoundResponse();
  const body = await request.json().catch(() => null);
  const parsed = createPlateActionRequestSchema.safeParse(body);
  if (!parsed.success) return badRequestResponse();

  try {
    const user = await getOrCreateUser();
    const result = await createPlateActionForUser(user.id, id.data);
    return NextResponse.json(
      { ok: true, data: result.action, replayed: result.replayed },
      { status: result.replayed ? 200 : 201 }
    );
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const id = plateRecordIdSchema.safeParse(params.id);
  if (!id.success) return notFoundResponse();
  try {
    const user = await getOrCreateUser();
    const result = await getPlateActionForSnapshot(user.id, id.data);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

function badRequestResponse() {
  return NextResponse.json({ ok: false, error: "行动请求格式不正确。" }, { status: 400 });
}

function notFoundResponse() {
  return NextResponse.json({ ok: false, error: "记录不存在。" }, { status: 404 });
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
