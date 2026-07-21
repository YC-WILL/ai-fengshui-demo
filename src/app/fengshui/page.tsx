import MethodPageShell from "@/components/MethodPageShell";
import { HomeWorkspace } from "@/components/MethodWorkspaces";

export default function FengShuiPage() {
  return (
    <MethodPageShell current="home" title="宅居盘" basis="八方 · 八卦 · 真实空间" lead="方位是传统结构坐标，采光、通风、噪音、动线和安全是现实居住条件。两者分开呈现，再放回同一张宅居盘。">
      <HomeWorkspace />
    </MethodPageShell>
  );
}
