import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report || report.userId !== userId) {
    return NextResponse.json({ ok: false, error: "报告不存在或无权限查看" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: report });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report || report.userId !== userId) {
    return NextResponse.json({ ok: false, error: "报告不存在或无权限" }, { status: 404 });
  }
  await prisma.report.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
