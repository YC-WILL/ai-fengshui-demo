import MethodPageShell from "@/components/MethodPageShell";
import { BaziWorkspace } from "@/components/MethodWorkspaces";

export default function BaziPage() {
  return (
    <MethodPageShell current="bazi" title="八字盘" basis="四柱 · 日主 · 月令 · 藏干 · 十神" lead="从四柱明字开始，逐层查看日主、五行、月令、藏干与十神。年柱按立春交接、月柱按节气交接时刻切换；未知出生时间时，时柱保持空白。">
      <BaziWorkspace />
    </MethodPageShell>
  );
}
