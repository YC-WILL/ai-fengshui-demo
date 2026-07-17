"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BaziFields, { EMPTY_BAZI } from "@/components/forms/BaziFields";
import SubmitBar from "@/components/forms/SubmitBar";
import PageIntro from "@/components/PageIntro";
import { type BaziInput, type ReportType } from "@/lib/types";
import { fetchReport, readReportResponse } from "@/lib/reports/client";

type Stage = "dating" | "engaged" | "married" | "considering";

export default function MarriagePage() {
  const router = useRouter();
  const [a, setA] = useState<BaziInput>({ ...EMPTY_BAZI, gender: "male" });
  const [b, setB] = useState<BaziInput>({ ...EMPTY_BAZI, gender: "female" });
  const [stage, setStage] = useState<Stage>("dating");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<"basic" | "deep" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go(reportType: ReportType, tier: "basic" | "deep") {
    setErr(null);
    if (!a.birthDate || !b.birthDate) { setErr("请填写双方出生日期"); return; }
    setLoading(tier);
    try {
      const r = await fetchReport("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reportType, tier,
          input: { partyA: a, partyB: b, relationshipStage: stage, notes }
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
        title="看看你们相处的步调"
        subtitle="不替你们判断关系结果，只聊聊彼此合拍的地方、不同的节奏，以及怎样更好地听见对方。"
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
            <label className="field-label">你们最近的困扰与想法（可选）</label>
            <textarea
              className="field-input min-h-[90px]"
              maxLength={500}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="如：一方觉得对方不回应，另一方觉得自己一直在解释；最近也在讨论家务或财务分工。"
            />
          </div>
        </div>
        <SubmitBar
          loading={loading}
          error={err}
          onBasic={() => go("marriage_basic", "basic")}
          onDeep={() => go("marriage_deep", "deep")}
          deepLabel="继续细看这段关系"
        />
      </section>
    </div>
  );
}
