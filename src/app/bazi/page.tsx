import MethodPageShell from "@/components/MethodPageShell";
import { BaziWorkspace } from "@/components/MethodWorkspaces";

export default function BaziPage() {
  return (
    <MethodPageShell current="bazi" title="八字盘" basis="四柱 · 日主 · 五行" lead="先看盘面本身：每一个字从哪里来、五行出现在哪里、哪些信息尚未确定。基础盘完整保留，时间变化另行展开。">
      <BaziWorkspace />
    </MethodPageShell>
  );
}
