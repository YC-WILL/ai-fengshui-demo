"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziObservationCards, buildBaziWeeklyAction } from "@/lib/domain/baziObservations";
import { TEN_GOD_PLAIN_MEANING, buildBaziMainline, buildBaziStructure, explainBaziCharacter, hiddenLayerReading, type BaziCharacterKind } from "@/lib/domain/baziStructure";
import { buildBaziTimeLayers, type BaziTimeLayerId } from "@/lib/domain/baziTimeComparison";
import { buildTimingSelection, type TimingCandidate } from "@/lib/domain/timingSelection";
import {
  HOME_AREA_DEFINITIONS,
  buildHomeSpaceAssessment,
  getHomeAreaStatus,
  getHomeIssueDefinition,
  type HomeAreaId,
  type HomeIssueId,
  type HomeSpaceInput
} from "@/lib/domain/homeSpaceObservations";
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
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    fetch("/api/today-correspondence", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Birth profile request failed");
        return response.json();
      })
      .then(body => {
        if (!active) return;
        setContext(body?.data ?? null);
        setError(false);
      })
      .catch(() => {
        if (!active) return;
        setContext(null);
        setError(true);
      });
    return () => { active = false; };
  }, [attempt]);
  return {
    context,
    setContext,
    error,
    retry: () => {
      setContext(undefined);
      setError(false);
      setAttempt(value => value + 1);
    }
  };
}

function ProfileGate({
  profile,
  error = false,
  onRetry,
  onSaved
}: {
  profile: BirthProfile | null | undefined;
  error?: boolean;
  onRetry?: () => void;
  onSaved: (context: BirthContext) => void;
}) {
  if (profile === undefined) return <div className="plate-loading" aria-label="正在读取生辰资料" />;
  if (profile) return null;
  if (error) {
    return (
      <div className="plate-empty" role="alert">
        <span className="plate-seal" aria-hidden>再</span>
        <div>
          <h2 className="font-serif text-xl">基础资料暂时没读到</h2>
          <p className="mt-1 text-sm leading-6 text-ink/55">可以重新读取；如果仍未恢复，也可以先返回四盘总览。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" type="button" onClick={onRetry}>重新读取</button>
          <Link className="btn-secondary" href="/#method-entry-title">返回四盘总览</Link>
        </div>
      </div>
    );
  }
  return <div className="plate-profile-onboarding"><BirthProfileForm context="plate" onSaved={payload => onSaved(payload)} /></div>;
}

export function BaziWorkspace() {
  const { context, setContext, error, retry } = useBirthContext();
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

  if (!profile || !chart || !structure || !mainline) {
    return <ProfileGate profile={profile} error={error} onRetry={retry} onSaved={payload => setContext(payload)} />;
  }
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
  const { context, setContext, error, retry } = useBirthContext();
  const profile = context === undefined ? undefined : context?.profile ?? null;
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
  if (!profile) {
    return <ProfileGate profile={profile} error={error} onRetry={retry} onSaved={payload => setContext(payload)} />;
  }

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

const ROOMS = HOME_AREA_DEFINITIONS;

export function HomeWorkspace() {
  const [input, setInput] = useState<HomeSpaceInput>({});
  const assessment = useMemo(() => buildHomeSpaceAssessment(input), [input]);
  const missingAreaLabels = assessment.missingAreas
    .map(areaId => ROOMS.find(area => area.id === areaId)?.label)
    .filter(Boolean)
    .join("、");
  const allAreasReviewed = assessment.missingAreas.length === 0;

  function scrollToHomeResult(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const target = document.getElementById("home-priority-result");
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
    target.focus({ preventScroll: true });
  }

  function toggleIssue(area: HomeAreaId, issueId: HomeIssueId) {
    setInput(current => {
      const selected = current[area]?.issues ?? [];
      const nextIssues = selected.includes(issueId)
        ? selected.filter(item => item !== issueId)
        : [...selected, issueId];
      if (nextIssues.length === 0) {
        const next = { ...current };
        delete next[area];
        return next;
      }
      return { ...current, [area]: { reviewed: true, issues: nextIssues } };
    });
  }

  function toggleNoIssue(area: HomeAreaId) {
    setInput(current => {
      if (current[area]?.reviewed && current[area]?.issues.length === 0) {
        const next = { ...current };
        delete next[area];
        return next;
      }
      return { ...current, [area]: { reviewed: true, issues: [] } };
    });
  }

  return (
    <section className="home-space-workspace">
      <section className="home-input-panel" aria-labelledby="home-input-title">
        <div className="home-space-section-head">
          <div>
            <span className="section-kicker">先只看真实空间</span>
            <h2 id="home-input-title">这三处现在是什么情况</h2>
            <p>只填写你确认过的情况，可以只填一处；没有填写的区域不会参与判断。</p>
          </div>
        </div>
        <div className="home-coverage-overview">
          <div className="home-coverage-count"><b>{assessment.reviewedAreas.length}</b><span>/ 3 处已填写</span></div>
          <div className={`home-live-summary is-${assessment.status}`} role="status" aria-live="polite" aria-atomic="true">
            {assessment.status === "insufficient" && <><span>当前结果</span><b>资料不足</b><small>确认一处后再判断</small></>}
            {assessment.status === "clear" && <>
              <span>当前结果</span>
              <b>{allAreasReviewed ? "三处已检查正常" : "已检查区域暂未见问题"}</b>
              <small>{allAreasReviewed ? "今天不需要额外调整" : `${missingAreaLabels}资料不足`}</small>
              <a href="#home-priority-result" onClick={scrollToHomeResult}>查看结果</a>
            </>}
            {assessment.priority && <>
              <span>{assessment.priority.priorityLabel}</span>
              <b>{assessment.priority.areaLabel} · {assessment.priority.issueLabel}</b>
              <a href="#home-priority-result" onClick={scrollToHomeResult}>查看处理建议</a>
            </>}
          </div>
        </div>
        <div className="home-area-grid">
          {ROOMS.map((area, index) => {
            const areaInput = input[area.id];
            const isReviewedClear = areaInput?.reviewed === true && areaInput.issues.length === 0;
            const areaStatus = getHomeAreaStatus(input, area.id);
            return <fieldset className="home-area-card" key={area.id}>
              <legend className="sr-only">{area.label}</legend>
              <header>
                <span>0{index + 1}</span>
                <div><h3>{area.label}</h3><p>{area.prompt}</p></div>
                <b className={`is-${areaStatus.state}`}>{areaStatus.label}</b>
              </header>
              <div className="home-issue-list">
                {area.issueIds.map(issueId => {
                  const issue = getHomeIssueDefinition(issueId)!;
                  return <label key={issueId}>
                    <input
                      type="checkbox"
                      checked={areaInput?.issues.includes(issueId) ?? false}
                      onChange={() => toggleIssue(area.id, issueId)}
                    />
                    <span>{issue.label}</span>
                  </label>;
                })}
              </div>
              <label className="home-no-issue">
                <input type="checkbox" checked={isReviewedClear} onChange={() => toggleNoIssue(area.id)} />
                <span>已检查，没有上述情况</span>
              </label>
            </fieldset>;
          })}
        </div>
      </section>

      <section
        id="home-priority-result"
        tabIndex={-1}
        className={`home-priority-result is-${assessment.status}${assessment.priority?.priority === 1 ? " is-safety" : ""}`}
      >
        <div className="home-priority-copy">
          <span className="section-kicker">当前最值得先处理</span>
          {assessment.status === "insufficient" && <>
            <h2>资料不足，暂不判断</h2>
            <p>至少确认一处区域后，这里才会根据你的实际填写选择优先项。</p>
          </>}
          {assessment.status === "clear" && <>
            <h2>{allAreasReviewed ? "三处均已检查，暂未见上述问题" : "已检查区域暂未见上述问题"}</h2>
            <p>{allAreasReviewed
              ? "三处都不需要为了得到结论而调整，今天可以保持现状。"
              : `${missingAreaLabels}尚未填写，不参与本次判断，也不会补写结论。`}</p>
          </>}
          {assessment.priority && <>
            <div className="home-priority-meta"><b>{assessment.priority.priorityLabel}</b><span>{assessment.priority.areaLabel}</span></div>
            <h2>{assessment.priority.title}</h2>
            <p>{assessment.priority.reason}</p>
            <div className="home-input-evidence"><b>来自你的填写</b><span>{assessment.priority.source}</span></div>
            {assessment.selectionNote && <p className="home-selection-note">{assessment.selectionNote}</p>}
          </>}
          <small>{assessment.coverageNote}</small>
        </div>
        <div className="home-action-card">
          <span className="section-kicker">今天可以完成</span>
          {assessment.action ? <>
            <h2>{assessment.action.durationMinutes}分钟内可以开始</h2>
            <p>{assessment.action.text}</p>
            <div><b>完成标准</b><span>{assessment.action.doneWhen}</span></div>
            {assessment.action.requiresProfessional && <small>这是安全状态：暂停相关使用，交由物业或合格专业人员处理，不自行拆改。</small>}
          </> : assessment.status === "clear" ? <>
            <h2>今天不需要额外调整</h2>
            <p>{allAreasReviewed
              ? "三处均已检查，保留现在的使用方式即可。"
              : `已检查区域可以保持现状；${missingAreaLabels}继续保留为资料不足。`}</p>
          </> : <>
            <h2>先完成一处填写</h2>
            <p>从你每天最常经过或使用的一处开始，确认是否存在上面的具体情况。</p>
          </>}
        </div>
      </section>

      <section className="home-professional-placeholder" aria-labelledby="home-professional-title">
        <div><span className="section-kicker">专业结构区</span><h2 id="home-professional-title">门、主、灶与方位观察将在后续阶段展开</h2></div>
        <p>今天的优先判断只来自你填写的现实空间情况，暂不展开方位判断、住宅评分或物品建议。</p>
      </section>
    </section>
  );
}

export function TimingWorkspace({ today }: { today: string }) {
  const { context, setContext, error, retry } = useBirthContext();
  const profile = context === undefined ? undefined : context?.profile ?? null;
  const [event, setEvent] = useState<DateSelectionEvent>("moving");
  const [range, setRange] = useState<7 | 30>(30);
  const selection = useMemo(() => profile ? buildTimingSelection({
    event,
    startDate: today,
    rangeDays: range,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthLocation: profile.birthLocation,
    timezone: profile.timezone,
    unknownTime: profile.unknownTime
  }) : null, [event, profile, range, today]);
  const candidates = selection?.candidates ?? [];
  const firstCandidateDate = candidates[0]?.date ?? null;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  useEffect(() => {
    setSelectedDate(firstCandidateDate);
  }, [event, range, firstCandidateDate]);
  if (!profile) {
    return <ProfileGate profile={profile} error={error} onRetry={retry} onSaved={payload => setContext(payload)} />;
  }
  const selected = candidates.find(item => item.date === selectedDate) ?? candidates[0];

  return (
    <section className="timing-workspace">
      <section className="timing-controls" aria-labelledby="timing-input-title">
        <div className="timing-section-head">
          <span className="section-kicker">01 · 选择事项与范围</span>
          <h2 id="timing-input-title">先确定这次要安排什么</h2>
          <p>候选会使用已保存出生日期作有限参照；不同事项采用各自公开的筛选条件。</p>
        </div>
        <div className="timing-input-grid">
          <div>
            <b>事项类型</b>
            <div className="event-chips" aria-label="事项类型">{DATE_EVENTS.map(item => <button key={item.id} type="button" aria-pressed={event === item.id} onClick={() => setEvent(item.id)}>{item.label}</button>)}</div>
          </div>
          <div>
            <b>时间范围</b>
            <div className="plate-tabs compact" aria-label="时间范围">
              <button type="button" aria-pressed={range === 7} onClick={() => setRange(7)}>未来 7 天</button>
              <button type="button" aria-pressed={range === 30} onClick={() => setRange(30)}>未来 30 天</button>
            </div>
          </div>
        </div>
        <p className="timing-profile-scope">{selection?.profileScope}</p>
      </section>

      <section className="timing-candidates" aria-labelledby="timing-candidates-title">
        <div className="timing-section-head">
          <span className="section-kicker">02 · 少量候选</span>
          <h2 id="timing-candidates-title">{selection?.eventLabel} · {range}天内找到{candidates.length}个候选</h2>
          <p>{selection ? `${formatDate(selection.startDate)}至${formatDate(selection.endDate)}` : ""}，最多展示3天，不为凑数降低规则。</p>
        </div>
        {candidates.length ? <div className="timing-candidate-grid">
          {candidates.map((candidate, index) => (
            <TimingCandidateCard
              key={candidate.date}
              value={candidate}
              index={index}
              active={selected?.date === candidate.date}
              onClick={() => setSelectedDate(candidate.date)}
            />
          ))}
        </div> : <div className="timing-empty" role="status">
          <h2>{selection?.status === "insufficient" ? "资料不足，暂不生成候选" : "当前范围暂无候选"}</h2>
          <p>{selection?.status === "insufficient"
            ? selection.insufficientReason
            : "现有事项规则与排除条件下没有可继续核对的日期，蟾先森不会为了凑够3天降低规则。"}</p>
          {selection?.status === "ready" && range === 7 && <button type="button" className="btn-secondary" onClick={() => setRange(30)}>改看未来30天</button>}
        </div>}
      </section>

      {candidates.length > 0 && <section className="timing-comparison" aria-labelledby="timing-comparison-title">
        <div className="timing-section-head">
          <span className="section-kicker">03 · 快速比较</span>
          <h2 id="timing-comparison-title">先看三天真正不同在哪里</h2>
          <p>只比较时间距离、事项规则、现实准备和当前限制，页面不设置日期评分。</p>
        </div>
        <div className="timing-comparison-list">
          {candidates.map(candidate => <article key={candidate.date} className={selected?.date === candidate.date ? "is-selected" : ""}>
            <header><b>{formatDate(candidate.date)}</b><span>{candidate.weekday} · {candidate.distanceLabel}</span></header>
            <dl>
              <div><dt>事项对应</dt><dd>{candidate.arrangementFit}</dd></div>
              <div><dt>提前准备</dt><dd>{candidate.confirmBefore}</dd></div>
              <div><dt>当前限制</dt><dd>{candidate.limitation}</dd></div>
            </dl>
          </article>)}
        </div>
      </section>}

      {selected && selection && <section className="timing-selected-detail" aria-labelledby="timing-selected-title">
        <div className="timing-selected-copy">
          <span className="section-kicker">04 · 选中日期</span>
          <h2 id="timing-selected-title">{formatDate(selected.date)} · {selected.weekday}</h2>
          <p>{selected.whyCandidate}</p>
          <div className="timing-confirmation"><b>现实中仍需确认</b><span>{selected.confirmBefore}</span></div>
        </div>
        <div className="timing-action">
          <span className="section-kicker">事前准备动作</span>
          <h2>{selected.action.durationMinutes}分钟内可以开始</h2>
          <p>{selected.action.text}</p>
          <div><b>完成标准</b><span>{selected.action.doneWhen}</span></div>
        </div>
        <details className="timing-evidence">
          <summary>展开专业历法依据与方法边界</summary>
          <div>
            {selected.evidence.map(item => <article key={item.id}>
              <b>{item.fact}</b>
              <span>{item.source}</span>
              <p>{item.explanation}</p>
            </article>)}
            <p className="timing-boundary">{selection.boundary}</p>
          </div>
        </details>
      </section>}
    </section>
  );
}

function PersonNode({ label, pillar, element, muted }: { label: string; pillar: string; element?: Element; muted?: boolean }) {
  return <div className={`person-node ${muted ? "is-muted" : ""}`}><span>{label}</span><strong>{pillar}</strong><small>{element ? `日干属${element}` : "待填写"}</small></div>;
}

function TimingCandidateCard({ value, index, active, onClick }: { value: TimingCandidate; index: number; active: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick}>
    <span>候选 {index + 1}</span>
    <strong>{formatDate(value.date)}</strong>
    <small>{value.weekday} · {value.distanceLabel} · {value.ganzhiDay}</small>
    <p>{value.whyCandidate}</p>
    <dl>
      <div><dt>更方便安排</dt><dd>{value.arrangementFit}</dd></div>
      <div><dt>提前确认</dt><dd>{value.confirmBefore}</dd></div>
    </dl>
  </button>;
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
