"use client";

import React, { useState } from "react";
import {
  type ProfessionalBaziFact,
  type ProfessionalBaziFactsV1,
  type ProfessionalBaziPillarFacts
} from "@/lib/domain/professionalBaziFacts";
import {
  BRANCH_ELEMENT,
  STEM_ELEMENT,
  type Branch,
  type Element,
  type Stem
} from "@/lib/domain/elements";

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];
const TIME_LABELS = { today: "今日", month: "当月", year: "当前流年" } as const;

function elementClass(element: Element | null | undefined) {
  return element ? `professional-element professional-element-${{
    木: "wood",
    火: "fire",
    土: "earth",
    金: "metal",
    水: "water"
  }[element]}` : "";
}

function candidatesFor(facts: ProfessionalBaziFactsV1, position: string) {
  if (position === "年柱") return facts.uncertainty.yearPillarCandidates.value;
  if (position === "月柱") return facts.uncertainty.monthPillarCandidates.value;
  return [];
}

function CandidateCharacter({ value, kind }: { value: string; kind: "stem" | "branch" }) {
  const stem = value[0] as Stem;
  const branch = value[1] as Branch;
  return <span className="professional-candidate">
    {kind === "stem"
      ? <b className={elementClass(STEM_ELEMENT[stem])}>{stem}</b>
      : <b className={elementClass(BRANCH_ELEMENT[branch])}>{branch}</b>}
  </span>;
}

function UnavailableCell({ pillar }: { pillar: ProfessionalBaziPillarFacts }) {
  return <div className="professional-matrix-cell is-muted" role="cell">
    {pillar.ganzhi.certainty === "uncertain" ? "随出生时刻候选变化，暂不展开" : "出生时辰未知"}
  </div>;
}

function isFact(value: unknown): value is ProfessionalBaziFact<unknown> {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return "value" in item
    && typeof item.sourcePosition === "string"
    && typeof item.sourceRuleId === "string"
    && typeof item.ruleVersion === "string";
}

function traceFacts(value: unknown, output: ProfessionalBaziFact<unknown>[] = []) {
  if (isFact(value)) {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach(item => traceFacts(item, output));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(item => traceFacts(item, output));
  }
  return output;
}

function relationLabel(relation: ProfessionalBaziFactsV1["natalBranchRelations"][number]["value"]) {
  return `${relation.firstPillar}${relation.firstBranch} 与 ${relation.secondPillar}${relation.secondBranch} · ${relation.name}`;
}

export function nextExpandedHiddenPillar(current: string | null, selected: string) {
  return current === selected ? null : selected;
}

export default function ProfessionalBaziPanel({ facts }: { facts: ProfessionalBaziFactsV1 }) {
  const [expandedHiddenPillar, setExpandedHiddenPillar] = useState<string | null>(null);
  const allTraceFacts = traceFacts(facts);
  const catalogSources = [...new Set(allTraceFacts
    .filter(item => item.sourceRuleId.startsWith("catalog:"))
    .map(item => `${item.sourceRuleId} · ${item.ruleVersion}`))];
  const codeSources = [...new Set(allTraceFacts
    .filter(item => item.sourceRuleId.startsWith("code:"))
    .map(item => `${item.sourceRuleId} · ${item.ruleVersion}`))];
  const hasUncertainty = Boolean(facts.uncertainty.reason.value);
  const expandedPillar = facts.pillars.find(
    pillar => pillar.position.value === expandedHiddenPillar
      && pillar.hiddenStems.certainty === "confirmed"
  );

  return <div className="professional-bazi-v1">
    <header className="professional-bazi-intro">
      <div><span className="section-kicker">当前已核验字段</span><h2>专业细盘</h2></div>
      <p>只呈现可以复算的盘面事实；不含旺衰、喜忌、格局与吉凶判断。</p>
    </header>

    <section className="professional-origin" aria-labelledby="professional-origin-title">
      <header>
        <div><span>原局</span><h3 id="professional-origin-title">四柱事实矩阵</h3></div>
        <small>颜色只区分五行，不表示强弱或吉凶</small>
      </header>
      <div className="professional-matrix" role="table" aria-label="八字原局四柱">
        <div className="professional-matrix-row" role="row">
          <div className="professional-matrix-corner" role="columnheader">位置</div>
          {facts.pillars.map(pillar => <div key={pillar.position.value} className="professional-matrix-head" role="columnheader">
            <b>{pillar.position.value}</b>
            <small>{pillar.ganzhi.certainty === "confirmed" ? "已确认" : pillar.ganzhi.certainty === "uncertain" ? "有候选" : "未提供"}</small>
          </div>)}
        </div>

        <div className="professional-matrix-row" role="row">
          <div className="professional-matrix-label" role="rowheader">十神</div>
          {facts.pillars.map(pillar => pillar.visibleTenGod.certainty === "confirmed"
            ? <div key={pillar.position.value} className="professional-matrix-cell is-ten-god" role="cell">{pillar.visibleTenGod.value}</div>
            : <UnavailableCell key={pillar.position.value} pillar={pillar} />)}
        </div>

        <div className="professional-matrix-row" role="row">
          <div className="professional-matrix-label" role="rowheader">天干</div>
          {facts.pillars.map(pillar => {
            const candidates = candidatesFor(facts, pillar.position.value);
            if (candidates.length) return <div key={pillar.position.value} className="professional-matrix-cell is-candidates" role="cell">{candidates.map(value => <CandidateCharacter key={value} value={value} kind="stem" />)}</div>;
            return <div key={pillar.position.value} className={`professional-matrix-cell is-character ${elementClass(pillar.stemElement.value)}`} role="cell">{pillar.stem.value ?? "—"}</div>;
          })}
        </div>

        <div className="professional-matrix-row" role="row">
          <div className="professional-matrix-label" role="rowheader">地支</div>
          {facts.pillars.map(pillar => {
            const candidates = candidatesFor(facts, pillar.position.value);
            if (candidates.length) return <div key={pillar.position.value} className="professional-matrix-cell is-candidates" role="cell">{candidates.map(value => <CandidateCharacter key={value} value={value} kind="branch" />)}</div>;
            return <div key={pillar.position.value} className={`professional-matrix-cell is-character ${elementClass(pillar.branchElement.value)}`} role="cell">{pillar.branch.value ?? "—"}</div>;
          })}
        </div>

        <div className="professional-matrix-row" role="row">
          <div className="professional-matrix-label" role="rowheader">藏干</div>
          {facts.pillars.map(pillar => pillar.hiddenStems.certainty === "confirmed"
            ? <div
                key={pillar.position.value}
                role="cell"
                className={`professional-hidden-cell ${expandedHiddenPillar === pillar.position.value ? "is-active" : ""}`}
              >
                <button
                  type="button"
                  aria-label={`${expandedHiddenPillar === pillar.position.value ? "收起" : "展开"}${pillar.position.value}藏干详情：${pillar.hiddenStems.value.map(item => item.stem).join("、")}`}
                  aria-expanded={expandedHiddenPillar === pillar.position.value}
                  aria-controls="professional-hidden-detail"
                  onClick={() => setExpandedHiddenPillar(current => nextExpandedHiddenPillar(current, pillar.position.value))}
                >
                  <span>{pillar.hiddenStems.value.map(item => <b key={item.stem} className={elementClass(item.element)}>{item.stem}</b>)}</span>
                  <small>{expandedHiddenPillar === pillar.position.value ? "收起" : "展开"}</small>
                </button>
              </div>
            : <UnavailableCell key={pillar.position.value} pillar={pillar} />)}
        </div>
      </div>
      {expandedPillar && <section id="professional-hidden-detail" className="professional-hidden-detail" aria-live="polite">
        <header>
          <div><span>{expandedPillar.position.value}地支藏干</span><b>{expandedPillar.branch.value}中所藏天干</b></div>
          <button type="button" onClick={() => setExpandedHiddenPillar(null)}>收起</button>
        </header>
        <div>{expandedPillar.hiddenStems.value.map(item => <article key={item.stem}>
          <b className={elementClass(item.element)}>{item.stem}</b>
          <dl>
            <div><dt>五行</dt><dd>{item.element}</dd></div>
            <div><dt>气序</dt><dd>{item.qiLevel}</dd></div>
            <div><dt>十神</dt><dd>{item.tenGod}</dd></div>
            <div><dt>关系</dt><dd>{item.relation}</dd></div>
            <div><dt>阴阳</dt><dd>{item.polarity}</dd></div>
          </dl>
        </article>)}</div>
      </section>}
      {hasUncertainty && <p className="professional-inline-uncertainty" role="status">
        候选干支同等展示；受影响柱位的十神、五行、藏干等下级事实暂不推导。
      </p>}
    </section>

    <section className="professional-supplement" aria-labelledby="professional-supplement-title">
      <header><span>原局补充</span><h3 id="professional-supplement-title">参照点与结构关系</h3></header>
      <div className="professional-anchor-grid">
        <article><span>日主</span><b className={elementClass(facts.dayMaster.element.value)}>{facts.dayMaster.stem.value}</b><small>{facts.dayMaster.yinYang.value}{facts.dayMaster.element.value}</small></article>
        <article><span>月令</span>{facts.monthCommand.branch.certainty === "confirmed"
          ? <><b className={elementClass(facts.monthCommand.element.value)}>{facts.monthCommand.branch.value}</b><small>{facts.monthCommand.element.value} · 本气{facts.monthCommand.mainStem.value} · {facts.monthCommand.mainTenGod.value}</small></>
          : <><b>待确认</b><small>随月柱候选变化，暂不展开</small></>}</article>
      </div>
      <div className="professional-element-counts">
        <div><b>明字五行数量</b><small>只统计已确认的天干、地支，不含藏干</small></div>
        <ul>{ELEMENTS.map(element => <li key={element} className={elementClass(element)}><span>{element}</span><b>{facts.visibleElementCounts[element].value ?? "—"}</b></li>)}</ul>
        {Object.values(facts.visibleElementCounts).some(item => item.value === null) && <p>存在候选柱位，当前不输出可能误导的数量。</p>}
      </div>
      <div className="professional-relations">
        <div><b>本命地支关系</b><small>仅列合同中已有的关系子集</small></div>
        {facts.natalBranchRelations.length
          ? <ul>{facts.natalBranchRelations.map((item, index) => <li key={`${item.sourcePosition}-${index}`}>{relationLabel(item.value)}</li>)}</ul>
          : <p>已确认柱位之间未检出当前规则子集中的关系。</p>}
      </div>
    </section>

    <section className="professional-current-time" aria-labelledby="professional-current-time-title">
      <header>
        <div><span>现在进入的时间条件</span><h3 id="professional-current-time-title">当前时间事实</h3></div>
        <small>与原局分区，不视为本命组成</small>
      </header>
      <div className="professional-time-grid">{facts.timeFacts.map(item => {
        const stem = item.ganzhi.value[0] as Stem;
        const branch = item.ganzhi.value[1] as Branch;
        return <article key={item.id.value}>
          <span>{TIME_LABELS[item.id.value]}</span>
          <strong><b className={elementClass(STEM_ELEMENT[stem])}>{stem}</b><b className={elementClass(BRANCH_ELEMENT[branch])}>{branch}</b></strong>
          <small>{item.period.value}</small>
          <p>明干十神 · <b>{item.stemTenGod.value}</b></p>
          {item.natalBranchLinks.value.length
            ? <ul>{item.natalBranchLinks.value.map(link => <li key={`${link.position}-${link.relation}`}>{link.position}{link.natalBranch} · {link.relation}</li>)}</ul>
            : <em>{item.natalBranchLinks.certainty === "uncertain" ? "已排除不确定柱位，暂无其余关系" : "与本命未检出当前关系子集"}</em>}
        </article>;
      })}</div>
    </section>

    <details className="professional-source">
      <summary><span>计算口径与来源</span><small>默认收起</small></summary>
      <div className="professional-conventions">
        <p><b>换年</b><span>{facts.calculation.yearBoundary.value}</span></p>
        <p><b>换月</b><span>{facts.calculation.monthBoundary.value}</span></p>
        <p><b>换日</b><span>{facts.calculation.dayBoundary.value}</span></p>
        <p><b>真太阳时</b><span>{facts.calculation.trueSolarTimeApplied.value ? "已使用" : "未使用"}</span></p>
      </div>
      <div className="professional-source-kinds">
        <p><b>传统历法规则</b><span>用于说明采用了哪项历法口径，可回到项目传统历法目录复核。</span></p>
        <p><b>项目计算规则</b><span>用于说明本项目怎样计算和组织字段，不等同于传统出处。</span></p>
      </div>
      <p className="professional-source-status">{hasUncertainty ? `当前存在不确定项：${facts.uncertainty.reason.value}` : "当前合同字段没有交节候选项。"}</p>
      <details className="professional-technical-trace">
        <summary>技术追溯</summary>
        <section><b>传统目录 ID</b>{catalogSources.map(item => <code key={item}>{item}</code>)}</section>
        <section><b>项目实现 ID</b>{codeSources.map(item => <code key={item}>{item}</code>)}</section>
      </details>
    </details>
  </div>;
}
