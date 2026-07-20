import type { SolarTermTimeline as SolarTermTimelineData } from "@/lib/domain/dailyCorrespondence";

export default function SolarTermTimeline({ data }: { data: SolarTermTimelineData }) {
  const year = data.date.slice(0, 4);
  return (
    <section className="solar-term-card" aria-labelledby="solar-term-title">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="min-w-[9rem]">
          <div className="text-[11px] tracking-[0.24em] text-cinnabar">二十四节气</div>
          <h2 id="solar-term-title" className="mt-1 font-serif text-2xl">{data.current.name}</h2>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-xs text-ink/55">
            <span>{formatDate(data.current.date)}交节</span>
            <span>下一个 · {data.next.name} {formatDate(data.next.date)}</span>
          </div>
          <div className="solar-term-progress mt-2" aria-label={`${data.current.name}节气进度`}>
            <span style={{ width: `${data.progress * 100}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-ink/45">
            今日处在本节气第 {data.elapsedDays + 1} 天，共约 {data.totalDays} 天
          </div>
        </div>

        <details className="w-full border-t border-mist pt-3">
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
      </div>
    </section>
  );
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
