import MethodPageShell from "@/components/MethodPageShell";
import { RelationWorkspace } from "@/components/MethodWorkspaces";

export default function MarriagePage() {
  return (
    <MethodPageShell current="relation" title="关系盘" basis="日柱 · 生克 · 合冲" lead="把两个人的盘放在一起，看作用方向与承接位置。不评分、不判断适不适合，也不替任何一方下结论。">
      <RelationWorkspace />
    </MethodPageShell>
  );
}
