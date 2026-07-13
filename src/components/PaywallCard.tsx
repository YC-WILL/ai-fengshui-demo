"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REPORT_PRICING } from "@/lib/types";
import type { ReportType } from "@/lib/types";

// 报告类型特异的"权益"——比通用文案更打动用户
const BENEFITS_BY_TYPE: Partial<Record<ReportType, string[]>> = {
  bazi_deep: [
    "完整四柱解读 · 不止性格关键词",
    "事业方向 / 财富习惯 / 情感模式分章",
    "年度生活节奏参考",
    "每章 2–3 条可执行行动建议"
  ],
  marriage_deep: [
    "双方结构对比 + 心理学视角并行",
    "金钱观与家庭责任倾向分析",
    "冲突高发点 + 现实可执行的相处规则",
    "需要提前沟通的议题清单"
  ],
  home_fengshui_deep: [
    "六大空间逐一拆解（玄关 / 客厅 / 卧室 / 厨房 / 卫生间 / 书房）",
    "传统视角 + 现实空间逻辑双线分析",
    "0 元 / 300 元内 / 1000 元内 三档优化方案",
    "针对你输入的「关注问题」给出具体改善"
  ],
  date_selection: [
    "区间内更多备选日期",
    "每个日期的生活化说明",
    "不妨绕开的日期与替代选择",
    "事项专属的现实准备清单"
  ]
};

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
  const benefits = BENEFITS_BY_TYPE[reportType] ?? [
    "更完整的结构分析",
    "更具体的风险提示",
    "可执行行动建议",
    "可保存历史报告"
  ];

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
    <div className="card border-gold/40 bg-gradient-to-br from-mist/40 to-white mt-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <div className="text-xs uppercase tracking-[0.2em] text-gold/80 mb-1">
            Premium
          </div>
          <div className="font-serif text-xl mb-1">解锁完整深度报告</div>
          <div className="text-sm text-ink/70 leading-6">
            基础报告展示核心结构，深度报告将补充完整章节、风险提示、行动建议与个性化解释。
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/80">
            {benefits.map(b => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-cinnabar" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-right min-w-[140px]">
          <div className="text-xs text-ink/55">{pricing.label}</div>
          <div className="text-3xl font-serif text-cinnabar mt-1">
            ¥{(pricing.amountFen / 100).toFixed(0)}
          </div>
          <div className="text-[10px] text-ink/45 mb-2">一次买断 · 永久查看</div>
          <button
            className="btn-primary w-full"
            onClick={unlock}
            disabled={loading}
          >
            {loading ? "处理中…" : "模拟解锁深度报告"}
          </button>
          {err && <div className="text-xs text-cinnabar mt-1">{err}</div>}
          <div className="text-[10px] text-ink/40 mt-2 leading-4">
            当前为 mock 支付，未接入真实通道；<br/>正式上线对接微信 / 支付宝。
          </div>
        </div>
      </div>
    </div>
  );
}
