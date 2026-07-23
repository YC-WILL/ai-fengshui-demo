import MethodPageShell from "@/components/MethodPageShell";
import { TimingWorkspace } from "@/components/MethodWorkspaces";
import { dateKeyInTimeZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function DateSelectionPage() {
  return (
    <MethodPageShell
      current="timing"
      title="择时盘"
      basis="事项 · 历法 · 生辰"
      status="1.0 第一阶段"
      stages={["选择事项与范围", "比较少量候选", "确认日期并准备"]}
      lead="先说明要做什么，再从明确时间范围里筛出少量候选。看懂日期差异后选一天，并完成一项现实准备。"
    >
      <TimingWorkspace today={dateKeyInTimeZone()} />
    </MethodPageShell>
  );
}
