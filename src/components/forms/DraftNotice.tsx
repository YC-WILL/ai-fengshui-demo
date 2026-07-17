"use client";

export default function DraftNotice({ hasDraft, onClear }: { hasDraft: boolean; onClear: () => void }) {
  if (!hasDraft) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-ink/65">
      <span>已保留上次填写内容，仅保存在当前浏览器。</span>
      <button type="button" className="text-cinnabar underline underline-offset-2" onClick={onClear}>清空并重新填写</button>
    </div>
  );
}
