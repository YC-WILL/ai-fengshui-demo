import MethodPageShell from "@/components/MethodPageShell";
import { BaziWorkspace } from "@/components/MethodWorkspaces";
import { getCurrentUserId } from "@/lib/auth";
import { loadPlateContinuation } from "@/lib/plateContinuation";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BaziPage({
  searchParams
}: {
  searchParams?: { from?: string | string[] };
}) {
  const continuation = await getContinuation(searchParams?.from);
  return (
    <MethodPageShell current="bazi" title="八字盘" basis="四柱 · 日主 · 月令 · 藏干 · 十神" status="1.0 已冻结" stages={["八字分析", "专业细盘", "查看口径与来源"]} lead="八字分析依次整理日主与月令、五行构成、十神与四柱，再将已确认的专业结构转成形象和白话解释；专业细盘保留当前已核验、可以复算的完整字段。未知出生时间时，时柱保持空白。">
      <BaziWorkspace
        key={continuation?.sourceId ?? "new-bazi"}
        continuation={continuation}
      />
    </MethodPageShell>
  );
}

async function getContinuation(from: string | string[] | undefined) {
  if (from === undefined) return null;
  if (typeof from !== "string") notFound();
  const userId = await getCurrentUserId();
  if (!userId) notFound();
  const continuation = await loadPlateContinuation(userId, from, "BAZI");
  if (!continuation || continuation.plateType !== "BAZI") notFound();
  return continuation;
}
