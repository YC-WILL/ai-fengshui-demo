import MethodPageShell from "@/components/MethodPageShell";
import { BaziWorkspace } from "@/components/MethodWorkspaces";

export default function BaziPage() {
  return (
    <MethodPageShell current="bazi" title="八字盘" basis="四柱 · 日主 · 月令 · 藏干 · 十神" lead="从四柱明字开始，逐层查看日主、五行、月令、藏干与十神。每一项都标出取自哪一柱，未知时辰保持空白，简化排盘口径也会明确说明。">
      <BaziWorkspace />
    </MethodPageShell>
  );
}
