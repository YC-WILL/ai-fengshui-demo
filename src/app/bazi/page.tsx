"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BaziFields, { EMPTY_BAZI } from "@/components/forms/BaziFields";
import SubmitBar from "@/components/forms/SubmitBar";
import DraftNotice from "@/components/forms/DraftNotice";
import PageIntro from "@/components/PageIntro";
import { type BaziInput, type ReportType } from "@/lib/types";
import { fetchReport, readReportResponse } from "@/lib/reports/client";
import { useFormDraft } from "@/lib/hooks/useFormDraft";

export default function BaziPage() {
  const router = useRouter();
  const [input, setInput, clearDraft, hasDraft] = useFormDraft<BaziInput>("guaan:draft:bazi", EMPTY_BAZI);
  const [loading, setLoading] = useState<"basic" | "deep" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go(reportType: ReportType, tier: "basic" | "deep") {
    setErr(null);
    if (!input.birthDate) { setErr("请填写出生日期"); return; }
    setLoading(tier);
    try {
      const r = await fetchReport("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportType, tier, input })
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
        title="聊聊你的性格与步调"
        subtitle="从传统文化的角度看看你的做事方式、生活节奏和内在力量，也给日常生活留几句温和、能做到的建议。"
        avoid={["命运绝对预测", "寿命与疾病判断", "财富数字预测", "改命 / 消灾承诺"]}
      />

      <section className="card">
        <DraftNotice hasDraft={hasDraft} onClear={clearDraft} />
        <BaziFields value={input} onChange={setInput} />
        <div className="mt-4">
          <label className="field-label" htmlFor="bazi-user-context">你最近正被什么困扰？（可选）</label>
          <textarea
            id="bazi-user-context"
            className="field-input min-h-[100px]"
            maxLength={500}
            value={input.userContext ?? ""}
            onChange={e => setInput(s => ({ ...s, userContext: e.target.value }))}
            placeholder="可以写一件具体的事：最近总在犹豫要不要换方向、和人沟通时容易卡住，或只是想知道为什么总是拖到最后才行动。"
          />
          <div className="field-help">这段话会帮助报告回应你的真实处境，不会把它当成诊断或给出宿命判断。</div>
        </div>
        <SubmitBar
          loading={loading}
          error={err}
          onBasic={() => go("bazi_basic", "basic")}
          onDeep={() => go("bazi_deep", "deep")}
          deepLabel="继续细看八字"
        />
      </section>

      <Tips />
    </div>
  );
}

function Tips() {
  return (
    <section className="text-xs text-ink/60 leading-6 card">
      <div className="font-medium text-ink/80 mb-1">使用须知</div>
      <ul className="list-disc pl-5 space-y-0.5">
        <li>本算法为简化版四柱，年/月柱未严格按节气切换；如需精准结果建议补充节气数据。</li>
        <li>未知出生时间时，会省略时柱，相关结论仅作参考。</li>
        <li>报告由 AI 自动生成，不构成医疗、法律、财务、婚姻等专业建议。</li>
      </ul>
    </section>
  );
}
