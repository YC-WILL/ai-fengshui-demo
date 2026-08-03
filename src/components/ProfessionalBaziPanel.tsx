"use client";

import React from "react";
import {
  type BaziBirthMoonPhaseFactsV1,
  type MoonPhaseName
} from "@/lib/domain/baziBirthMoonPhaseFacts";
import type { BaziBirthSolarTermFactsV1 } from "@/lib/domain/baziBirthSolarTermFacts";
import type { BaziBirthXiuFactsV1 } from "@/lib/domain/baziBirthXiuFacts";
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
export const MOON_PHASE_LABELS: Record<MoonPhaseName, string> = {
  new_moon: "朔",
  waxing_crescent: "蛾眉月（盈）",
  first_quarter: "上弦",
  waxing_gibbous: "盈凸月",
  full_moon: "望",
  waning_gibbous: "亏凸月",
  last_quarter: "下弦",
  waning_crescent: "残月"
};

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
    {pillar.ganzhi.certainty === "uncertain" ? "候选柱位" : "时柱未提供"}
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

export function formatSolarTermMoment(value: string | null, timezone: string) {
  if (!value) return "—";
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset"
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? "";
  const offset = part("timeZoneName").replace("GMT", "UTC");
  return `${part("year")}年${part("month")}月${part("day")}日 ${part("hour")}:${part("minute")}:${part("second")}（${offset}）`;
}

function SolarTermFactsSection({ facts }: { facts: BaziBirthSolarTermFactsV1 }) {
  return <section className="professional-solar-term" aria-labelledby="professional-solar-term-title">
    <header>
      <div><span>出生历法</span><h3 id="professional-solar-term-title">出生节气事实</h3></div>
      <small>{facts.certainty === "confirmed" ? "已确认" : facts.certainty === "uncertain" ? "交节候选" : "无法计算"}</small>
    </header>
    <dl className="professional-solar-term-grid">
      <div><dt>出生时区</dt><dd>{facts.timezone}</dd></div>
      <div><dt>确定性</dt><dd>{facts.certainty === "confirmed" ? "已确认" : facts.certainty === "uncertain" ? "交节候选" : "无法计算"}</dd></div>
      {facts.certainty === "confirmed" && <>
        <div><dt>出生节气</dt><dd>{facts.currentTerm}</dd></div>
        <div><dt>{facts.currentTerm}交节</dt><dd>{formatSolarTermMoment(facts.currentTermStartedAt, facts.timezone)}</dd></div>
        <div><dt>下一节气</dt><dd>{facts.nextTerm}</dd></div>
        <div><dt>{facts.nextTerm}交节</dt><dd>{formatSolarTermMoment(facts.nextTermStartsAt, facts.timezone)}</dd></div>
      </>}
      {facts.certainty === "uncertain" && facts.candidates.map((candidate, index) => <div key={`${candidate.name}-${candidate.startedAt}`}>
        <dt>{index === 0 ? "交节前节气" : "交节后节气"}</dt>
        <dd><b>{candidate.name}</b><span>{formatSolarTermMoment(candidate.startedAt, facts.timezone)}</span></dd>
      </div>)}
      {facts.certainty === "unavailable" && <div><dt>原因</dt><dd>{facts.unavailableReason === "calculation_failed" ? "计算失败" : "—"}</dd></div>}
    </dl>
  </section>;
}

function moonPhaseLabel(phase: MoonPhaseName) {
  return MOON_PHASE_LABELS[phase];
}

function MoonPhaseFactsSection({ facts }: { facts: BaziBirthMoonPhaseFactsV1 }) {
  const certaintyLabel = facts.certainty === "confirmed"
    ? "已确认"
    : facts.certainty === "uncertain"
      ? "不确定"
      : "无法计算";

  return <section className="professional-moon-phase" aria-labelledby="professional-moon-phase-title">
    <header>
      <div><span>出生天文</span><h3 id="professional-moon-phase-title">出生月相事实</h3></div>
      <small>{certaintyLabel}</small>
    </header>
    <dl className="professional-moon-phase-grid">
      <div><dt>出生时区</dt><dd>{facts.birthTimezone}</dd></div>
      <div><dt>状态</dt><dd>{certaintyLabel}</dd></div>
      {facts.certainty === "confirmed" && <>
        <div><dt>月相分类</dt><dd><b>{moonPhaseLabel(facts.phase!)}</b><span>{facts.phase}</span></dd></div>
        <div><dt>日月黄经差</dt><dd>{facts.elongationDegrees!.toFixed(3)}°</dd></div>
        <div><dt>月龄</dt><dd>{facts.moonAgeDays!.toFixed(4)} 日</dd></div>
        <div><dt>上一次朔时</dt><dd>{formatSolarTermMoment(facts.previousNewMoonAtUtc, facts.birthTimezone)}</dd></div>
        <div><dt>下一次朔时</dt><dd>{formatSolarTermMoment(facts.nextNewMoonAtUtc, facts.birthTimezone)}</dd></div>
        <div><dt>本次朔望月长度</dt><dd>{facts.lunationLengthDays!.toFixed(4)} 日</dd></div>
      </>}
      {facts.certainty === "uncertain" && facts.candidates.map((candidate, index) => <div
        className="professional-moon-phase-candidate"
        key={candidate.sampledAtUtc}
      >
        <dt>{index === 0 ? "当地民用日期起点候选" : "当地民用日期终点候选"}</dt>
        <dd>
          <span>采样时刻 · {formatSolarTermMoment(candidate.sampledAtUtc, facts.birthTimezone)}</span>
          <span>日月黄经差 · {candidate.elongationDegrees.toFixed(3)}°</span>
          <span>月龄 · {candidate.moonAgeDays.toFixed(4)} 日</span>
          <span>月相 · {moonPhaseLabel(candidate.phase)}（{candidate.phase}）</span>
        </dd>
      </div>)}
      {facts.certainty === "unavailable" && <div><dt>计算失败原因</dt><dd>{facts.unavailableReason === "calculation_failed" ? "计算失败" : "—"}</dd></div>}
      <div><dt>算法版本</dt><dd><code>{facts.algorithmVersion}</code></dd></div>
      <div><dt>天文来源规则</dt><dd><code>{facts.astronomySourceRuleId}</code><span>{facts.calculationConvention}</span></dd></div>
      <div><dt>八相分类规则</dt><dd><code>{facts.classificationRuleId}</code><span>{facts.phaseClassificationConvention}</span></dd></div>
    </dl>
  </section>;
}

function XiuFactsSection({ facts }: { facts: BaziBirthXiuFactsV1 }) {
  const certaintyLabel = facts.certainty === "confirmed" ? "已确认" : "无法计算";

  return <section className="professional-xiu" aria-labelledby="professional-xiu-title">
    <header>
      <div><span>出生历法</span><h3 id="professional-xiu-title">出生日值二十八宿</h3></div>
      <small>{certaintyLabel}</small>
    </header>
    <dl className="professional-xiu-grid">
      <div><dt>出生时区</dt><dd>{facts.birthTimezone}</dd></div>
      <div><dt>出生地民用日期</dt><dd>{facts.birthCivilDate}</dd></div>
      <div><dt>状态</dt><dd>{certaintyLabel}</dd></div>
      <div><dt>出生时间</dt><dd>{facts.timeKnown ? "已提供" : "未提供；日值按民用日期确定"}</dd></div>
      {facts.certainty === "confirmed" && <>
        <div><dt>日值二十八宿</dt><dd><b>{facts.xiu}</b></dd></div>
        <div><dt>完整组合</dt><dd><b>{facts.xiu}{facts.zheng}{facts.animal}</b></dd></div>
        <div><dt>七政</dt><dd>{facts.zheng}</dd></div>
        <div><dt>动物</dt><dd>{facts.animal}</dd></div>
        <div><dt>四宫</dt><dd>{facts.gong}方</dd></div>
        <div><dt>四神兽</dt><dd>{facts.shou}</dd></div>
        <div><dt>出生日支</dt><dd>{facts.dayBranch}</dd></div>
        <div><dt>星期序号</dt><dd>{facts.weekdayIndex}（0 为星期日）</dd></div>
      </>}
      {facts.certainty === "unavailable" && <div><dt>计算失败原因</dt><dd>{facts.unavailableReason === "calculation_failed" ? "计算失败" : "—"}</dd></div>}
      <div><dt>换日边界</dt><dd>{facts.dayBoundary}</dd></div>
      <div><dt>算法版本</dt><dd><code>{facts.algorithmVersion}</code></dd></div>
      <div className="professional-xiu-convention"><dt>计算口径</dt><dd>按出生地民用日期的日支与星期序号查表</dd></div>
      <div className="professional-xiu-convention"><dt>来源规则</dt><dd><code>{facts.sourceRuleId}</code></dd></div>
    </dl>
  </section>;
}

export default function ProfessionalBaziPanel({
  facts,
  birthSolarTermFacts,
  birthMoonPhaseFacts,
  birthXiuFacts
}: {
  facts: ProfessionalBaziFactsV1;
  birthSolarTermFacts: BaziBirthSolarTermFactsV1;
  birthMoonPhaseFacts: BaziBirthMoonPhaseFactsV1;
  birthXiuFacts: BaziBirthXiuFactsV1;
}) {
  const allTraceFacts = traceFacts(facts);
  const catalogSources = [...new Set(allTraceFacts
    .filter(item => item.sourceRuleId.startsWith("catalog:"))
    .map(item => `${item.sourceRuleId} · ${item.ruleVersion}`))];
  const codeSources = [...new Set(allTraceFacts
    .filter(item => item.sourceRuleId.startsWith("code:"))
    .map(item => `${item.sourceRuleId} · ${item.ruleVersion}`))];
  const hasUncertainty = Boolean(facts.uncertainty.reason.value);

  return <div className="professional-bazi-v1">
    <header className="professional-bazi-intro">
      <div><span className="section-kicker">当前已核验字段</span><h2>专业细盘</h2></div>
      <p>展示可复算的盘面事实。旺衰、喜忌、格局与吉凶不在当前事实合同中。</p>
    </header>

    <section className="professional-origin" aria-labelledby="professional-origin-title">
      <header>
        <div><span>原局</span><h3 id="professional-origin-title">四柱事实矩阵</h3></div>
        <small>颜色用于区分五行，不表示强弱或吉凶</small>
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
                className="professional-hidden-cell"
              >
                <span>{pillar.hiddenStems.value.map(item => <b key={item.stem} className={elementClass(item.element)}>{item.stem}</b>)}</span>
              </div>
            : <UnavailableCell key={pillar.position.value} pillar={pillar} />)}
        </div>
      </div>
      <section className="professional-hidden-facts" aria-labelledby="professional-hidden-facts-title">
        <header>
          <span>地支所藏</span><h4 id="professional-hidden-facts-title">藏干事实</h4>
        </header>
        <div>{facts.pillars.filter(pillar => pillar.hiddenStems.certainty === "confirmed").map(pillar => <article key={pillar.position.value}>
          <h5>{pillar.position.value} · {pillar.branch.value}</h5>
          <div>{pillar.hiddenStems.value.map(item => <div className="professional-hidden-stem" key={item.stem}>
            <b className={elementClass(item.element)}>{item.stem}</b>
            <dl>
              <div><dt>五行</dt><dd>{item.element}</dd></div>
              <div><dt>气序</dt><dd>{item.qiLevel}</dd></div>
              <div><dt>十神</dt><dd>{item.tenGod}</dd></div>
              <div><dt>关系</dt><dd>{item.relation}</dd></div>
              <div><dt>阴阳</dt><dd>{item.polarity}</dd></div>
            </dl>
          </div>)}</div>
        </article>)}</div>
      </section>
      {hasUncertainty && <p className="professional-inline-uncertainty" role="status">
        候选干支同等展示；候选柱位的十神、五行与藏干未生成。
      </p>}
    </section>

    <section className="professional-supplement" aria-labelledby="professional-supplement-title">
      <header><span>原局补充</span><h3 id="professional-supplement-title">参照点与结构关系</h3></header>
      <div className="professional-anchor-grid">
        <article><span>日主</span><b className={elementClass(facts.dayMaster.element.value)}>{facts.dayMaster.stem.value}</b><small>{facts.dayMaster.yinYang.value}{facts.dayMaster.element.value}</small></article>
        <article><span>月令</span>{facts.monthCommand.branch.certainty === "confirmed"
          ? <><b className={elementClass(facts.monthCommand.element.value)}>{facts.monthCommand.branch.value}</b><small>{facts.monthCommand.element.value} · 本气{facts.monthCommand.mainStem.value} · {facts.monthCommand.mainTenGod.value}</small></>
          : <><b>有候选</b><small>{facts.uncertainty.monthPillarCandidates.value.join(" / ")}</small></>}</article>
      </div>
      <div className="professional-element-counts">
        <div><b>明字五行数量</b><small>统计已确认的天干、地支，不含藏干</small></div>
        <ul>{ELEMENTS.map(element => <li key={element} className={elementClass(element)}><span>{element}</span><b>{facts.visibleElementCounts[element].value ?? "—"}</b></li>)}</ul>
        {Object.values(facts.visibleElementCounts).some(item => item.value === null) && <p>候选柱位未计入明字五行数量。</p>}
      </div>
      <div className="professional-relations">
        <div><b>本命地支关系</b><small>当前事实合同已收录的关系</small></div>
        {facts.natalBranchRelations.length
          ? <ul>{facts.natalBranchRelations.map((item, index) => <li key={`${item.sourcePosition}-${index}`}>{relationLabel(item.value)}</li>)}</ul>
          : <p>已确认柱位之间未检出当前规则子集中的关系。</p>}
      </div>
    </section>

    <SolarTermFactsSection facts={birthSolarTermFacts} />

    <MoonPhaseFactsSection facts={birthMoonPhaseFacts} />

    <XiuFactsSection facts={birthXiuFacts} />

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

    <section className="professional-source" aria-labelledby="professional-source-title">
      <header><span>计算依据</span><h3 id="professional-source-title">计算口径与来源</h3></header>
      <div className="professional-conventions">
        <p><b>换年</b><span>{facts.calculation.yearBoundary.value}</span></p>
        <p><b>换月</b><span>{facts.calculation.monthBoundary.value}</span></p>
        <p><b>换日</b><span>{facts.calculation.dayBoundary.value}</span></p>
        <p><b>真太阳时</b><span>{facts.calculation.trueSolarTimeApplied.value ? "已使用" : "未使用"}</span></p>
        <p><b>出生节气</b><span>{birthSolarTermFacts.calculationConvention}</span></p>
        <p><b>节气算法版本</b><span>{birthSolarTermFacts.algorithmVersion}</span></p>
        <p><b>出生月相</b><span>{birthMoonPhaseFacts.calculationConvention}</span></p>
        <p><b>月相算法版本</b><span>{birthMoonPhaseFacts.algorithmVersion}</span></p>
        <p><b>出生日值二十八宿</b><span>按出生地民用日期的日支与星期序号查表</span></p>
        <p><b>日值二十八宿算法版本</b><span>{birthXiuFacts.algorithmVersion}</span></p>
      </div>
      <div className="professional-source-kinds">
        <p><b>传统历法规则</b><span>记录历法口径与传统目录来源。</span></p>
        <p><b>项目计算规则</b><span>记录字段的项目计算与组织来源。</span></p>
      </div>
      <p className="professional-source-status">原局确定性：{hasUncertainty ? facts.uncertainty.reason.value : "已确认"}</p>
    </section>

    <section className="professional-technical-trace" aria-labelledby="professional-technical-trace-title">
      <header><span>来源标识</span><h3 id="professional-technical-trace-title">技术追溯</h3></header>
      <div>
        <section><b>传统目录 ID</b>{catalogSources.map(item => <code key={item}>{item}</code>)}</section>
        <section><b>项目实现 ID</b>{codeSources.map(item => <code key={item}>{item}</code>)}</section>
        <section><b>出生节气来源规则</b><code>{birthSolarTermFacts.sourceRuleId}</code></section>
        <section><b>出生节气事实版本</b><code>{birthSolarTermFacts.schemaVersion}</code></section>
        <section><b>出生月相天文来源规则</b><code>{birthMoonPhaseFacts.astronomySourceRuleId}</code></section>
        <section><b>出生月相八相分类规则</b><code>{birthMoonPhaseFacts.classificationRuleId}</code></section>
        <section><b>出生月相事实版本</b><code>{birthMoonPhaseFacts.schemaVersion}</code></section>
        <section><b>出生日值二十八宿来源规则</b><code>{birthXiuFacts.sourceRuleId}</code></section>
        <section><b>出生日值二十八宿事实版本</b><code>{birthXiuFacts.schemaVersion}</code></section>
      </div>
    </section>
  </div>;
}
