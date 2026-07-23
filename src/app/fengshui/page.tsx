import MethodPageShell from "@/components/MethodPageShell";
import { HomeWorkspace } from "@/components/MethodWorkspaces";

export default function FengShuiPage() {
  return (
    <MethodPageShell
      current="home"
      title="宅居盘"
      basis="安全 · 居住条件 · 日常动线"
      lead="先填写入户、主要休息区和厨房的真实情况，只挑当前最值得先处理的一处，并给出今天就能开始的动作。未填写的区域不会补猜。"
      status="1.0 第一阶段"
      stages={["填写三处现实情况", "先处理一处", "今天完成一个动作"]}
    >
      <HomeWorkspace />
    </MethodPageShell>
  );
}
