import AlmanacCard from "@/components/AlmanacCard";
import EntryGrid from "@/components/EntryGrid";
import { buildAlmanac } from "@/lib/domain/almanac";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const almanac = buildAlmanac(new Date());
  return (
    <div className="space-y-6">
      <section>
        <AlmanacCard data={almanac} />
      </section>

      <section>
        <h3 className="font-serif text-xl mb-3">今天可以为你做什么</h3>
        <EntryGrid />
      </section>

      <section className="text-xs text-ink/50 leading-5">
        本站不做命运绝对预测、不承诺改运消灾。所有报告由 AI 自动生成，仅供传统文化、民俗与生活规划参考。
        如涉及健康、法律、投资、婚姻等重要事项，请咨询相应专业人士。
      </section>
    </div>
  );
}
