"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BaziFields, { EMPTY_BAZI } from "@/components/forms/BaziFields";
import SubmitBar from "@/components/forms/SubmitBar";
import { REPORT_PRICING, type BaziInput, type DateSelectionEvent } from "@/lib/types";

const EVENT_OPTIONS: { value: DateSelectionEvent; label: string }[] = [
  { value: "wedding", label: "结婚" },
  { value: "moving", label: "搬家" },
  { value: "opening", label: "开业" },
  { value: "signing", label: "签约" },
  { value: "travel", label: "出行" },
  { value: "renovation_start", label: "装修动工" }
];

export default function DateSelectionPage() {
  const router = useRouter();
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const [event, setEvent] = useState<DateSelectionEvent>("wedding");
  const [start, setStart] = useState(fmt(today));
  const [end, setEnd] = useState(fmt(new Date(today.getTime() + 30 * 86400000)));
  const [user, setUser] = useState<BaziInput>(EMPTY_BAZI);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"basic" | "deep" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const price = REPORT_PRICING.date_selection!.amountFen;

  async function go() {
    setErr(null);
    if (!user.birthDate) { setErr("请填写本人出生日期"); return; }
    setLoading("basic");
    try {
      const r = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reportType: "date_selection",
          tier: "basic",
          input: { event, dateRangeStart: start, dateRangeEnd: end, user, notes }
        })
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? "生成失败");
      router.push(`/reports/${j.data.reportId}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "生成失败");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl mb-1">择日参考</h1>
        <p className="text-sm text-ink/70">
          按事项与日期区间，给出多个推荐日期、原因与现实准备清单。
          本报告为「民俗参考」，不作为唯一决策依据。
        </p>
      </header>

      <section className="card space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="field-label">事项</label>
            <select
              className="field-input"
              value={event}
              onChange={e => setEvent(e.target.value as DateSelectionEvent)}
            >
              {EVENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">区间起</label>
            <input type="date" className="field-input" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="field-label">区间止（最长 90 天）</label>
            <input type="date" className="field-input" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>

        <div className="border-t border-mist pt-3">
          <div className="text-sm font-medium mb-2">本人信息</div>
          <BaziFields value={user} onChange={setUser} />
        </div>

        <div>
          <label className="field-label">备注（可选）</label>
          <input
            className="field-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="如：希望避开父母忌日 / 排除某段时间出差 等"
            maxLength={200}
          />
        </div>

        <SubmitBar
          loading={loading}
          error={err}
          basicLabel={`生成择日参考（¥${(price / 100).toFixed(0)}）`}
          onBasic={go}
        />
      </section>
    </div>
  );
}
