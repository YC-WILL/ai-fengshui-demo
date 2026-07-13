import Link from "next/link";
import { MEMBERSHIP_PRICING } from "@/lib/types";

const BENEFITS = [
  { title: "免费内容完整可用", desc: "每日一卦和所有基础报告都能独立帮助你形成初步判断。" },
  { title: "会员陪你继续细看", desc: "把八字、关系、住宅和择日放进更具体的生活场景中慢慢梳理。" },
  { title: "持续记录与回顾", desc: "保存历史报告、前后对照，并逐步提供每周小笺和每月回顾。" },
  { title: "不是购买神秘结论", desc: "会员获得的是深入说明和持续陪伴；后续追问等服务会逐步开放。" }
];

export default function MembershipTeaser() {
  const monthly = MEMBERSHIP_PRICING.monthly.amountFen / 100;
  const annual = MEMBERSHIP_PRICING.annual.amountFen / 100;
  return (
    <section className="card border-gold/40">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-3">
        <h3 className="font-serif text-xl">免费使用 / 卦安常伴</h3>
        <span className="text-xs text-ink/50">基础内容免费完整 · 会员提供持续陪伴</span>
      </div>
      <ul className="grid sm:grid-cols-2 gap-3">
        {BENEFITS.map(benefit => (
          <li key={benefit.title} className="bg-mist/30 rounded-lg p-3">
            <div className="font-medium text-ink">{benefit.title}</div>
            <div className="text-xs text-ink/60 mt-1 leading-5">{benefit.desc}</div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span>月度常伴 ¥{monthly}</span>
        <span>年度常伴 ¥{annual}</span>
        <Link href="/me" className="text-cinnabar hover:underline">了解卦安常伴</Link>
        <span className="text-xs text-ink/40">当前为 mock 会员体验，不会真实扣款。</span>
      </div>
    </section>
  );
}
