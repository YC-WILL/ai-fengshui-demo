import AlmanacCard from "@/components/AlmanacCard";
import EntryGrid from "@/components/EntryGrid";
import Hero from "@/components/Hero";
import PaywallTeaser from "@/components/PaywallTeaser";
import { buildAlmanac } from "@/lib/domain/almanac";
import { brand } from "@/lib/config/brand";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const almanac = buildAlmanac(new Date());
  return (
    <div className="space-y-8">
      <Hero />

      <section id="almanac">
        <AlmanacCard data={almanac} />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-serif text-xl">今天可以为你做什么</h3>
          <span className="text-xs text-ink/50">所有报告均经过安全审查 · 不做绝对预测</span>
        </div>
        <EntryGrid />
      </section>

      <PaywallTeaser />

      <section className="text-xs text-ink/55 leading-6 card">
        <div className="font-medium text-ink/80 mb-1">关于 {brand.brandFullName}</div>
        {brand.brandDisclaimerShort}
        {" "}AI 输出在展示前会经过 18+ 条内容安全规则的过滤，命中高风险词会自动阻断；
        命中绝对化措辞会改写为克制表达。如涉及健康、法律、投资、婚姻等重要事项，请咨询相应专业人士。
      </section>
    </div>
  );
}
