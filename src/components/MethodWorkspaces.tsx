"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziObservationCards, buildBaziWeeklyAction } from "@/lib/domain/baziObservations";
import { TEN_GOD_PLAIN_MEANING, buildBaziMainline, buildBaziStructure, explainBaziCharacter, hiddenLayerReading, type BaziCharacterKind } from "@/lib/domain/baziStructure";
import { buildBaziTimeLayers, type BaziTimeLayerId } from "@/lib/domain/baziTimeComparison";
import { HOME_DIRECTIONS, selectCoreDates, type CoreDateCandidate } from "@/lib/domain/coreMethods";
import {
  RELATIONSHIP_TYPES,
  buildPairInteractionFacts,
  buildRelationshipJointAction,
  buildRelationshipObservationCards,
  type RelationshipType
} from "@/lib/domain/relationshipInteractions";
import type { Element } from "@/lib/domain/elements";
import { DATE_EVENTS } from "@/lib/product/methodUi";
import type { DateSelectionEvent } from "@/lib/types";
import { BirthProfileForm } from "@/components/TodayCorrespondence";
import { profileGenderLabel } from "@/lib/profileGender";
import type { Gender } from "@/lib/types";

interface BirthProfile {
  gender: Gender;
  birthDate: string;
  birthTime: string | null;
  birthLocation: string | null;
  timezone: string;
  unknownTime: boolean;
}

interface BirthContext {
  profile: BirthProfile | null;
  correspondence: { date: string } | null;
}

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];
const ELEMENT_CLASS: Record<Element, string> = {
  木: "element-bar-wood",
  火: "element-bar-fire",
  土: "element-bar-earth",
  金: "element-bar-metal",
  水: "element-bar-water"
};
const ELEMENT_TONE_CLASS: Record<Element, string> = {
  木: "character-tone-wood",
  火: "character-tone-fire",
  土: "character-tone-earth",
  金: "character-tone-metal",
  水: "character-tone-water"
};

function useBirthContext() {
  const [context, setContext] = useState<BirthContext | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    fetch("/api/today-correspondence", { cache: "no-store" })
      .then(response => response.json())
      .then(body => active && setContext(body?.data ?? null))
      .catch(() => active && setContext(null));
    return () => { active = false; };
  }, []);
  return { context, setContext };
}

function useBirthProfile() {
  const { context } = useBirthContext();
  return context === undefined ? undefined : context?.profile ?? null;
}

function ProfileGate({ profile, onSaved }: { profile: BirthProfile | null | undefined; onSaved?: (context: BirthContext) => void }) {
  if (profile === undefined) return <div className="plate-loading" aria-label="正在读取生辰资料" />;
  if (profile) return null;
  if (onSaved) {
    return <div className="plate-profile-onboarding"><BirthProfileForm context="plate" onSaved={payload => onSaved(payload)} /></div>;
  }
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
  const { context, setContext } = useBirthContext();
  const profile = context === undefined ? undefined : context?.profile ?? null;
  const chart = useMemo(() => profile ? computeBazi({
    gender: profile.gender,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime ?? "",
    birthLocation: profile.birthLocation ?? undefined,
    timezone: profile.timezone,
    unknownTime: profile.unknownTime
  }) : null, [profile]);
  const structure = useMemo(() => chart ? buildBaziStructure(chart) : null, [chart]);
  const mainline = useMemo(() => chart ? buildBaziMainline(chart) : null, [chart]);
  const observationCards = useMemo(() => chart ? buildBaziObservationCards(chart) : [], [chart]);
  const weeklyAction = useMemo(() => buildBaziWeeklyAction(observationCards), [observationCards]);
  const timeLayers = useMemo(() => chart && context?.correspondence?.date
    ? buildBaziTimeLayers(chart, context.correspondence.date)
    : [], [chart, context?.correspondence?.date]);
  const [selectedCharacter, setSelectedCharacter] = useState<{ pillar: number; kind: BaziCharacterKind }>({ pillar: 2, kind: "stem" });
  const [layer, setLayer] = useState<"elements" | "month" | "hidden" | "roles">("elements");
  const [timeLayer, setTimeLayer] = useState<BaziTimeLayerId>("today");
  const [editingProfile, setEditingProfile] = useState(false);

  if (!profile || !chart || !structure || !mainline) return <ProfileGate profile={profile} onSaved={payload => setContext(payload)} />;
  const selectedStructure = structure.pillars[selectedCharacter.pillar];
  const characterExplanation = explainBaziCharacter(selectedStructure, chart.dayMaster, selectedCharacter.kind, structure);
  const activeTimeLayer = timeLayers.find(item => item.id === timeLayer) ?? timeLayers[0];
  const boundaryUncertainty = chart.calculation.uncertainty;

  return (
    <section className="plate-shell bazi-plate-shell">
      <div className="plate-main">
        <div className="plate-section-head">
          <div><span>你的八字盘</span><small>先对照具体生活情境，再查看盘面依据</small></div>
          <button type="button" className="plate-profile-summary" aria-expanded={editingProfile} onClick={() => setEditingProfile(value => !value)}>
            <span>已保存生辰</span><b>{profile.birthDate} · {profileGenderLabel(profile.gender)} · {profile.unknownTime ? "时间未定" : profile.birthTime}</b><em>{editingProfile ? "收起" : "修改"}</em>
          </button>
        </div>
        {editingProfile && <div className="plate-inline-profile-editor">
          <BirthProfileForm
            key={`${profile.gender}-${profile.birthDate}-${profile.birthTime}-${profile.birthLocation}-${profile.timezone}`}
            initial={profile}
            context="profile"
            onSaved={payload => { setContext(payload); setEditingProfile(false); }}
            onRemoved={() => { setContext({ profile: null, correspondence: null }); setEditingProfile(false); }}
          />
        </div>}

        {boundaryUncertainty && <div className="bazi-boundary-warning" role="status">
          <span>排盘事实尚不能唯一确定</span>
          <b>{[
            boundaryUncertainty.yearCandidates ? `年柱可能为 ${boundaryUncertainty.yearCandidates.map(item => item.pillarLabel).join(" 或 ")}` : "",
            boundaryUncertainty.monthCandidates ? `月柱可能为 ${boundaryUncertainty.monthCandidates.map(item => item.pillarLabel).join(" 或 ")}` : ""
          ].filter(Boolean).join("；")}</b>
          <p>出生当天发生交节。确认大致出生时段后才能确定；在此之前，依赖年柱或月柱的解释暂不展示。</p>
        </div>}

        <section className="bazi-observations" aria-labelledby="bazi-observations-title">
          <header className="bazi-observations-head">
            <div><span className="section-kicker">先看生活</span><h2 id="bazi-observations-title">这张生辰盘，建议你先观察三件事</h2></div>
            <small>条件式观察，不替你下固定结论</small>
          </header>
          <p className="bazi-observation-scope">{chart.hour
            ? "出生时辰已知，时柱作为补充参照；当前三张生活观察主要依据年月日结构。"
            : "出生时辰未知，本次观察未使用时柱。"}</p>
          <div className="bazi-observation-grid">
            {observationCards.map((card, index) => {
              const primaryEvidence = card.evidence.filter(item => item.role === "primary");
              const supportingEvidence = card.evidence.filter(item => item.role === "supporting");
              const statusLabel = card.confidence === "完整资料" ? "出生时辰已知" : card.confidence === "部分资料" ? "未含时柱" : "边界待确认";
              return <article key={card.id} className={`bazi-observation-card ${card.confidence === "暂不判断" ? "is-pending" : ""}`}>
              <header><span>{index + 1}</span><div><h3>{card.title}</h3><small>{statusLabel}</small></div></header>
              <p className="bazi-observation-conclusion">{card.conclusion}</p>
              {card.confidence !== "暂不判断" ? <div className="bazi-observation-points">
                <p><b>什么时候比较明显</b>{card.trigger}</p>
                <p><b>可能的优势</b>{card.strength}</p>
                <p><b>容易卡住的地方</b>{card.watchout}</p>
                <p className="is-action"><b>可以怎么做</b>{card.action}</p>
              </div> : <p className="bazi-observation-limitation">{card.limitation}</p>}
              {card.confidence !== "暂不判断" && <details className="bazi-observation-evidence">
                <summary>为什么这样说</summary>
                <section><h4>主要依据</h4><p>这部分确定本卡的主要观察方向。</p><ul>{primaryEvidence.map(item => <li key={`${item.source}-${item.fact}`}><b>{item.source}</b><span>{item.fact}</span><small>{item.explanation}</small></li>)}</ul></section>
                {supportingEvidence.length > 0 && <section><h4>辅助线索</h4><p>这部分提供另一项盘面参照；是否改变表层结论，以每条说明为准。</p><ul>{supportingEvidence.map(item => <li key={`${item.source}-${item.fact}`}><b>{item.source}</b><span>{item.fact}</span><small>{item.explanation}</small></li>)}</ul></section>}
                {card.limitation && <p>{card.limitation}</p>}
              </details>}
            </article>;})}
          </div>
        </section>

        {weeklyAction && <section className="bazi-weekly-action" aria-labelledby="bazi-weekly-action-title">
          <span>本周可以试试 · 来自“{weeklyAction.sourceTitle}”</span>
          <h2 id="bazi-weekly-action-title">先做一个 20 分钟内能开始的动作</h2>
          <p>{weeklyAction.action}</p>
        </section>}

        <div className="bazi-professional-head">
          <div><span className="section-kicker">第二层 · 专业依据</span><h2>查看我的专业命盘</h2></div>
          <small>四柱是事实底座；点一个字，再看它在盘中的位置</small>
        </div>
        <div className="bazi-chart-workbench">
          <div className="bazi-chart-core">
          <div className="pillar-grid">
          {structure.pillars.map((item, index) => {
            const candidates = index === 0 ? boundaryUncertainty?.yearCandidates : index === 1 ? boundaryUncertainty?.monthCandidates : undefined;
            return candidates ? <div key={item.name} className="pillar-card is-uncertain">
              <span>{item.name}</span><em>待确认</em>
              <strong className="pillar-candidates">{candidates.map(candidate => candidate.pillarLabel).join(" / ")}</strong>
              <small>需补充大致出生时段</small>
            </div> : (
            <div key={item.name} className={`pillar-card ${selectedCharacter.pillar === index ? "is-active" : ""}`}>
              <span>{item.name}</span>
              <em>{item.visibleStem?.role ?? "未定"}</em>
              <button
                type="button"
                className={`character-tone ${item.visibleStem ? ELEMENT_TONE_CLASS[item.visibleStem.element] : ""} ${selectedCharacter.pillar === index && selectedCharacter.kind === "stem" ? "is-character-active" : ""}`}
                disabled={!item.visibleStem}
                aria-label={item.visibleStem ? `查看${item.name}天干${item.visibleStem.stem}` : `${item.name}天干未定`}
                onClick={() => setSelectedCharacter({ pillar: index, kind: "stem" })}
              >{item.pillar?.stem ?? "—"}</button>
              <button
                type="button"
                className={`character-tone ${item.branch ? ELEMENT_TONE_CLASS[item.branch.element] : ""} ${selectedCharacter.pillar === index && selectedCharacter.kind === "branch" ? "is-character-active" : ""}`}
                disabled={!item.branch}
                aria-label={item.branch ? `查看${item.name}地支${item.branch.branch}` : `${item.name}地支未定`}
                onClick={() => setSelectedCharacter({ pillar: index, kind: "branch" })}
              >{item.pillar?.branch ?? "—"}</button>
              <small>{item.pillar ? `天干${item.pillar.stemElement} · 地支${item.pillar.branchElement}` : "出生时辰未计入"}</small>
            </div>
          );})}
        </div>

        <div className="day-master-anchor">
          <div><span className="section-kicker">全盘参照点</span><strong>{structure.dayMaster.stem}</strong></div>
          <p><b>{structure.dayMaster.yinYang}{structure.dayMaster.element}日主</b><span>它像你站在整张盘中央的位置；其他十神都要先与它比较，才有意义。</span></p>
        </div>
          </div>

          <aside className={`bazi-character-inspector character-tone ${characterExplanation ? ELEMENT_TONE_CLASS[characterExplanation.element] : ""}`}>
            <div className="bazi-inspector-mark character-tone">{characterExplanation?.character ?? "—"}</div>
            <div className="section-kicker">点字释义 · {selectedStructure.name}</div>
            <h2>{characterExplanation?.character} · {characterExplanation?.roleTitle}</h2>
            {characterExplanation && <div className="character-explanation">
              <section className="is-connection"><span>它映照你哪一面</span><b>{characterExplanation.connectionTitle}</b><p>{characterExplanation.connection}</p></section>
              <section className="is-plain"><span>传统意象 · 白话</span><b>{characterExplanation.character}字像什么</b><p>{characterExplanation.plainMeaning}</p></section>
              <section><span>专业名称保留</span><b>{characterExplanation.identity} · {characterExplanation.roleTitle}</b><p>{characterExplanation.role}</p></section>
            </div>}
          </aside>
        </div>

        {!boundaryUncertainty && <><div className="plate-tabs" aria-label="八字盘内容层级">
          {([
            ["elements", "五行"], ["month", "月令"], ["hidden", "藏干"], ["roles", "十神"]
          ] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={layer === id} onClick={() => setLayer(id)}>{label}</button>
          ))}
        </div>

        <div className="bazi-layer-panel">
          {layer === "elements" && (
            <>
              <div className="bazi-layer-title"><div><span className="section-kicker">第二层 · 五行</span><h3>已知明字的五行位置</h3></div><small>统计范围：已知四柱天干、地支；未含藏干</small></div>
              <div className="element-plain-summary">
                <div><span>相对偏多</span><b>{mainline.elementOverview.prominent.length ? mainline.elementOverview.prominent.join("、") : "没有明显偏多"}</b></div>
                <div><span>明字未见</span><b>{mainline.elementOverview.absentVisible.length ? mainline.elementOverview.absentVisible.join("、") : "五行均有出现"}</b></div>
                <p>{mainline.elementOverview.summary}</p>
              </div>
              <div className="layer-story"><span>生活观察</span><b>可以怎样核对这些五行意象</b><p>{mainline.elementOverview.interpretation}</p><small>本盘证据：明字五行数量 + 地支藏干；不以数量直接代替旺衰。若现实经历不符合，不把它当作性格结论。</small></div>
              <div className="element-structure-bar" aria-label="五行结构">
                {ELEMENTS.filter(element => chart.elementDistribution.counts[element] > 0).map(element => (
                  <i key={element} className={ELEMENT_CLASS[element]} style={{ width: `${chart.elementDistribution.ratios[element] * 100}%` }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {ELEMENTS.map(element => <div key={element} className="text-center"><b className="font-serif">{element}</b><div className="mt-1 text-xs text-ink/45">{chart.elementDistribution.counts[element]} 份</div></div>)}
              </div>
              <div className="element-source-grid">
                {structure.pillars.map(item => <div key={item.name}><b>{item.name}</b><span>{item.pillar ? `${item.pillar.stem}（天干·${item.pillar.stemElement}）　${item.pillar.branch}（地支·${item.pillar.branchElement}）` : "时辰未知，未计入"}</span></div>)}
              </div>
              <p className="bazi-method-note">五行只显示明字出现的位置与比例；少见或未出现不表示缺陷，也不直接对应现实结果。</p>
            </>
          )}
          {layer === "month" && (
            <div>
              <div className="bazi-layer-title"><div><span className="section-kicker">第二层 · 月令</span><h3>{structure.monthCommand.branch}月令 · 属{structure.monthCommand.element}</h3></div><small>出处：{structure.monthCommand.source}</small></div>
              <div className="month-command-card">
                <strong>{structure.monthCommand.branch}</strong>
                <div><b>日主来到怎样的季节</b><p>{mainline.monthReading.image}</p></div>
              </div>
              <div className="hidden-stem-line"><b>月令藏干</b>{structure.monthCommand.hiddenStems.map(hidden => <span key={hidden.stem}>{hidden.qiLevel}·{hidden.stem}{hidden.element}<small>{hidden.name}</small></span>)}</div>
              <div className="layer-story"><span>生活观察</span><b>月令意象可以怎样核对</b><p>{mainline.monthReading.interpretation}</p><small>本盘证据：{structure.monthCommand.branch}月令 · 本气{structure.monthCommand.hiddenStems[0]?.stem}{structure.monthCommand.hiddenStems[0]?.name}。这不是人格定论。</small></div>
              <p className="bazi-method-note">月柱以十二节的实际交接时刻切换，并按出生地法定时区 {chart.calculation.timezone} 换算。若出生时间未知且当天恰逢交节，月柱仍需在确认时刻后复核；当前不做经度真太阳时校正。</p>
            </div>
          )}
          {layer === "hidden" && (
            <div>
              <div className="bazi-layer-title"><div><span className="section-kicker">第三层 · 藏干</span><h3>逐支展开内部天干</h3></div><small>次序：本气 → 中气 → 余气</small></div>
              <div className="hidden-pillar-grid">
                {structure.pillars.map(item => (
                  <div key={item.name} className={!item.pillar ? "is-empty" : ""}>
                    <header><b>{item.name}地支</b><strong>{item.branch?.branch ?? "—"}</strong><small>{item.branch?.source ?? "时辰未知"}</small></header>
                    <ul>{item.hiddenStems.length ? item.hiddenStems.map(hidden => <li key={hidden.stem}><span>{hidden.qiLevel}</span><b>{hidden.stem}</b><small>{hidden.element} · {hidden.name}</small></li>) : <li><small>不自动补猜藏干</small></li>}</ul>
                    <p>{hiddenLayerReading(item)}</p>
                  </div>
                ))}
              </div>
              <p className="bazi-method-note">藏干采用固定地支藏干表；每个十神名称仍以日主{chart.dayMaster}为参照计算，不由地支五行直接代替。</p>
            </div>
          )}
          {layer === "roles" && (
            <div>
              <div className="bazi-layer-title"><div><span className="section-kicker">第三层 · 十神</span><h3>以日主{chart.dayMaster}为唯一参照</h3></div><small>规则：五行生克 + 阴阳同异</small></div>
              <div className="layer-story"><span>这张盘里的十神位置</span><b>{mainline.tenGodReading.headline}</b><p>{mainline.tenGodReading.interpretation}</p><small>这是通用的十神关系说明，不是本命盘独有的力量流动。以下逐柱列出明干与藏干的十神身份、五行生克和阴阳同异。</small></div>
              <div className="ten-god-groups">
                {structure.pillars.map(item => (
                  <section key={item.name} className={!item.pillar ? "is-empty" : ""}>
                    <h4>{item.name}<small>{item.pillar?.pillarLabel ?? "未定"}</small></h4>
                    {item.visibleStem ? <div className="ten-god-row"><span>天干 · {item.visibleStem.stem}</span><b>{item.visibleStem.role}</b><small><span>{TEN_GOD_PLAIN_MEANING[item.visibleStem.role]}</span><em>专业关系：{item.visibleStem.relation}</em></small></div> : <div className="ten-god-row"><small>时辰未知，不生成十神</small></div>}
                    {item.hiddenStems.map(hidden => <div className="ten-god-row is-hidden" key={hidden.stem}><span>{item.branch?.branch}藏{hidden.stem} · {hidden.qiLevel}</span><b>{hidden.name}</b><small><span>藏在地支，较像特定情境才打开的一面。{TEN_GOD_PLAIN_MEANING[hidden.name]}</span><em>专业关系：{hidden.relation} · {hidden.polarity}</em></small></div>)}
                  </section>
                ))}
              </div>
              <p className="bazi-method-note">十神在这里是天干相对日主的结构名称，不直接等同于职业、性格、亲属关系或现实结果。</p>
            </div>
          )}
        </div></>}

        {!boundaryUncertainty && activeTimeLayer && <div className="bazi-time-comparison">
          <div className="bazi-time-head">
            <div><span className="section-kicker">最后再看 · 时间对照</span><h3>今天、这个月和这一年，分别照到生活的哪一面</h3></div>
            <small>只比较结构，不判断吉凶</small>
          </div>
          <div className="bazi-time-tabs" aria-label="本命时间对照">
            {timeLayers.map(item => <button key={item.id} type="button" aria-pressed={timeLayer === item.id} onClick={() => setTimeLayer(item.id)}>
              <span>{item.label}</span><strong>{item.pillar.pillarLabel}</strong><small>{item.period}</small><em>{item.stemRole}</em>
            </button>)}
          </div>
          <div className="bazi-time-detail">
            <section><span>{activeTimeLayer.focusTitle}</span><b>{activeTimeLayer.pillar.stem} · {activeTimeLayer.stemRole}</b><p>{activeTimeLayer.lifeTheme}</p></section>
            <section><span>与本命怎样相遇</span><b>{activeTimeLayer.pillar.branch} · {activeTimeLayer.branchLinks.length ? `${activeTimeLayer.branchLinks.length}处相遇` : "暂未正面交会"}</b><p>{activeTimeLayer.branchTheme}</p></section>
            <section><span>专业名称保留</span><b>{activeTimeLayer.pillar.pillarLabel} · {activeTimeLayer.source}</b><p>{activeTimeLayer.professionalSummary}</p><details><summary>查看历法口径</summary><p>{activeTimeLayer.precision}</p></details></section>
          </div>
          <p className="bazi-time-footnote">时间层只提示某类主题较容易被看见；它不会改写本命盘，也不表示当天必定发生某件事。</p>
        </div>}
      </div>
    </section>
  );
}

export function RelationWorkspace() {
  const profile = useBirthProfile();
  const [otherDate, setOtherDate] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("partner");
  const firstChart = useMemo(() => profile ? computeBazi({
    gender: profile.gender,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime ?? "",
    birthLocation: profile.birthLocation ?? undefined,
    timezone: profile.timezone,
    unknownTime: profile.unknownTime
  }) : null, [profile]);
  const secondChart = useMemo(() => otherDate ? computeBazi({
    gender: "other",
    birthDate: otherDate,
    birthTime: "",
    timezone: "Asia/Shanghai",
    unknownTime: true
  }) : null, [otherDate]);
  const facts = useMemo(() => firstChart && secondChart ? buildPairInteractionFacts(firstChart, secondChart) : null, [firstChart, secondChart]);
  const cards = useMemo(() => buildRelationshipObservationCards(facts, relationshipType), [facts, relationshipType]);
  const jointAction = useMemo(() => buildRelationshipJointAction(cards), [cards]);
  if (!profile) return <ProfileGate profile={profile} />;

  return (
    <section className="plate-shell relation-plate">
      <div className="plate-main">
        <section className="relationship-setup" aria-labelledby="relationship-setup-title">
          <div className="relationship-setup-copy"><span className="section-kicker">起一张关系盘</span><h2 id="relationship-setup-title">两个人的结构怎样相遇</h2><p>选择你们的关系场景，再填写另一人的出生日期。这里不做评分，只观察日柱之间的双向作用。</p></div>
          <div className="relationship-setup-controls">
            <div><span>你们是什么关系</span><div className="relation-type-picker" aria-label="关系类型">{RELATIONSHIP_TYPES.map(item => <button key={item.id} type="button" aria-pressed={relationshipType === item.id} onClick={() => setRelationshipType(item.id)}>{item.label}</button>)}</div></div>
            <label className="relationship-date-field"><span>另一人的出生日期</span><input type="date" value={otherDate} onChange={event => setOtherDate(event.target.value)} /></label>
          </div>
        </section>

        {!facts ? <div className="plate-empty relation-empty">
          <span className="plate-seal" aria-hidden>合</span>
          <div><h2 className="font-serif text-xl">先填写另一人的出生日期</h2><p className="mt-1 text-sm leading-6 text-ink/55">有了双方日柱后，再展开连接、摩擦与协作三项观察；资料不足时不会补写结论。</p></div>
        </div> : <>
          <section className="relation-summary" aria-labelledby="relation-summary-title">
            <div><span className="section-kicker">{RELATIONSHIP_TYPES.find(item => item.id === relationshipType)?.label}关系 · 结构初见</span><h2 id="relation-summary-title" className="mt-2 font-serif text-2xl">先看你们怎样回应彼此</h2><p>这里不是两份个人性格并排，而是观察同一件事来到两个人之间时，双方可能先处理什么。</p><small>关系初见以双方日柱为观察入口，不代表完整合婚，也不判断关系结果；出生时辰不参与本次生活判断。</small></div>
            <div className="relation-input-summary"><span>你的资料</span><b>{profile.birthDate}</b><span>对方资料</span><b>{otherDate}</b></div>
          </section>

          <div className="relationship-card-grid">
            {cards.map((card, index) => <article className="relationship-card" key={card.id}>
              <header><span>0{index + 1}</span><div><small>关系观察</small><h2>{card.title}</h2></div></header>
              <p className="relationship-conclusion">{card.conclusion}</p>
              <dl>
                <div><dt>什么时候明显</dt><dd>{card.trigger}</dd></div>
                <div><dt>能带来什么</dt><dd>{card.strength}</dd></div>
                <div><dt>容易卡在哪里</dt><dd>{card.watchout}</dd></div>
                <div><dt>可以怎么做</dt><dd>{card.action}</dd></div>
              </dl>
              <details className="relationship-evidence"><summary>为什么这样说</summary>
                <div><b>主要依据</b>{card.evidence.filter(item => item.role === "primary").map(item => <p key={`${item.source}-${item.fact}`}><strong>{item.source}</strong>{item.fact}<small>{item.explanation}</small></p>)}</div>
                <div><b>辅助线索</b>{card.evidence.filter(item => item.role === "supporting").map(item => <p key={`${item.source}-${item.fact}`}><strong>{item.source}</strong>{item.fact}<small>{item.explanation}</small></p>)}</div>
                <p className="relationship-card-boundary"><strong>本卡边界</strong>{card.limitation}</p>
              </details>
            </article>)}
          </div>

          {jointAction && <section className="relationship-joint-action"><span className="section-kicker">来自“{cards.find(card => card.id === jointAction.sourceCardId)?.title}”</span><h2>{jointAction.title}</h2><p>{jointAction.action}</p><small>{jointAction.durationMinutes}分钟内 · {jointAction.doneWhen}</small></section>}

          <section className="relationship-professional" aria-labelledby="relationship-pillars-title">
            <span className="section-kicker">查看双方日柱</span><h2 id="relationship-pillars-title">日柱是本次关系观察的边界</h2>
            <div className="pair-axis">
              <PersonNode label="你" pillar={facts.first.pillar} element={facts.first.element} />
              <div className="pair-bridge"><i /><span>{facts.elementRelation.label}</span><small>{facts.branchRelations.map(item => item.label).join(" · ")}</small></div>
              <PersonNode label="对方" pillar={facts.second.pillar} element={facts.second.element} />
            </div>
          </section>

          <section className="relationship-facts"><span className="section-kicker">日干怎样双向作用</span><h2>同一对日干，要从两个方向分别看</h2><div className="relationship-fact-grid"><article><b>{facts.firstPerspective.perspective}</b><strong>{facts.firstPerspective.tenGod}</strong><p>{facts.firstPerspective.fact}</p></article><article><b>{facts.secondPerspective.perspective}</b><strong>{facts.secondPerspective.tenGod}</strong><p>{facts.secondPerspective.fact}</p></article><article><b>五行与阴阳</b><strong>{facts.elementRelation.label}</strong><p>{facts.elementRelation.fact}；{facts.polarityFact}。</p></article></div><p className="bazi-method-note">“你看对方”和“对方看你”，是把双方日干互相作为参照得到的结构观察，用来提示可能的互动顺序；它不代表双方在现实中固定承担某种角色，也不等于完整四柱合参。</p></section>

          <section className="relationship-facts"><span className="section-kicker">日支之间有什么关系</span><h2>名称保留，关系好坏不由它决定</h2><div className="relationship-branch-list">{facts.branchRelations.map(item => <article key={`${item.id}-${item.fact}`}><b>{item.label}</b><p>{item.fact}。{item.explanation}</p></article>)}</div><p className="bazi-method-note">同一对日支可能同时出现多种传统关系名称。它们表示不同观察角度，不自动互相抵消，也不共同生成吉凶结论。</p></section>

          <details className="relationship-method"><summary>查看本次方法与边界</summary><p>{facts.boundary}</p><p>六合、六冲、六害、六破与刑是传统结构名称，不等于现实事件，也不替代你们对真实沟通和处境的判断。</p></details>
        </>}
      </div>
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

function PersonNode({ label, pillar, element, muted }: { label: string; pillar: string; element?: Element; muted?: boolean }) {
  return <div className={`person-node ${muted ? "is-muted" : ""}`}><span>{label}</span><strong>{pillar}</strong><small>{element ? `日干属${element}` : "待填写"}</small></div>;
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
