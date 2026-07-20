"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPairStructure, HOME_DIRECTIONS, selectCoreDates, type CoreDateCandidate } from "@/lib/domain/coreMethods";
import type { DateSelectionEvent } from "@/lib/types";

type Tool = "pair" | "home" | "date";

const EVENTS: Array<{ id: DateSelectionEvent; label: string }> = [
  { id: "wedding", label: "婚礼" }, { id: "moving", label: "搬家" }, { id: "opening", label: "开业" },
  { id: "signing", label: "签约" }, { id: "travel", label: "出行" }, { id: "renovation_start", label: "动工" }
];

export default function CoreMethodGrid({ today }: { today: string }) {
  const [active, setActive] = useState<Tool | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [otherBirthDate, setOtherBirthDate] = useState("");
  const [direction, setDirection] = useState<(typeof HOME_DIRECTIONS)[number] | null>(null);
  const [event, setEvent] = useState<DateSelectionEvent>("moving");
  const [range, setRange] = useState<7 | 30>(30);

  useEffect(() => {
    void refreshBirthDate();
  }, []);

  function refreshBirthDate() {
    return (
    fetch("/api/today-correspondence", { cache: "no-store" })
      .then(response => response.json())
      .then(body => setBirthDate(body?.data?.profile?.birthDate ?? null))
      .catch(() => setBirthDate(null))
    );
  }

  function toggleTool(tool: Tool) {
    const next = active === tool ? null : tool;
    setActive(next);
    if (next) void refreshBirthDate();
  }

  const pair = useMemo(() => birthDate && otherBirthDate
    ? buildPairStructure(birthDate, otherBirthDate)
    : null, [birthDate, otherBirthDate]);
  const dates = useMemo(() => birthDate ? selectCoreDates(birthDate, today, range, event) : [], [birthDate, event, range, today]);

  return (
    <section aria-labelledby="core-methods-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.22em] text-cinnabar">卦安的方法</div>
          <h2 id="core-methods-title" className="mt-1 font-serif text-xl">从你要看的事开始</h2>
        </div>
        <span className="text-[11px] text-ink/45">选择后在本页展开</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MethodButton active={active === "pair"} title="两人合参" subtitle="日柱 · 五行 · 合冲" onClick={() => toggleTool("pair")} />
        <MethodButton active={active === "home"} title="宅居方位" subtitle="八方 · 八卦 · 五行" onClick={() => toggleTool("home")} />
        <MethodButton active={active === "date"} title="近事择时" subtitle="事项 · 日期 · 生辰" onClick={() => toggleTool("date")} />
      </div>

      {active && (
        <div className="core-method-panel" role="region" aria-live="polite">
          {active === "pair" && <PairPanel birthDate={birthDate} otherBirthDate={otherBirthDate} setOtherBirthDate={setOtherBirthDate} pair={pair} />}
          {active === "home" && <HomePanel direction={direction} setDirection={setDirection} />}
          {active === "date" && <DatePanel birthDate={birthDate} event={event} setEvent={setEvent} range={range} setRange={setRange} dates={dates} />}
        </div>
      )}
    </section>
  );
}

function MethodButton({ active, title, subtitle, onClick }: { active: boolean; title: string; subtitle: string; onClick: () => void }) {
  return <button className={`core-method-button ${active ? "is-active" : ""}`} aria-expanded={active} onClick={onClick}>
    <span className="font-serif text-lg">{title}</span><span>{subtitle}</span>
  </button>;
}

function PairPanel({ birthDate, otherBirthDate, setOtherBirthDate, pair }: {
  birthDate: string | null; otherBirthDate: string; setOtherBirthDate: (value: string) => void;
  pair: ReturnType<typeof buildPairStructure> | null;
}) {
  if (!birthDate) return <MissingBirth />;
  return <div className="grid gap-4 sm:grid-cols-[14rem_1fr] sm:items-center">
    <label><span className="field-label">另一人的出生日期</span><input className="field-input" type="date" value={otherBirthDate} onChange={event => setOtherBirthDate(event.target.value)} /></label>
    {pair ? <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
      <StructurePill value={pair.first.pillar} sub={`五行属${pair.first.element}`} />
      <div className="rounded-full border border-gold/45 bg-rice px-3 py-2 text-xs"><b>{pair.stemRelation}</b><br /><span className="text-ink/45">日支 {pair.branchRelation}</span></div>
      <StructurePill value={pair.second.pillar} sub={`五行属${pair.second.element}`} />
    </div> : <p className="text-sm text-ink/55">选择日期后，直接合看双方日柱、五行生克与日支关系，不给匹配分数。</p>}
  </div>;
}

function HomePanel({ direction, setDirection }: { direction: (typeof HOME_DIRECTIONS)[number] | null; setDirection: (value: (typeof HOME_DIRECTIONS)[number]) => void }) {
  return <div>
    <div className="flex flex-wrap gap-2">{HOME_DIRECTIONS.map(item => <button key={item.direction} className={`method-chip ${direction?.direction === item.direction ? "is-active" : ""}`} onClick={() => setDirection(item)}>朝{item.direction}</button>)}</div>
    {direction ? <div className="mt-4 flex items-center gap-4 rounded-lg bg-rice/70 px-4 py-3">
      <TrigramLines binary={direction.binary} />
      <div><div className="font-serif text-xl">{direction.direction}方 · {direction.trigram}卦</div><div className="mt-1 text-xs text-ink/55">五行属{direction.element}。方位先定八卦属性，住宅判断还需结合大门与常用空间，不能只凭朝向下结论。</div></div>
    </div> : <p className="mt-3 text-sm text-ink/55">先点选住宅主要朝向，查看对应的后天八卦与五行位置。</p>}
  </div>;
}

function DatePanel({ birthDate, event, setEvent, range, setRange, dates }: {
  birthDate: string | null; event: DateSelectionEvent; setEvent: (value: DateSelectionEvent) => void;
  range: 7 | 30; setRange: (value: 7 | 30) => void; dates: CoreDateCandidate[];
}) {
  if (!birthDate) return <MissingBirth />;
  return <div>
    <div className="flex flex-wrap gap-2">{EVENTS.map(item => <button key={item.id} className={`method-chip ${event === item.id ? "is-active" : ""}`} onClick={() => setEvent(item.id)}>{item.label}</button>)}</div>
    <div className="mt-3 flex gap-2"><button className={`method-chip ${range === 7 ? "is-active" : ""}`} onClick={() => setRange(7)}>未来7天</button><button className={`method-chip ${range === 30 ? "is-active" : ""}`} onClick={() => setRange(30)}>未来30天</button></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-3">{dates.length ? dates.map(item => <div key={item.date} className="rounded-lg border border-mist bg-rice/70 px-3 py-3"><time className="font-serif text-base">{item.date.slice(5).replace("-", "月")}日</time><div className="mt-1 text-xs text-ink/55">{item.ganzhiDay} · {item.reason}</div></div>) : <p className="col-span-3 text-sm text-ink/55">当前范围内没有达到第一版筛选条件的日期，可以扩大到未来30天。</p>}</div>
    <p className="mt-3 text-[11px] text-ink/45">目前按日干生克、年支关系与事项规则筛选；民俗参考，不作为唯一决策依据。</p>
  </div>;
}

function MissingBirth() { return <p className="text-sm text-ink/55">先在上方保存生辰，卦安才能把这项方法与你关联；不需要描述具体困扰。</p>; }
function StructurePill({ value, sub }: { value: string; sub: string }) { return <div><div className="font-serif text-xl">{value}</div><div className="text-xs text-ink/45">{sub}</div></div>; }
function TrigramLines({ binary }: { binary: string }) { return <div className="flex w-12 flex-col-reverse gap-1" aria-hidden>{[...binary].map((line, index) => line === "1" ? <i key={index} className="h-1 bg-black" /> : <span key={index} className="flex justify-between"><i className="h-1 w-[42%] bg-black" /><i className="h-1 w-[42%] bg-black" /></span>)}</div>; }
