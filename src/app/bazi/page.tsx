"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BaziFields, { EMPTY_BAZI } from "@/components/forms/BaziFields";
import SubmitBar from "@/components/forms/SubmitBar";
import PageIntro from "@/components/PageIntro";
import { type BaziInput, type ReportType } from "@/lib/types";

export default function BaziPage() {
  const router = useRouter();
  const [input, setInput] = useState<BaziInput>(EMPTY_BAZI);
  const [loading, setLoading] = useState<"basic" | "deep" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go(reportType: ReportType, tier: "basic" | "deep") {
    setErr(null);
    if (!input.birthDate) { setErr("请填写出生日期"); return; }
    setLoading(tier);
    try {
      const r = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportType, tier, input })
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
      <PageIntro
        title="八字参考报告"
        subtitle="从传统命理结构出发，分析五行分布、性格倾向、生活节奏与可执行建议。深度版补充事业方向、财富习惯、年度节奏与可执行行动建议。"
        avoid={["命运绝对预测", "寿命与疾病判断", "财富数字预测", "改命 / 消灾承诺"]}
      />

      <section className="card">
        <BaziFields value={input} onChange={setInput} />
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
