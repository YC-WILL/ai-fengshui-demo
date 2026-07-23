import type { SolarTermTimeline as SolarTermTimelineData } from "@/lib/domain/dailyCorrespondence";
import { solarTermNote } from "@/lib/product/solarTermPresentation";

export default function SolarTermTimeline({ data }: { data: SolarTermTimelineData }) {
  const year = data.date.slice(0, 4);
  return (
    <section className="solar-term-card" aria-labelledby="solar-term-title">
      <div className="solar-term-hero">
        <div className="solar-term-copy">
          <div>
            <div className="section-kicker">今日 · {formatDate(data.date)}</div>
            <div className="solar-term-label">二十四节气</div>
            <h1 id="solar-term-title" className="solar-term-title">{data.current.name}</h1>
            <p className="solar-term-note">{solarTermNote(data.current.name)}</p>
          </div>

          <div>
            <div className="solar-term-boundary">
              <span>{formatDate(data.current.date)}交节</span>
              <span>下一个 · {data.next.name} {formatDate(data.next.date)}</span>
            </div>
            <div className="solar-term-progress mt-2" aria-label={`${data.current.name}节气进度`}>
              <span style={{ width: `${data.progress * 100}%` }} />
            </div>
            <div className="solar-term-updated">
              页面每天按北京时间更新，进入下一节气后自动切换。
            </div>
          </div>
        </div>

        <div className="solar-term-rhythm" aria-label={`今天是${data.current.name}第${data.elapsedDays + 1}天`}>
          <span>{data.current.season} · {data.current.monthBranch}月</span>
          <div><strong>{data.elapsedDays + 1}</strong><small> / {data.totalDays} 日</small></div>
          <p>今日处在本节气中的位置</p>
          <i aria-hidden>{data.current.name.slice(0, 1)}</i>
        </div>
      </div>

      <details className="solar-term-year-list">
          <summary>查看 {year} 年二十四节气</summary>
          <ol className="solar-term-grid mt-3">
            {data.yearTerms.map(term => {
              const active = term.name === data.current.name && term.date === data.current.date;
              return (
                <li key={`${term.name}-${term.date}`} className={active ? "is-current" : ""}>
                  <span className="solar-term-season" aria-hidden>{term.season}</span>
                  <span className="font-serif text-sm">{term.name}</span>
                  <time dateTime={term.date}>{formatDate(term.date)}</time>
                </li>
              );
            })}
          </ol>
          <p className="solar-term-year-note">
            交节日期按北京时间计算，支持 1900–2100 年；临近交节时以具体时刻复核。
          </p>
      </details>
    </section>
  );
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
