import AlmanacCard from "@/components/AlmanacCard";
import CompanionExperience from "@/components/CompanionExperience";
import DailySignDraw from "@/components/DailySignDraw";
import WoodenToad from "@/components/WoodenToad";
import { buildAlmanac } from "@/lib/domain/almanac";
import { brand } from "@/lib/config/brand";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const almanac = buildAlmanac(new Date());
  return (
    <div className="space-y-8">
      <section id="companion" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <CompanionExperience />
        <aside id="daily-sign" className="space-y-4 scroll-mt-24">
          <DailySignDraw />
          <WoodenToad />
        </aside>
      </section>

      <section id="almanac" className="scroll-mt-24">
        <AlmanacCard data={almanac} />
      </section>

      <section className="text-xs text-ink/55 leading-6 card">
        <div className="font-medium text-ink/80 mb-1">关于 {brand.brandFullName}</div>
        {brand.brandDisclaimerShort}
        {" "}对话会经过内容安全检查，不作绝对预测或心理诊断。如涉及健康、法律、投资、安全等重要事项，请咨询相应专业人士。
      </section>
    </div>
  );
}
