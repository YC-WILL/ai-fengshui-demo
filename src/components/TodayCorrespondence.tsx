"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DailyCorrespondence } from "@/lib/domain/dailyCorrespondence";
import type { Element } from "@/lib/domain/elements";
import { BIRTH_TIMEZONE_OPTIONS, DEFAULT_BIRTH_TIMEZONE, defaultBirthTimezoneForLocation } from "@/lib/domain/birthTimezone";

interface ProfileValue {
  birthDate: string;
  birthTime: string | null;
  birthLocation: string | null;
  timezone: string;
  unknownTime: boolean;
}

interface SourceItem {
  code: string;
  title: string;
  summary?: string;
  detail?: string;
  explanation?: string;
  sourceTitle: string;
  sourceUrl: string;
}

interface Payload {
  profile: ProfileValue | null;
  correspondence: DailyCorrespondence | null;
  sources: SourceItem[];
}

const LOCATIONS = [
  "", "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江", "上海", "江苏", "浙江",
  "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川",
  "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆", "香港", "澳门", "台湾", "海外"
];

export default function TodayCorrespondence() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/today-correspondence", { cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok || !body.ok) throw new Error(body.error ?? "读取失败");
        if (active) setPayload(body.data);
      })
      .catch(reason => active && setError(reason instanceof Error ? reason.message : "读取失败"));
    return () => { active = false; };
  }, []);

  if (error) {
    return <section className="today-correspondence-shell p-6 text-sm text-cinnabar">{error}</section>;
  }
  if (!payload) {
    return <section className="today-correspondence-shell min-h-64 animate-pulse p-6" aria-label="正在读取今日相应" />;
  }
  if (!payload.profile || !payload.correspondence) {
    return <BirthProfileForm onSaved={setPayload} />;
  }
  return <CorrespondenceCard payload={payload} />;
}

export function BirthProfileForm({
  initial,
  onSaved,
  onRemoved,
  context = "onboarding"
}: {
  initial?: ProfileValue | null;
  onSaved?: (payload: Payload) => void;
  onRemoved?: () => void;
  context?: "onboarding" | "profile" | "plate";
}) {
  const initialDateParts = (initial?.birthDate ?? "").split("-");
  const [birthYear, setBirthYear] = useState(initialDateParts[0] ?? "");
  const [birthMonth, setBirthMonth] = useState(initialDateParts[1] ?? "");
  const [birthDay, setBirthDay] = useState(initialDateParts[2] ?? "");
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "");
  const [unknownTime, setUnknownTime] = useState(initial?.unknownTime ?? false);
  const [birthLocation, setBirthLocation] = useState(initial?.birthLocation ?? "");
  const [timezone, setTimezone] = useState(initial?.timezone ?? defaultBirthTimezoneForLocation(initial?.birthLocation));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const birthDate = birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : "";
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, index) => String(currentYear - index));
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
  const maximumDay = birthYear && birthMonth
    ? new Date(Number(birthYear), Number(birthMonth), 0).getDate()
    : 31;
  const days = Array.from({ length: maximumDay }, (_, index) => String(index + 1).padStart(2, "0"));

  function changeYear(value: string) {
    setBirthYear(value);
    clampDay(value, birthMonth);
  }

  function changeMonth(value: string) {
    setBirthMonth(value);
    clampDay(birthYear, value);
  }

  function clampDay(year: string, month: string) {
    if (!year || !month || !birthDay) return;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    if (Number(birthDay) > lastDay) setBirthDay(String(lastDay).padStart(2, "0"));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/today-correspondence", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthDate, birthTime: unknownTime ? null : birthTime, unknownTime, birthLocation: birthLocation || null, timezone })
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "保存失败");
      setMessage("生辰资料已保存");
      onSaved?.(body.data);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("只清除已保存的生辰资料？求签记录和账户信息会保留。")) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/today-correspondence", { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "清除失败");
      setBirthYear("");
      setBirthMonth("");
      setBirthDay("");
      setBirthTime("");
      setUnknownTime(false);
      setBirthLocation("");
      setTimezone(DEFAULT_BIRTH_TIMEZONE);
      setMessage("生辰资料已清除，其他记录未受影响");
      onRemoved?.();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "清除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="today-correspondence-shell overflow-hidden">
      <div className="border-b border-gold/25 px-6 py-5 md:px-8">
        <div className="text-xs tracking-[0.24em] text-cinnabar">{context === "plate" ? "四盘共用资料" : "今日相应"}</div>
        <h1 className="mt-2 font-serif text-3xl">{context === "profile" ? "我的生辰" : context === "plate" ? "保存一次，以后直接看盘" : "先定下你的生辰"}</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-ink/65">
          {context === "profile"
            ? "这里保存今日相应使用的出生资料。修改后，首页会按新的日主重新计算。"
            : context === "plate"
              ? "这份资料会保存到“我的”，八字盘、关系盘和择时盘共用。以后回来不需要重新填写，修改后各盘会按新资料重算。"
            : "以后每次回来，卦安会以你的日主为基点，对照当天干支与节气。这里只保存出生资料，不需要描述困扰。"}
        </p>
      </div>
      <div className="grid gap-5 px-6 py-6 md:grid-cols-2 md:px-8">
        <fieldset>
          <legend className="field-label">出生日期（公历）</legend>
          <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-2">
            <select className="field-input" aria-label="出生年份" value={birthYear} onChange={event => changeYear(event.target.value)}>
              <option value="">年</option>
              {years.map(year => <option key={year} value={year}>{year} 年</option>)}
            </select>
            <select className="field-input" aria-label="出生月份" value={birthMonth} onChange={event => changeMonth(event.target.value)}>
              <option value="">月</option>
              {months.map(month => <option key={month} value={month}>{Number(month)} 月</option>)}
            </select>
            <select className="field-input" aria-label="出生日期" value={birthDay} onChange={event => setBirthDay(event.target.value)}>
              <option value="">日</option>
              {days.map(day => <option key={day} value={day}>{Number(day)} 日</option>)}
            </select>
          </div>
        </fieldset>
        <div>
          <label className="field-label" htmlFor="correspondence-birth-time">出生时间</label>
          <div className="flex items-center gap-3">
            <input id="correspondence-birth-time" className="field-input" type="time" value={birthTime} disabled={unknownTime} onChange={event => setBirthTime(event.target.value)} />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-ink/65">
              <input type="checkbox" checked={unknownTime} onChange={event => setUnknownTime(event.target.checked)} />
              时间不确定
            </label>
          </div>
        </div>
        <label>
          <span className="field-label">出生地（省级即可）</span>
          <select className="field-input" value={birthLocation} onChange={event => {
            const location = event.target.value;
            setBirthLocation(location);
            setTimezone(defaultBirthTimezoneForLocation(location));
          }}>
            <option value="">暂不填写</option>
            {LOCATIONS.filter(Boolean).map(location => <option key={location} value={location}>{location}</option>)}
          </select>
        </label>
        <label>
          <span className="field-label">出生地当时采用的时区</span>
          <select className="field-input" value={timezone} onChange={event => setTimezone(event.target.value)}>
            {BIRTH_TIMEZONE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <span className="mt-1 block text-[11px] leading-5 text-ink/45">用于把立春和节气交接时刻换算到出生地；含历史夏令时。当前不做省级经度的真太阳时校正。</span>
        </label>
        <div className="rounded-lg border border-mist bg-rice/70 px-4 py-3 text-xs leading-5 text-ink/55 md:col-span-2">
          年柱按立春交接时刻、月柱按节气交接时刻切换。未确认出生时刻时，时柱显示为空，不会自动补猜。
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-mist px-6 py-5 md:px-8">
        <button className="btn-primary" disabled={busy || !birthDate || (!unknownTime && !birthTime)} onClick={save}>
          {busy ? "正在保存…" : context === "profile" ? "保存生辰资料" : context === "plate" ? "保存并查看本命盘" : "保存并看今日"}
        </button>
        {context === "profile" && initial && (
          <button className="btn-secondary border-cinnabar/30 text-cinnabar" disabled={busy} onClick={remove}>
            只清除生辰资料
          </button>
        )}
        {message && <span className="text-sm text-ink/60" role="status">{message}</span>}
      </div>
    </section>
  );
}

function CorrespondenceCard({ payload }: { payload: Payload }) {
  const data = payload.correspondence!;
  return (
    <section id="today-correspondence" className="today-correspondence-shell overflow-hidden scroll-mt-24">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gold/25 px-5 py-4 md:px-6">
        <div>
          <div className="text-xs tracking-[0.24em] text-cinnabar">今日相应</div>
          <h1 className="mt-1 font-serif text-xl">生辰为体，今日为用</h1>
        </div>
        <div className="text-right text-xs leading-5 text-ink/55">
          <div>{data.date} · {data.weekday}</div>
          <div>{data.solarTerm} · {data.monthBranch}月</div>
        </div>
      </header>

      <div className="px-5 py-5 md:px-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <CompactPillar label="你的日主" stem={data.birth.dayStem} element={data.birth.element} pillar={data.birth.dayPillar} />
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gold/35 bg-rice/70 px-3 py-3 text-center sm:flex-col sm:gap-0">
            <span className="font-serif text-xl">{data.phaseRelation.title}</span>
            <span className="text-xs font-medium">{data.phaseRelation.direction} · {data.tenGod.name}</span>
          </div>
          <CompactPillar label="今日天干" stem={data.today.dayStem} element={data.today.element} pillar={data.today.dayPillar} />
        </div>

        <p className="mt-3 text-center text-xs leading-5 text-ink/55">
          {data.phaseRelation.explanation}
          {data.branchRelation ? ` 日支另见“${data.branchRelation.name}”，只表示结构关系。` : ""}
        </p>

        <details className="mx-auto mt-3 max-w-2xl rounded-xl border border-mist bg-white/60 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-cinnabar">展开依据与算法</summary>
          <div className="mt-4 space-y-5 text-sm leading-6 text-ink/70">
            <div>
              <h2 className="font-serif text-base text-ink">怎么算出来</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {data.calculation.map(item => <li key={item}>{item}</li>)}
              </ol>
              <p className="mt-2 text-xs text-ink/45">{data.precisionNote}</p>
            </div>
            {payload.sources.length > 0 && (
              <div>
                <h2 className="font-serif text-base text-ink">知识依据</h2>
                <ul className="mt-2 space-y-3">
                  {payload.sources.map(source => (
                    <li key={`${source.code}-${source.title}`}>
                      <div className="font-medium text-ink/80">{source.title}</div>
                      <p className="text-xs leading-5 text-ink/55">{source.summary ?? source.explanation ?? source.detail}</p>
                      <a className="text-xs text-cinnabar hover:underline" href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceTitle} ↗</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-mist px-5 py-4 text-xs text-ink/50 md:px-8">
        <span>颜色只表示五行属性，不表示吉凶或结果。</span>
        <Link href="/me#birth-profile" className="text-cinnabar hover:underline">查看我的生辰 →</Link>
      </footer>
    </section>
  );
}

function CompactPillar({ label, stem, element, pillar }: { label: string; stem: string; element: Element; pillar: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-lg bg-white/45 px-3 py-2 sm:justify-start">
      <PhaseGlyph value={stem} element={element} />
      <div>
        <div className="text-xs text-ink/45">{label}</div>
        <div className="mt-0.5 font-serif text-base">{pillar}</div>
        <div className="text-[11px] text-ink/45">五行属{element}</div>
      </div>
    </div>
  );
}

function PhaseGlyph({ value, element }: { value: string; element: Element }) {
  const phaseClass: Record<Element, string> = {
    木: "phase-wood", 火: "phase-fire", 土: "phase-earth", 金: "phase-metal", 水: "phase-water"
  };
  return (
    <span
      className={`phase-glyph ${phaseClass[element]}`}
      aria-label={`${value}，五行属${element}`}
    >
      {value}
    </span>
  );
}
