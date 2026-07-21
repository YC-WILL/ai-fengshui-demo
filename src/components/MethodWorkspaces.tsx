"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeBazi, type Pillar } from "@/lib/domain/bazi";
import { buildPairStructure, HOME_DIRECTIONS, selectCoreDates, type CoreDateCandidate } from "@/lib/domain/coreMethods";
import type { Element } from "@/lib/domain/elements";
import { DATE_EVENTS, RELATION_DIMENSIONS } from "@/lib/product/methodUi";
import type { DateSelectionEvent } from "@/lib/types";

interface BirthProfile {
  birthDate: string;
  birthTime: string | null;
  birthLocation: string | null;
  unknownTime: boolean;
}

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];
const ELEMENT_CLASS: Record<Element, string> = {
  木: "element-bar-wood",
  火: "element-bar-fire",
  土: "element-bar-earth",
  金: "element-bar-metal",
  水: "element-bar-water"
};

function useBirthProfile() {
  const [profile, setProfile] = useState<BirthProfile | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    fetch("/api/today-correspondence", { cache: "no-store" })
      .then(response => response.json())
      .then(body => active && setProfile(body?.data?.profile ?? null))
      .catch(() => active && setProfile(null));
    return () => { active = false; };
  }, []);
  return profile;
}

function ProfileGate({ profile }: { profile: BirthProfile | null | undefined }) {
  if (profile === undefined) return <div className="plate-loading" aria-label="正在读取生辰资料" />;
  if (profile) return null;
  return (
    <div className="plate-empty">
      <span className="plate-seal" aria-hidden>生</span>
      <div>
        <h2 className="font-serif text-xl">先保存一份生辰</h2>
        <p className="mt-1 text-sm leading-6 text-ink/55">四盘共用这一份基础资料，不需要重复填写，也不需要描述具体困扰。</p>
      </div>
      <Link className="btn-primary" href="/me#birth-profile">去保存</Link>
    </div>
  );
}

export function BaziWorkspace() {
  const profile = useBirthProfile();
  const chart = useMemo(() => profile ? computeBazi({
    gender: "other",
    birthDate: profile.birthDate,
    birthTime: profile.birthTime ?? "",
    birthLocation: profile.birthLocation ?? undefined,
    unknownTime: profile.unknownTime
  }) : null, [profile]);
  const pillars = chart ? [chart.year, chart.month, chart.day, chart.hour] : [];
  const [selected, setSelected] = useState(2);
  const [layer, setLayer] = useState<"elements" | "month" | "hidden" | "roles">("elements");

  if (!chart) return <ProfileGate profile={profile} />;
  const selectedPillar = pillars[selected];

  return (
    <section className="plate-shell">
      <div className="plate-main">
        <div className="plate-section-head">
          <div><span>本命四柱</span><small>点击柱位查看它在盘中的位置</small></div>
          <span className="plate-status">已保存</span>
        </div>
        <div className="pillar-grid">
          {pillars.map((pillar, index) => (
            <button key={index} type="button" className={selected === index ? "is-active" : ""} onClick={() => setSelected(index)}>
              <span>{["年柱", "月柱", "日柱", "时柱"][index]}</span>
              <strong>{pillar?.stem ?? "—"}</strong>
              <strong>{pillar?.branch ?? "—"}</strong>
              <small>{pillar ? `${pillar.stemElement} · ${pillar.branchElement}` : "未计入"}</small>
            </button>
          ))}
        </div>

        <div className="plate-tabs" aria-label="八字盘内容层级">
          {([
            ["elements", "五行"], ["month", "月令"], ["hidden", "藏干"], ["roles", "十神"]
          ] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={layer === id} onClick={() => setLayer(id)}>{label}</button>
          ))}
        </div>

        <div className="bazi-layer-panel">
          {layer === "elements" && (
            <>
              <div className="element-structure-bar" aria-label="五行结构">
                {ELEMENTS.filter(element => chart.elementDistribution.counts[element] > 0).map(element => (
                  <i key={element} className={ELEMENT_CLASS[element]} style={{ width: `${chart.elementDistribution.ratios[element] * 100}%` }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {ELEMENTS.map(element => <div key={element} className="text-center"><b className="font-serif">{element}</b><div className="mt-1 text-xs text-ink/45">{chart.elementDistribution.counts[element]} 份</div></div>)}
              </div>
              <p className="mt-4 text-xs leading-6 text-ink/55">五行只显示盘中出现的位置与比例；少见或未出现不表示缺陷，也不直接对应现实结果。</p>
            </>
          )}
          {layer === "month" && <LayerCopy title={`${chart.month.pillarLabel}月柱`} copy="月柱用于标记出生月份所处的季节位置，是继续判断结构力量的重要入口。当前版本会明确展示算法口径，不把简化结果包装成精确结论。" />}
          {layer === "hidden" && <LayerCopy title="地支内部结构" copy="藏干会在后续层展开到每一个地支的内部天干，并保留来自年、月、日、时哪一柱的证据链。第一层不堆满术语。" />}
          {layer === "roles" && <LayerCopy title={`以${chart.dayMaster}为日主`} copy="十神是其他天干与日主之间的传统关系名称。这里会按位置查看，不把十神直接写成人格标签或现实断语。" />}
        </div>
      </div>

      <aside className="plate-aside">
        <div className="plate-aside-mark">{selectedPillar?.pillarLabel ?? "时柱未定"}</div>
        <div className="section-kicker">当前所见</div>
        <h2 className="mt-2 font-serif text-2xl">{["年柱", "月柱", "日柱", "时柱"][selected]}</h2>
        <p className="mt-3 text-sm leading-7 text-ink/60">
          {selectedPillar ? pillarDescription(selectedPillar, selected) : "出生时间未确认，所以这一柱保持空白，不自动补猜。"}
        </p>
        <div className="plate-evidence"><b>依据</b><span>{selectedPillar ? `${selectedPillar.stem}属${selectedPillar.stemElement}，${selectedPillar.branch}属${selectedPillar.branchElement}` : "未使用时柱"}</span></div>
        <div className="member-extension"><span>会员层</span><b>大运、流年与历年对照</b><small>增加时间跨度与比较，不改变本命盘基础结果。</small></div>
      </aside>
    </section>
  );
}

export function RelationWorkspace() {
  const profile = useBirthProfile();
  const [otherDate, setOtherDate] = useState("");
  const [dimension, setDimension] = useState<(typeof RELATION_DIMENSIONS)[number]["id"]>("communication");
  const pair = useMemo(() => profile && otherDate ? buildPairStructure(profile.birthDate, otherDate) : null, [otherDate, profile]);
  if (!profile) return <ProfileGate profile={profile} />;

  const detail = relationDetail(dimension, pair);
  return (
    <section className="plate-shell">
      <div className="plate-main">
        <div className="plate-section-head">
          <div><span>双人合参</span><small>只看结构，不给匹配分数</small></div>
          <label className="compact-field">另一人的出生日期<input type="date" value={otherDate} onChange={event => setOtherDate(event.target.value)} /></label>
        </div>

        <div className="pair-axis">
          <PersonNode label="你" pillar={pair?.first.pillar ?? "日柱"} element={pair?.first.element} />
          <div className="pair-bridge"><i /><span>{pair ? pair.stemRelation : "等待合参"}</span><small>{pair ? `日支 · ${pair.branchRelation}` : "选择日期后展开"}</small></div>
          <PersonNode label="对方" pillar={pair?.second.pillar ?? "日柱"} element={pair?.second.element} muted={!pair} />
        </div>

        <div className="relation-dimension-grid">
          {RELATION_DIMENSIONS.map(item => (
            <button key={item.id} type="button" aria-pressed={dimension === item.id} onClick={() => setDimension(item.id)}>
              <b>{item.label}</b><span>{item.basis}</span><i>→</i>
            </button>
          ))}
        </div>

        <div className="relation-detail">
          <div className="section-kicker">{detail.eyebrow}</div>
          <h2 className="mt-2 font-serif text-xl">{detail.title}</h2>
          <p className="mt-2 text-sm leading-7 text-ink/60">{detail.copy}</p>
          <div className="plate-evidence"><b>盘面依据</b><span>{detail.basis}</span></div>
        </div>
      </div>
      <aside className="plate-aside">
        <div className="section-kicker">保存关系</div>
        <h2 className="mt-2 font-serif text-2xl">从一次合参变成一份关系盘</h2>
        <p className="mt-3 text-sm leading-7 text-ink/60">保存后，可以在同一份关系里切换日期，观察结构如何随时间变化，不必重复填写双方资料。</p>
        <button type="button" className="btn-primary mt-5" disabled>保存入口 · 下一步接通</button>
        <div className="member-extension"><span>会员层</span><b>多关系与跨期比较</b><small>增加保存数量、时间跨度和并排比较。</small></div>
      </aside>
    </section>
  );
}

const ROOMS = [
  { direction: "东南", name: "书房" }, { direction: "南", name: "阳台" }, { direction: "西南", name: "未标记" },
  { direction: "东", name: "大门" }, { direction: "中心", name: "定位点" }, { direction: "西", name: "厨房" },
  { direction: "东北", name: "收纳" }, { direction: "北", name: "卧室" }, { direction: "西北", name: "客厅" }
] as const;

export function HomeWorkspace() {
  const [selected, setSelected] = useState("东");
  const selectedRoom = ROOMS.find(room => room.direction === selected)!;
  const direction = HOME_DIRECTIONS.find(item => item.direction === selected);
  return (
    <section className="plate-shell">
      <div className="plate-main">
        <div className="plate-section-head">
          <div><span>住宅方位</span><small>先校准朝向，再标记真实空间</small></div>
          <button type="button" className="btn-secondary" disabled>重新校准 · 下一步接通</button>
        </div>
        <div className="home-grid-wrap">
          <div className="home-direction-grid">
            {ROOMS.map(room => (
              <button key={room.direction} type="button" aria-pressed={selected === room.direction} onClick={() => setSelected(room.direction)}>
                <b>{room.direction}</b><span>{room.name}</span>
              </button>
            ))}
          </div>
          <div className="home-selected">
            <Trigram binary={direction?.binary ?? "111"} />
            <div className="section-kicker">当前方位</div>
            <h2 className="mt-2 font-serif text-3xl">{selectedRoom.direction}{direction ? ` · ${direction.trigram}卦` : ""}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/55">{direction ? `五行属${direction.element}。` : "住宅中心用于校准八方。"} 当前标记为“{selectedRoom.name}”。</p>
          </div>
        </div>
        <div className="reality-checks">
          <div><b>采光</b><span>上午 / 下午</span></div><div><b>通风</b><span>是否形成对流</span></div><div><b>噪音</b><span>来源与时段</span></div><div><b>动线</b><span>高频通行位置</span></div>
        </div>
      </div>
      <aside className="plate-aside">
        <div className="section-kicker">传统与现实并看</div>
        <h2 className="mt-2 font-serif text-2xl">这个位置先看什么</h2>
        <p className="mt-3 text-sm leading-7 text-ink/60">方位给出传统结构坐标；真正影响居住的采光、通风、潮湿、噪音和安全问题必须单独核对。</p>
        <div className="plate-evidence"><b>当前依据</b><span>{direction ? `${direction.direction}方对应后天八卦${direction.trigram}，五行属${direction.element}` : "住宅中心点"}</span></div>
        <div className="member-extension"><span>会员层</span><b>多套住宅与户型图层</b><small>增加户型保存、房间标记和前后变化记录。</small></div>
      </aside>
    </section>
  );
}

export function TimingWorkspace({ today }: { today: string }) {
  const profile = useBirthProfile();
  const [event, setEvent] = useState<DateSelectionEvent>("moving");
  const [range, setRange] = useState<7 | 30>(30);
  const candidates = useMemo(() => profile ? selectCoreDates(profile.birthDate, today, range, event) : [], [event, profile, range, today]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  useEffect(() => { setSelectedDate(candidates[0]?.date ?? null); }, [event, range, candidates]);
  if (!profile) return <ProfileGate profile={profile} />;
  const selected = candidates.find(item => item.date === selectedDate) ?? candidates[0];

  return (
    <section className="plate-shell">
      <div className="plate-main">
        <div className="plate-section-head">
          <div><span>先定事项</span><small>不同事项使用不同筛选与准备内容</small></div>
          <div className="plate-tabs compact"><button type="button" aria-pressed={range === 7} onClick={() => setRange(7)}>未来 7 天</button><button type="button" aria-pressed={range === 30} onClick={() => setRange(30)}>未来 30 天</button></div>
        </div>
        <div className="event-chips">{DATE_EVENTS.map(item => <button key={item.id} type="button" aria-pressed={event === item.id} onClick={() => setEvent(item.id)}>{item.label}</button>)}</div>
        <div className="candidate-list">
          {candidates.length ? candidates.map((candidate, index) => <CandidateDate key={candidate.date} value={candidate} index={index} active={selected?.date === candidate.date} onClick={() => setSelectedDate(candidate.date)} />) : <div className="plate-empty"><div><h2 className="font-serif text-xl">当前范围暂无候选</h2><p className="mt-1 text-sm text-ink/55">可以扩大时间范围，卦安不会为了凑数强行推荐日期。</p></div></div>}
        </div>
        {selected && <div className="timing-detail"><div><span className="section-kicker">候选依据</span><h2 className="mt-2 font-serif text-xl">{formatDate(selected.date)} · {selected.ganzhiDay}</h2><p className="mt-2 text-sm leading-7 text-ink/60">{selected.reason}。候选只表示当前规则下较适合继续核对，不表示事情结果。</p></div><PreparationList event={event} /></div>}
      </div>
      <aside className="plate-aside">
        <div className="section-kicker">本次择时</div>
        <h2 className="mt-2 font-serif text-2xl">{DATE_EVENTS.find(item => item.id === event)?.label}</h2>
        <p className="mt-3 text-sm leading-7 text-ink/60">免费层保留少量明确候选和必要准备，不用“凶日”制造焦虑，也不把现实条件藏在付费后。</p>
        <button type="button" className="btn-primary mt-5" disabled>保存入口 · 下一步接通</button>
        <div className="member-extension"><span>会员层</span><b>更多候选与多人合参</b><small>增加替代日期、完整比较和参与人资料复用。</small></div>
      </aside>
    </section>
  );
}

function LayerCopy({ title, copy }: { title: string; copy: string }) {
  return <div><h3 className="font-serif text-xl">{title}</h3><p className="mt-2 text-sm leading-7 text-ink/60">{copy}</p></div>;
}

function pillarDescription(pillar: Pillar, index: number) {
  const meaning = ["年柱是四柱结构的起点之一", "月柱标记出生月份与季节位置", "日柱中的天干作为日主", "时柱补充出生时段位置"][index];
  return `${pillar.pillarLabel}由天干${pillar.stem}与地支${pillar.branch}组成。${meaning}，点击其他柱位可以比较五行出现在哪里。`;
}

function PersonNode({ label, pillar, element, muted }: { label: string; pillar: string; element?: Element; muted?: boolean }) {
  return <div className={`person-node ${muted ? "is-muted" : ""}`}><span>{label}</span><strong>{pillar}</strong><small>{element ? `日干属${element}` : "待填写"}</small></div>;
}

function relationDetail(dimension: (typeof RELATION_DIMENSIONS)[number]["id"], pair: ReturnType<typeof buildPairStructure> | null) {
  if (!pair) return { eyebrow: "等待资料", title: "先选择另一人的出生日期", copy: "日期确定后，四个维度会使用同一份双人结构展开，不需要描述关系事件。", basis: "尚未起盘" };
  const map = {
    communication: { eyebrow: "沟通层", title: `双方日干形成“${pair.stemRelation}”`, copy: "这里先呈现表达与承接的作用方向；不会由一个结构名称直接推断谁更有问题。", basis: `${pair.first.pillar}与${pair.second.pillar}的日干五行关系` },
    cooperation: { eyebrow: "共同推进层", title: "查看力量从哪一方流向哪一方", copy: "相生、相克与同类是结构关系，后续会把它翻译成双方如何发起、承接与协商，而不是给相处好坏下结论。", basis: `日干关系：${pair.stemRelation}` },
    rhythm: { eyebrow: "日常节奏层", title: `双方日支显示“${pair.branchRelation}”`, copy: "日支关系用于标记日常节奏可能出现的相同、牵引或碰撞位置；真实相处仍需结合双方实际情况。", basis: `${pair.first.pillar.slice(1)}与${pair.second.pillar.slice(1)}的地支关系` },
    boundary: { eyebrow: "边界层", title: "只呈现盘面可以支持的范围", copy: "这一层会明确哪些内容来自日柱、哪些需要完整四柱，避免把未知信息写成确定事实。", basis: "当前仅使用双方出生日期的日柱" }
  };
  return map[dimension];
}

function Trigram({ binary }: { binary: string }) {
  return <div className="trigram-lines" aria-hidden>{[...binary].reverse().map((line, index) => line === "1" ? <i key={index} /> : <span key={index}><i /><i /></span>)}</div>;
}

function CandidateDate({ value, index, active, onClick }: { value: CoreDateCandidate; index: number; active: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick}><span>候选 {index + 1}</span><strong>{formatDate(value.date)}</strong><small>{value.ganzhiDay} · {value.reason}</small></button>;
}

function PreparationList({ event }: { event: DateSelectionEvent }) {
  const lists: Record<DateSelectionEvent, string[]> = {
    wedding: ["确认核心参与人时间", "核对场地与交通", "预留天气替代方案"],
    moving: ["确认物业与电梯", "先查水电燃气", "贵重物品单独打包"],
    opening: ["确认人员与物料", "检查证照与设备", "准备客流应对方案"],
    signing: ["复核主体和条款", "确认授权与附件", "保留修改后的终稿"],
    travel: ["核对证件与班次", "查看天气和交通", "留下紧急联系方式"],
    renovation_start: ["确认施工图与报价", "核对物业要求", "电路燃气请专业人员处理"]
  };
  return <div className="preparation-list"><b>现实准备</b><ol>{lists[event].map(item => <li key={item}>{item}</li>)}</ol></div>;
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
