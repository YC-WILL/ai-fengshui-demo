import DailySignDraw from "@/components/DailySignDraw";
import MethodEntryGrid from "@/components/MethodEntryGrid";
import SolarTermTimeline from "@/components/SolarTermTimeline";
import TodayCorrespondence from "@/components/TodayCorrespondence";
import WoodenToad from "@/components/WoodenToad";
import { brand } from "@/lib/config/brand";
import { solarTermTimeline } from "@/lib/domain/dailyCorrespondence";
import { dateKeyInTimeZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const solarTerms = solarTermTimeline(dateKeyInTimeZone());
  return (
    <div className="space-y-8">
      <SolarTermTimeline data={solarTerms} />

      <section className="home-intro" aria-labelledby="home-method-title">
        <div>
          <div className="section-kicker">今日 · {solarTerms.current.name}</div>
          <h2 id="home-method-title" className="mt-2 font-serif text-3xl md:text-4xl">把传统方法，做成可以反复使用的四张盘</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/60">不是读完即走的长报告。先建立自己的盘，再保存关系、住宅与事项，让每一次回来都有上下文。</p>
        </div>
        <div className="home-intro-mark" aria-hidden>安</div>
      </section>

      <MethodEntryGrid />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-5">
          <TodayCorrespondence />
        </div>
        <aside id="daily-sign" className="space-y-4 scroll-mt-24">
          <DailySignDraw />
          <WoodenToad />
        </aside>
      </section>

      <section className="text-xs text-ink/55 leading-6 card">
        <div className="font-medium text-ink/80 mb-1">关于 {brand.brandFullName}</div>
        {brand.brandDisclaimerShort}
        {" "}今日相应只呈现传统历法结构，不作绝对预测，也不把五行关系直接解释为现实结果。如涉及健康、法律、投资、安全等重要事项，请咨询相应专业人士。
      </section>
    </div>
  );
}
