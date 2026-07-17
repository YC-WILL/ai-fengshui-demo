"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BaziFields, { EMPTY_BAZI } from "@/components/forms/BaziFields";
import SubmitBar from "@/components/forms/SubmitBar";
import DraftNotice from "@/components/forms/DraftNotice";
import PageIntro from "@/components/PageIntro";
import { type BaziInput, type DateSelectionEvent } from "@/lib/types";
import { fetchReport, readReportResponse } from "@/lib/reports/client";
import { useFormDraft } from "@/lib/hooks/useFormDraft";
import { addDaysToDateKey, dateKeyInTimeZone } from "@/lib/time";

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
  const todayKey = dateKeyInTimeZone();
  const [draft, setDraft, clearDraft, hasDraft] = useFormDraft("guaan:draft:date-selection", () => ({
    event: "wedding" as DateSelectionEvent,
    start: todayKey,
    end: addDaysToDateKey(todayKey, 30),
    user: EMPTY_BAZI,
    notes: ""
  }));
  const { event, start, end, user, notes } = draft;
  const [loading, setLoading] = useState<"basic" | "deep" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go(reportType: "date_selection_basic" | "date_selection", tier: "basic" | "deep") {
    setErr(null);
    if (!user.birthDate) { setErr("请填写本人出生日期"); return; }
    setLoading(tier);
    try {
      const r = await fetchReport("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reportType,
          tier,
          input: { event, dateRangeStart: start, dateRangeEnd: end, user, notes }
        })
      });
      const j = await readReportResponse(r);
      if (!r.ok || !j.ok || !j.data?.reportId) throw new Error(j.error ?? "生成失败");
      router.push(`/reports/${j.data.reportId}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "生成失败");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="挑个从容的日子"
        subtitle="每天可以先免费看看一两个合适的日子；想把整段时间细细挑一遍，再查看更多备选、绕开日期和完整准备清单。"
        avoid={["绝对吉凶", "保证顺利", "唯一决策依据"]}
      />

      <section className="card space-y-3">
        <DraftNotice hasDraft={hasDraft} onClear={clearDraft} />
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="field-label">事项</label>
            <select
              className="field-input"
              value={event}
              onChange={e => setDraft(s => ({ ...s, event: e.target.value as DateSelectionEvent }))}
            >
              {EVENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">区间起</label>
            <input type="date" className="field-input" value={start} onChange={e => setDraft(s => ({ ...s, start: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">区间止（最长 90 天）</label>
            <input type="date" className="field-input" value={end} onChange={e => setDraft(s => ({ ...s, end: e.target.value }))} />
          </div>
        </div>

        <div className="border-t border-mist pt-3">
          <div className="text-sm font-medium mb-2">本人信息</div>
          <BaziFields value={user} onChange={value => setDraft(s => ({ ...s, user: typeof value === "function" ? value(s.user) : value }))} />
        </div>

        <div>
          <label className="field-label">这件事的困扰与现实想法（可选）</label>
          <textarea
            className="field-input min-h-[90px]"
            value={notes}
            onChange={e => setDraft(s => ({ ...s, notes: e.target.value }))}
            placeholder="如：家人只能在周末到场、签约前总担心遗漏条款、搬家时最怕天气和时间来不及。"
            maxLength={300}
          />
        </div>

        <SubmitBar
          loading={loading}
          error={err}
          basicLabel="先免费看看合适的日子"
          deepLabel="把这段日子细细挑一遍"
          onBasic={() => go("date_selection_basic", "basic")}
          onDeep={() => go("date_selection", "deep")}
        />
      </section>
    </div>
  );
}
