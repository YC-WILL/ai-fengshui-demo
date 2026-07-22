import type { SolarTermTimeline as SolarTermTimelineData } from "@/lib/domain/dailyCorrespondence";
import { solarTermScene } from "@/lib/product/solarTermScenes";

export default function SolarTermTimeline({ data }: { data: SolarTermTimelineData }) {
  const year = data.date.slice(0, 4);
  const scene = solarTermScene(data.current.name);
  const [x, y, width, height] = scene.crop;
  return (
    <section className="solar-term-card" aria-labelledby="solar-term-title">
      <div className="solar-term-hero">
        <div className="solar-term-scene" aria-hidden="true">
          <svg viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio="xMidYMid slice" role="presentation">
            <image href="/assets/solar-term-scenes.jpg" width="1536" height="1024" />
          </svg>
          <span>卦安 · 节气图景</span>
        </div>

        <div className="solar-term-copy">
          <div>
            <div className="section-kicker">今日 · {formatDate(data.date)}</div>
            <div className="mt-3 text-xs tracking-[0.24em] text-ink/45">二十四节气</div>
            <h1 id="solar-term-title" className="mt-1 font-serif text-4xl md:text-5xl">{data.current.name}</h1>
            <p className="mt-3 font-serif text-lg leading-8 text-ink/70">{scene.note}</p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 text-xs text-ink/55">
              <span>{formatDate(data.current.date)}交节</span>
              <span>下一个 · {data.next.name} {formatDate(data.next.date)}</span>
            </div>
            <div className="solar-term-progress mt-2" aria-label={`${data.current.name}节气进度`}>
              <span style={{ width: `${data.progress * 100}%` }} />
            </div>
            <div className="mt-2 text-[11px] leading-5 text-ink/45">
              今天是本节气第 {data.elapsedDays + 1} 天。页面每天按北京时间更新，进入下一节气后自动换景。
            </div>
          </div>
        </div>
      </div>

      <details className="solar-term-year-list">
          <summary className="cursor-pointer text-xs text-cinnabar">查看 {year} 年二十四节气</summary>
          <ol className="solar-term-grid mt-3">
            {data.yearTerms.map(term => {
              const active = term.name === data.current.name && term.date === data.current.date;
              return (
                <li key={`${term.name}-${term.date}`} className={active ? "is-current" : ""}>
                  <span className="solar-term-season" aria-hidden>{term.season}</span>
                  <span className="font-serif text-sm">{term.name}</span>
                  <time className="text-[10px] text-ink/45" dateTime={term.date}>{formatDate(term.date)}</time>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-[11px] leading-5 text-ink/45">
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
