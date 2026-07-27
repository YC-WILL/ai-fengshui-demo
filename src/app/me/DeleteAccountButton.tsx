"use client";

import { useRef, useState } from "react";
import { fetchReport, readJsonResponse } from "@/lib/reports/client";

export default function DeleteAccountButton() {
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const deleting = useRef(false);

  async function destroy() {
    if (deleting.current || !confirmed) return;
    deleting.current = true;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetchReport("/api/me", { method: "DELETE" }, "账户删除");
      const j = await readJsonResponse(r, "账户删除");
      if (!r.ok || !j.ok) throw new Error(j.error ?? "删除失败");
      setMsg("当前匿名身份及其关联数据已删除，正在返回首页…");
      setTimeout(() => { window.location.replace("/"); }, 800);
    } catch (e: unknown) {
      setMsg(e instanceof Error && !/fetch|network|failed/i.test(e.message)
        ? e.message
        : "网络暂时没有连上，数据和当前身份仍然保留，请稍后重试。");
    } finally {
      deleting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm text-ink/80 flex items-center gap-2">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
        />
        我已了解：本操作不可撤销，将删除生辰资料、四盘记录及其行动与复盘、求签记录、旧报告和其他归属于当前匿名身份的数据。
      </label>
      <button
        className="btn-secondary border-cinnabar/40 text-cinnabar hover:bg-cinnabar/5"
        onClick={destroy}
        disabled={!confirmed || busy}
        aria-busy={busy}
      >
        {busy ? "正在删除…" : "永久删除我的账户与数据"}
      </button>
      <div className="min-h-5 text-sm text-ink/60" aria-live="polite">{msg}</div>
    </div>
  );
}
