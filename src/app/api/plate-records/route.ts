import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import {
  createPlateSnapshotForUser,
  plateRecordRequestSchema,
  PlateRecordError
} from "@/lib/plateRecords";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = plateRecordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "保存内容格式不正确，请检查后重试。" },
      { status: 400 }
    );
  }

  try {
    const user = await getOrCreateUser();
    const result = await createPlateSnapshotForUser(user.id, parsed.data);
    return NextResponse.json(
      { ok: true, data: result.snapshot, replayed: result.replayed },
      { status: result.replayed ? 200 : 201 }
    );
  } catch (error: unknown) {
    return plateRecordErrorResponse(error);
  }
}

function plateRecordErrorResponse(error: unknown) {
  if (error instanceof PlateRecordError) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: error.status }
    );
  }
  return NextResponse.json(
    { ok: false, error: "记录服务暂时不可用，请稍后重试。" },
    { status: 503 }
  );
}
