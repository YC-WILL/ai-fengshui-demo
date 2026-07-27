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
    <MethodPageShell current="relation" title="关系盘" basis="日柱 · 双向十神 · 合冲刑害" status="1.0 已冻结" stages={["先看三种互动", "一起试一个动作", "再查双方日柱"]} lead="先看同一件事来到两个人之间时，双方可能怎样回应，再展开日柱与双向作用依据。不评分、不判断关系好坏。">
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
