import MethodPageShell from "@/components/MethodPageShell";
import { RelationWorkspace } from "@/components/MethodWorkspaces";
import { getCurrentUserId } from "@/lib/auth";
import { loadPlateContinuation } from "@/lib/plateContinuation";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MarriagePage({
  searchParams
}: {
  searchParams?: { from?: string | string[] };
}) {
  const continuation = await getContinuation(searchParams?.from);
  return (
    <MethodPageShell current="relation" title="关系盘" basis="双方八字 · 连续关系阅读" status="关系分析已接入" stages={["认识双方基础", "进入关系物象", "查看结构事实"]} lead="从双方已经确认的八字事实开始，连续查看基础、物象与关系结构。各区块只在事实可靠时显示，不评分、不判断关系好坏。">
      <RelationWorkspace
        key={continuation?.sourceId ?? "new-relation"}
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
  const continuation = await loadPlateContinuation(userId, from, "RELATION");
  if (!continuation || continuation.plateType !== "RELATION") notFound();
  return continuation;
}
