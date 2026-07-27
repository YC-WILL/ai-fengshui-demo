import MethodPageShell from "@/components/MethodPageShell";
import { TimingWorkspace } from "@/components/MethodWorkspaces";
import { dateKeyInTimeZone } from "@/lib/time";
import { getCurrentUserId } from "@/lib/auth";
import {
  loadPlateContinuation,
  resolveTimingContinuation,
  type TimingContinuationMode
} from "@/lib/plateContinuation";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DateSelectionPage({
  searchParams
}: {
  searchParams?: {
    from?: string | string[];
    mode?: string | string[];
  };
}) {
  const today = dateKeyInTimeZone();
  const continuation = await getContinuation(
    searchParams?.from,
    searchParams?.mode,
    today
  );
  return (
    <MethodPageShell
      current="timing"
      title="择时盘"
      basis="事项 · 历法 · 生辰"
      status="1.0 第一阶段"
      stages={["选择事项与范围", "比较少量候选", "确认日期并准备"]}
      lead="先说明要做什么，再从明确时间范围里筛出少量候选。看懂日期差异后选一天，并完成一项现实准备。"
    >
      <TimingWorkspace
        key={continuation?.sourceId
          ? `${continuation.sourceId}-${continuation.mode}`
          : "new-timing"}
        today={today}
        continuation={continuation}
      />
    </MethodPageShell>
  );
}

async function getContinuation(
  from: string | string[] | undefined,
  rawMode: string | string[] | undefined,
  today: string
) {
  if (from === undefined) return null;
  if (typeof from !== "string" || !isTimingMode(rawMode)) notFound();
  const userId = await getCurrentUserId();
  if (!userId) notFound();
  const continuation = await loadPlateContinuation(userId, from, "TIMING");
  if (!continuation || continuation.plateType !== "TIMING") notFound();
  return resolveTimingContinuation(continuation, rawMode, today);
}

function isTimingMode(value: string | string[] | undefined): value is TimingContinuationMode {
  return value === "original" || value === "today";
}
