"use client";

import { useState } from "react";
import { fetchReport, readJsonResponse } from "@/lib/reports/client";

export default function DeleteAccountButton() {
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function destroy() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetchReport("/api/me", { method: "DELETE" });
      const j = await readJsonResponse(r);
      if (!r.ok || !j.ok) throw new Error(j.error ?? "删除失败");
      setMsg("已删除您的账户和所有数据，正在跳转首页…");
      setTimeout(() => { window.location.href = "/"; }, 800);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "删除失败");
    } finally {
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
        我已了解：本操作不可撤销，将清除我的账户、生辰资料和相关数据。
      </label>
      <button
        className="btn-secondary border-cinnabar/40 text-cinnabar hover:bg-cinnabar/5"
        onClick={destroy}
        disabled={!confirmed || busy}
      >
        {busy ? "处理中…" : "永久删除我的账户与数据"}
      </button>
      {msg && <div className="text-sm text-ink/60">{msg}</div>}
    </div>
  );
}
