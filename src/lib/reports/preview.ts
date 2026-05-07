// ============================================================
// 付费报告"预览版"：截取首段 + 列出章节标题
// 用于：付费墙之上的免费试看
// ============================================================

export function makePreview(text: string): string {
  const flat = (text ?? "").replace(/\r/g, "");
  const head = flat.slice(0, 600);
  const sections = (flat.match(/^##\s.+/gm) ?? []).slice(0, 12).join("\n");
  return [
    head + (flat.length > 600 ? "\n\n（…后文需解锁查看）" : ""),
    "",
    "---",
    "**完整章节预览：**",
    sections || "（无章节标题）"
  ].join("\n");
}
