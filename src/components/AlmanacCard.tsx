import type { AlmanacToday } from "@/lib/domain/almanac";

export default function AlmanacCard({ data }: { data: AlmanacToday }) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
        <h2 className="font-serif text-2xl">今日黄历</h2>
        <span className="text-sm text-ink/60">
          {data.gregorian} · {data.weekday} · {data.ganzhiDay} · {data.solarTerm}
        </span>
      </div>

      <p className="italic text-cinnabar/90 mb-4">{data.oneLine}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="五行" value={data.fiveElement} />
        <Stat label="生肖（日）" value={data.zodiacOfDay} />
        <Stat label="冲煞" value={data.zodiacClash} />
        <Stat label="吉时" value={data.luckyHours.join("、")} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-jade mb-1">宜</div>
          <ul className="list-disc pl-5 text-sm leading-6">
            {data.goodFor.map(g => <li key={g}>{g}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-sm font-medium text-cinnabar mb-1">忌</div>
          <ul className="list-disc pl-5 text-sm leading-6">
            {data.badFor.map(b => <li key={b}>{b}</li>)}
          </ul>
        </div>
      </div>

      <p className="text-xs text-ink/50 mt-4 leading-5">{data.cultureNote}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-mist/40 rounded-lg px-3 py-2">
      <div className="text-xs text-ink/60">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
