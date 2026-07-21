import MethodPageShell from "@/components/MethodPageShell";
import { TimingWorkspace } from "@/components/MethodWorkspaces";
import { dateKeyInTimeZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function DateSelectionPage() {
  return (
    <MethodPageShell current="timing" title="择时盘" basis="事项 · 历法 · 生辰" lead="先说明要做什么，再从一个明确时间范围里筛出少量候选。日期给出依据和准备清单，但不保证事情结果。">
      <TimingWorkspace today={dateKeyInTimeZone()} />
    </MethodPageShell>
  );
}
