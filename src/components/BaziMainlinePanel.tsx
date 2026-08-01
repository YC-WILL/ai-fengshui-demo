import React from "react";
import type {
  BaziMainlineNarrative,
  ReadyBaziAnalysisTheme
} from "@/lib/domain/baziMainlineNarrative";
import type { Element } from "@/lib/domain/elements";

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];

function elementClass(element: Element) {
  return `professional-element professional-element-${{
    木: "wood",
    火: "fire",
    土: "earth",
    金: "metal",
    水: "water"
  }[element]}`;
}

function ElementSummary({ theme }: { theme: ReadyBaziAnalysisTheme }) {
  if (!theme.elementSummary) return null;
  const summary = theme.elementSummary;

  return (
    <div className="bazi-element-summary" aria-label={`明字五行统计，覆盖${summary.coverageCount}个位置`}>
      <div className="bazi-element-summary-head">
        <b>明字数量</b>
        <small>覆盖 {summary.coverageCount} 个已确认位置</small>
      </div>
      <ul>
        {ELEMENTS.map(element => (
          <li key={element} className={elementClass(element)}>
            <span>{element}</span>
            <b>{summary.counts[element]}</b>
            <i aria-hidden style={{ width: `${Math.min(100, summary.counts[element] * 18)}%` }} />
          </li>
        ))}
      </ul>
      <dl>
        <div><dt>明字出现</dt><dd>{summary.visibleElements.join("、") || "无"}</dd></div>
        <div><dt>仅藏干出现</dt><dd>{summary.hiddenOnlyElements.join("、") || "无"}</dd></div>
        <div><dt>当前未见</dt><dd>{summary.notSeenElements.join("、") || "无"}</dd></div>
      </dl>
    </div>
  );
}

function TenGodSummary({ theme }: { theme: ReadyBaziAnalysisTheme }) {
  if (!theme.tenGodPositions) return null;

  return (
    <div className="bazi-ten-god-summary" aria-label="按四柱位置整理的十神">
      {theme.tenGodPositions.map(item => (
        <article key={item.position}>
          <header><b>{item.position}</b><span>{item.visible}</span></header>
          <small>藏干</small>
          <p>{item.hidden.join("、") || "当前未见"}</p>
        </article>
      ))}
    </div>
  );
}

function BranchRelationSummary({ theme }: { theme: ReadyBaziAnalysisTheme }) {
  if (!theme.branchRelationPositions) return null;

  return (
    <div className="bazi-branch-relation-summary" aria-label="按柱位整理的本命地支关系">
      {theme.branchRelationPositions.map(item => (
        <article key={`${item.firstPillar}-${item.firstBranch}-${item.secondPillar}-${item.secondBranch}`}>
          <header>
            <span>{item.firstPillar}<b>{item.firstBranch}</b></span>
            <i aria-hidden>↔</i>
            <span>{item.secondPillar}<b>{item.secondBranch}</b></span>
          </header>
          <ul aria-label={`${item.firstPillar}${item.firstBranch}与${item.secondPillar}${item.secondBranch}的关系名称`}>
            {item.relations.map(relation => <li key={relation}>{relation}</li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}

function Foundation({ narrative }: { narrative: BaziMainlineNarrative }) {
  const { foundation } = narrative;
  if (!foundation.dayMaster && foundation.evidence.length === 0) return null;

  return (
    <>
      <section className="bazi-direct-section bazi-direct-foundation" aria-labelledby="bazi-direct-foundation-title">
        <h3 id="bazi-direct-foundation-title">基础信息</h3>
        <dl>
          {foundation.dayMaster && (
            <div>
              <dt>日主</dt>
              <dd>{foundation.dayMaster.stem}{foundation.dayMaster.element} · {foundation.dayMaster.yinYang}</dd>
            </div>
          )}
          {foundation.monthCommand && (
            <>
              <div>
                <dt>月令</dt>
                <dd>{foundation.monthCommand.branch}{foundation.monthCommand.element}</dd>
              </div>
              <div>
                <dt>本气</dt>
                <dd>{foundation.monthCommand.mainStem}{foundation.monthCommand.element} · {foundation.monthCommand.mainTenGod}</dd>
              </div>
            </>
          )}
          {!foundation.monthCommand && foundation.monthCandidates.length > 0 && (
            <div>
              <dt>月柱候选</dt>
              <dd>{foundation.monthCandidates.join(" 或 ")}</dd>
            </div>
          )}
        </dl>
        {foundation.limitation && <p className="bazi-mainline-note">{foundation.limitation}</p>}
      </section>

      {foundation.dayMaster && (
        <section className="bazi-direct-section bazi-direct-day-master" aria-labelledby="bazi-direct-day-master-title">
          <h3 id="bazi-direct-day-master-title">日主</h3>
          <p>你的日主是{foundation.dayMaster.stem}，五行为{foundation.dayMaster.element}，阴阳属{foundation.dayMaster.yinYang}，也称{foundation.dayMaster.yinYang}{foundation.dayMaster.element}。</p>
          <small className="bazi-direct-basis">
            盘面依据：日主{foundation.dayMaster.stem}{foundation.dayMaster.element} · {foundation.dayMaster.yinYang}
            {foundation.monthCommand
              ? `；月令${foundation.monthCommand.branch}${foundation.monthCommand.element} · 本气${foundation.monthCommand.mainStem} · ${foundation.monthCommand.mainTenGod}`
              : ""}
          </small>
        </section>
      )}
    </>
  );
}

function DirectNarrative({ narrative }: { narrative: BaziMainlineNarrative }) {
  if (narrative.directNarrative.status !== "available") return null;
  const { entry } = narrative.directNarrative;
  const foundation = narrative.foundation;
  if (!foundation.dayMaster || !foundation.monthCommand) return null;

  return (
    <section className="bazi-direct-section bazi-direct-imagery" aria-labelledby="bazi-direct-imagery-title">
      <h3 id="bazi-direct-imagery-title">物象</h3>
      <div className="bazi-direct-narrative" aria-label="蟾先森基于盘面的原创现代解读">
        {entry.narrative.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <small className="bazi-direct-basis">
        日主{foundation.dayMaster.stem}{foundation.dayMaster.element} · 月令{foundation.monthCommand.branch}{foundation.monthCommand.element} · 本气{foundation.monthCommand.mainStem}{foundation.monthCommand.element} · {foundation.monthCommand.mainTenGod}
      </small>
    </section>
  );
}

function FactTheme({ theme }: { theme: ReadyBaziAnalysisTheme }) {
  const presentation = {
    "five-elements": {
      title: "五行",
      description: "这里统计你当前已确认柱位中的天干、地支，并把藏干中的五行单列出来。",
      basis: "盘面依据：已确认柱位的天干、地支与藏干。"
    },
    "ten-gods-pillars": {
      title: "十神",
      description: "以下以你的日主为参照，按柱位列出明干与藏干形成的十神。",
      basis: "盘面依据：日主与各确认柱位的明干、藏干关系。"
    },
    "natal-branch-relations": {
      title: "地支关系",
      description: "以下只列出已确认柱位之间命中的登记关系；同一组柱位可以并列多个名称。",
      basis: "盘面依据：事实合同中已确认的本命地支关系与对应柱位。"
    }
  } as const;
  if (theme.id === "day-master-month-command") return null;
  const copy = presentation[theme.id];

  return (
    <section className="bazi-direct-section bazi-direct-fact-theme" aria-labelledby={`bazi-direct-${theme.id}`}>
      <h3 id={`bazi-direct-${theme.id}`}>{copy.title}</h3>
      <p className="bazi-direct-description">{copy.description}</p>
      <ElementSummary theme={theme} />
      <TenGodSummary theme={theme} />
      <BranchRelationSummary theme={theme} />
      <small className="bazi-direct-basis">{copy.basis}</small>
      {theme.boundary && (
        <p className="bazi-direct-boundary">{theme.boundary}</p>
      )}
      {theme.limitation && (
        <p className="bazi-mainline-note">{theme.limitation}</p>
      )}
    </section>
  );
}

export default function BaziMainlinePanel({
  narrative
}: {
  narrative: BaziMainlineNarrative;
}) {
  return (
    <section className="bazi-mainline bazi-direct-reading" aria-labelledby="bazi-mainline-title">
      <header className="bazi-mainline-head">
        <div>
          <span className="section-kicker">八字分析</span>
          <h2 id="bazi-mainline-title">{narrative.title}</h2>
        </div>
      </header>
      <p className="bazi-analysis-introduction">{narrative.introduction}</p>
      <div className="bazi-direct-sections">
        <Foundation narrative={narrative} />
        <DirectNarrative narrative={narrative} />
        {narrative.themes.map(theme => (
          <FactTheme key={theme.id} theme={theme} />
        ))}
      </div>
    </section>
  );
}
