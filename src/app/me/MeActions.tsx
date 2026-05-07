"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MeActions({
  email, nickname
}: {
  email: string | null;
  nickname: string | null;
}) {
  const router = useRouter();
  const [emailInput, setEmail] = useState(email ?? "");
  const [nick, setNick] = useState(nickname ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: emailInput || undefined,
          nickname: nick || undefined
        })
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? "保存失败");
      setMsg("已保存");
      router.refresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h3 className="font-serif text-lg mb-2">账户信息</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="field-label">邮箱（可选，用于跨设备找回）</label>
          <input
            type="email"
            className="field-input"
            value={emailInput}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="field-label">昵称（可选）</label>
          <input
            className="field-input"
            value={nick}
            onChange={e => setNick(e.target.value)}
            maxLength={40}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn-primary" disabled={busy} onClick={save}>
          {busy ? "保存中…" : "保存"}
        </button>
        {msg && <span className="text-sm text-ink/60">{msg}</span>}
      </div>
    </section>
  );
}
