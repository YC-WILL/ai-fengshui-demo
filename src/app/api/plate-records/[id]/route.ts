import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import {
  deletePlateSnapshotForUser,
  getPlateSnapshotForUser,
  plateRecordIdSchema,
  PlateRecordError
} from "@/lib/plateRecords";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const id = plateRecordIdSchema.safeParse(params.id);
  if (!id.success) return notFoundResponse();

  try {
    const user = await getOrCreateUser();
    const snapshot = await getPlateSnapshotForUser(user.id, id.data);
    return NextResponse.json({ ok: true, data: snapshot });
  } catch (error: unknown) {
    return plateRecordErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const id = plateRecordIdSchema.safeParse(params.id);
  if (!id.success) return notFoundResponse();

  try {
    const user = await getOrCreateUser();
    await deletePlateSnapshotForUser(user.id, id.data);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return plateRecordErrorResponse(error);
  }
}

function notFoundResponse() {
  return NextResponse.json({ ok: false, error: "记录不存在。" }, { status: 404 });
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
