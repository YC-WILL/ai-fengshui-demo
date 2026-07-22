import MethodPageShell from "@/components/MethodPageShell";
import { RelationWorkspace } from "@/components/MethodWorkspaces";

export default function MarriagePage() {
  return (
    <MethodPageShell current="relation" title="关系盘" basis="日柱 · 双向十神 · 合冲刑害" status="1.0 已冻结" stages={["先看三种互动", "一起试一个动作", "再查双方日柱"]} lead="先看同一件事来到两个人之间时，双方可能怎样回应，再展开日柱与双向作用依据。不评分、不判断关系好坏。">
      <RelationWorkspace />
    </MethodPageShell>
  );
}
