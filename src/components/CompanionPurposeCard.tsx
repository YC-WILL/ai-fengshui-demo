"use client";

import { useState } from "react";
import {
  COMPANION_PURPOSES,
  type CompanionPurpose
} from "@/lib/companion/core";
import { readJsonResponse } from "@/lib/reports/client";

export default function CompanionPurposeCard({ initialPurpose }: { initialPurpose: CompanionPurpose | null }) {
  const [purpose, setPurpose] = useState(initialPurpose);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<CompanionPurpose | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save(nextPurpose: CompanionPurpose) {
    setBusy(nextPurpose);
    setMessage(null);
    try {
      const response = await fetch("/api/companion/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose: nextPurpose })
      });
      const json = await readJsonResponse<{ ok?: boolean; error?: string }>(response, "初心保存");
      if (!response.ok || !json.ok) throw new Error(json.error ?? "保存失败");
      setPurpose(nextPurpose);
      setEditing(false);
      setMessage("已经记下了");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "暂时无法保存");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm("删除这项初心记录后，下次回到首页会重新进行首次选择。确定删除吗？")) return;
    setMessage(null);
    try {
      const response = await fetch("/api/companion/profile", { method: "DELETE" });
      const json = await readJsonResponse<{ ok?: boolean; error?: string }>(response, "初心删除");
      if (!response.ok || !json.ok) throw new Error(json.error ?? "删除失败");
      setPurpose(null);
      setEditing(false);
      setMessage("这项记录已经删除");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "暂时无法删除");
    }
  }

  return (
    <section id="purpose" className="card scroll-mt-24 border-gold/35 bg-gradient-to-br from-white to-rice/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs tracking-[0.22em] text-cinnabar/65">我来到蟾先森的初心</div>
          <h3 className="mt-1 font-serif text-xl">
            {purpose ? COMPANION_PURPOSES[purpose].title : "还没有选择"}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            {purpose
              ? `${COMPANION_PURPOSES[purpose].description} 这会帮助蟾先森更自然地陪你，但不会限制你以后可以聊什么。`
              : "完成第一次选择后，这里会保存你希望怎样被陪伴。"}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setEditing(value => !value)}>
          {editing ? "收起" : purpose ? "重新选择" : "现在选择"}
        </button>
      </div>

      {editing && (
        <>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(Object.keys(COMPANION_PURPOSES) as CompanionPurpose[]).map(key => (
              <button
                key={key}
                type="button"
                disabled={busy !== null}
                onClick={() => void save(key)}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  key === purpose ? "border-cinnabar/35 bg-cinnabar/5" : "border-mist bg-white/70 hover:border-gold/60"
                }`}
              >
                <span className="font-medium">{COMPANION_PURPOSES[key].title}</span>
                <span className="mt-1 block text-xs leading-5 text-ink/55">{COMPANION_PURPOSES[key].description}</span>
                {busy === key && <span className="mt-1 block text-xs text-cinnabar">正在保存……</span>}
              </button>
            ))}
          </div>
          {purpose && (
            <button type="button" onClick={() => void remove()} className="mt-3 text-xs text-cinnabar/75 underline">
              删除这项记录
            </button>
          )}
        </>
      )}
      {message && <p className="mt-3 text-xs text-ink/55">{message}</p>}
    </section>
  );
}
