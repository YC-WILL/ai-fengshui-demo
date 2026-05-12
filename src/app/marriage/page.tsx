"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BaziFields, { EMPTY_BAZI } from "@/components/forms/BaziFields";
import SubmitBar from "@/components/forms/SubmitBar";
import PageIntro from "@/components/PageIntro";
import { REPORT_PRICING, type BaziInput, type ReportType } from "@/lib/types";

type Stage = "dating" | "engaged" | "married" | "considering";

export default function MarriagePage() {
  const router = useRouter();
  const [a, setA] = useState<BaziInput>({ ...EMPTY_BAZI, gender: "male" });
  const [b, setB] = useState<BaziInput>({ ...EMPTY_BAZI, gender: "female" });
  const [stage, setStage] = useState<Stage>("dating");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"basic" | "deep" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const deepPrice = REPORT_PRICING.marriage_deep!.amountFen;

  async function go(reportType: ReportType, tier: "basic" | "deep") {
    setErr(null);
    if (!a.birthDate || !b.birthDate) { setErr("请填写双方出生日期"); return; }
    setLoading(tier);
    try {
      const r = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reportType, tier,
          input: { partyA: a, partyB: b, relationshipStage: stage, notes }
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
      <PageIntro
        title="关系匹配报告"
        subtitle="结合传统文化结构与心理学沟通框架，分析双方关系优势、潜在摩擦与沟通建议。深度版扩展到金钱观、家庭责任倾向、冲突处理与适合共同推进的事项。"
        avoid={["合婚断定", "正缘 / 孽缘 / 烂桃花标签", "必合 / 必分判断", "克夫 / 克妻"]}
      />

      <section className="card">
        <h3 className="font-serif text-lg mb-2">甲方信息</h3>
        <BaziFields value={a} onChange={setA} prefix="a-" />
      </section>

      <section className="card">
        <h3 className="font-serif text-lg mb-2">乙方信息</h3>
        <BaziFields value={b} onChange={setB} prefix="b-" />
      </section>

      <section className="card">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="field-label">关系阶段</label>
            <select
              className="field-input"
              value={stage}
              onChange={e => setStage(e.target.value as Stage)}
            >
              <option value="considering">还在考虑要不要在一起</option>
              <option value="dating">恋爱中</option>
              <option value="engaged">已订婚</option>
              <option value="married">已婚</option>
            </select>
          </div>
          <div>
            <label className="field-label">想重点关注（可选）</label>
            <input
              className="field-input"
              maxLength={100}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="如：沟通方式、家务分工、财务观"
            />
          </div>
        </div>
        <SubmitBar
          loading={loading}
          error={err}
          onBasic={() => go("marriage_basic", "basic")}
          onDeep={() => go("marriage_deep", "deep")}
          deepPriceFen={deepPrice}
        />
      </section>
    </div>
  );
}
