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

type Stage = "dating" | "engaged" | "married" | "considering";
type MarriageDraft = { a: BaziInput; b: BaziInput; stage: Stage; notes: string };

export default function MarriagePage() {
  const router = useRouter();
  const [draft, setDraft, clearDraft, hasDraft] = useFormDraft<MarriageDraft>("guaan:draft:marriage", () => ({
    a: { ...EMPTY_BAZI, gender: "male" as const },
    b: { ...EMPTY_BAZI, gender: "female" as const },
    stage: "dating" as Stage,
    notes: ""
  }));
  const { a, b, stage, notes } = draft;
  const [loading, setLoading] = useState<"basic" | "deep" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go(reportType: ReportType, tier: "basic" | "deep") {
    setErr(null);
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
        <DraftNotice hasDraft={hasDraft} onClear={clearDraft} />
        <h3 className="font-serif text-lg mb-2">甲方信息（出生资料可选）</h3>
        <BaziFields value={a} onChange={value => setDraft(s => ({ ...s, a: typeof value === "function" ? value(s.a) : value }))} prefix="a-" />
      </section>

      <section className="card">
        <h3 className="font-serif text-lg mb-2">乙方信息（出生资料可选）</h3>
        <BaziFields value={b} onChange={value => setDraft(s => ({ ...s, b: typeof value === "function" ? value(s.b) : value }))} prefix="b-" />
      </section>

      <section className="card">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="field-label">关系阶段</label>
            <select
              className="field-input"
              value={stage}
              onChange={e => setDraft(s => ({ ...s, stage: e.target.value as Stage }))}
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
              onChange={e => setDraft(s => ({ ...s, notes: e.target.value }))}
              placeholder="如：一方觉得对方不回应，另一方觉得自己一直在解释；最近也在讨论家务或财务分工。"
            />
            <div className="field-help">不方便填写出生资料也没关系，尽量写清一件最近发生的具体矛盾，我们会先从沟通场景给建议。</div>
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
