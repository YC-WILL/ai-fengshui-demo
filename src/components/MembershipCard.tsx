"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEMBERSHIP_PRICING, type MembershipPlan } from "@/lib/types";

const BENEFITS = [
  "所有八字、关系、住宅与择日深度内容",
  "一份会员覆盖四类内容，不再逐份购买",
  "会员期间随时回看已经生成的深度报告",
  "后续追问、每周小笺与每月回顾（陆续开放）"
];

export default function MembershipCard() {
  const router = useRouter();
  const [loading, setLoading] = useState<MembershipPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function activate(plan: MembershipPlan) {
    setLoading(plan);
    setErr(null);
    try {
      const response = await fetch("/api/membership/mock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error ?? "开通失败");
      router.refresh();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "开通失败");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="card border-gold/40 bg-gradient-to-br from-mist/40 to-white mt-4">
      <div className="text-xs tracking-[0.18em] text-gold/90 mb-1">卦安常伴</div>
      <h2 className="font-serif text-xl mb-2">免费内容已经完整，会员陪你继续细看</h2>
      <p className="text-sm text-ink/70 leading-6">
        会员不是购买一份更神秘的结论，而是获得更深入的场景说明、持续记录和后续陪伴。
      </p>
      <ul className="mt-3 grid md:grid-cols-2 gap-2 text-sm text-ink/80">
        {BENEFITS.map(item => <li key={item}>· {item}</li>)}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        {(["monthly", "annual"] as MembershipPlan[]).map(plan => {
          const pricing = MEMBERSHIP_PRICING[plan];
          return (
            <button
              key={plan}
              type="button"
              className={plan === "annual" ? "btn-primary" : "btn-secondary"}
              disabled={loading !== null}
              onClick={() => activate(plan)}
            >
              {loading === plan
                ? "开通中…"
                : `${pricing.label} · ¥${(pricing.amountFen / 100).toFixed(0)}`}
            </button>
          );
        })}
      </div>
      {err && <div className="text-sm text-cinnabar mt-2">{err}</div>}
      <p className="text-[11px] text-ink/45 mt-3">
        当前为 mock 会员体验，不会产生真实扣款，也未接入自动续费。
      </p>
    </section>
  );
}
