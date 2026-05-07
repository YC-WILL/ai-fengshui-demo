"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REPORT_PRICING } from "@/lib/types";
import type { ReportType } from "@/lib/types";

export default function PaywallCard({
  reportId,
  reportType
}: {
  reportId: string;
  reportType: ReportType;
}) {
  const pricing = REPORT_PRICING[reportType];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!pricing) return null;

  async function unlock() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportId })
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? "支付失败");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "支付失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card border-gold/40 bg-mist/30 mt-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-lg font-serif">解锁完整深度报告</div>
          <div className="text-sm text-ink/70 mt-1">
            上方为预览，完整版包含全部章节、可执行建议与 0–1000 元三档优化方案。
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-serif text-cinnabar">
            ¥{(pricing.amountFen / 100).toFixed(2)}
          </div>
          <button
            className="btn-primary mt-2"
            onClick={unlock}
            disabled={loading}
          >
            {loading ? "处理中…" : "解锁完整报告"}
          </button>
          {err && <div className="text-xs text-cinnabar mt-1">{err}</div>}
          <div className="text-[10px] text-ink/50 mt-1">
            （MVP：当前为模拟支付。正式上线接入微信/支付宝。）
          </div>
        </div>
      </div>
    </div>
  );
}
