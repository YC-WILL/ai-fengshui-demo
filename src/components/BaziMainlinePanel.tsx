import React from "react";
import type {
  BaziMainlineEvidence,
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

function SourceLabel({ item }: { item: BaziMainlineEvidence }) {
  return item.sourceKind === "traditional-catalog"
    ? <span>传统规则目录</span>
    : <span>项目计算实现</span>;
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

function EvidencePanel({ theme }: { theme: ReadyBaziAnalysisTheme }) {
  return (
    <details className="bazi-mainline-evidence">
      <summary>
        <span>为什么这样说</span>
        <small>事实依据 · 默认收起</small>
      </summary>
      <div className="bazi-mainline-evidence-list">
        {theme.evidence.map(item => (
          <article key={item.id}>
            <div>
              <b>{item.label}</b>
              <span>{item.displayValue}</span>
            </div>
            <small>{item.fact.sourcePosition} · {item.fact.certainty}</small>
          </article>
        ))}
      </div>
      <details className="bazi-mainline-technical">
        <summary>技术追溯</summary>
        <div>
          {theme.evidence.map(item => (
            <article key={item.id}>
              <header>
                <b>{item.id}</b>
                <SourceLabel item={item} />
              </header>
              <dl>
                <div><dt>计算口径</dt><dd>{item.fact.calculationConvention}</dd></div>
                <div><dt>确定性</dt><dd>{item.fact.certainty}</dd></div>
                <div><dt>规则版本</dt><dd>{item.fact.ruleVersion}</dd></div>
                <div><dt>规则ID</dt><dd><code>{item.fact.sourceRuleId}</code></dd></div>
              </dl>
            </article>
          ))}
        </div>
      </details>
    </details>
  );
}

function AnalysisTheme({
  theme,
  index
}: {
  theme: ReadyBaziAnalysisTheme;
  index: number;
}) {
  const titleId = `bazi-analysis-theme-${theme.id}`;

  return (
    <article className="bazi-analysis-theme" aria-labelledby={titleId}>
      <header className="bazi-analysis-theme-head">
        <span aria-hidden>{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3 id={titleId}>{theme.title}</h3>
          <small>{theme.scope}</small>
        </div>
      </header>

      <div className="bazi-mainline-professional">
        <small>专业分析</small>
        <h4>{theme.professionalAnalysis.title}</h4>
        <p>{theme.professionalAnalysis.text}</p>
        <ElementSummary theme={theme} />
        <TenGodSummary theme={theme} />
        <BranchRelationSummary theme={theme} />
      </div>

      <div className="bazi-mainline-disclosures">
        <details className="bazi-mainline-understand" open={index === 0}>
          <summary>
            <span>看懂这条</span>
            <small>{index === 0 ? "默认展开" : "按需展开"}</small>
          </summary>
          <div className="bazi-mainline-understand-body">
            <section className="is-imagery" aria-label="现代意象">
              <small>现代意象</small>
              <h4>{theme.imagery.title}</h4>
              <blockquote>{theme.imagery.text}</blockquote>
            </section>
            <section className="is-plain" aria-label="白话解读">
              <small>白话解读</small>
              <h4>{theme.plainReading.title}</h4>
              <p>{theme.plainReading.text}</p>
              {theme.plainReading.boundary && (
                <p className="bazi-mainline-boundary">{theme.plainReading.boundary}</p>
              )}
            </section>
          </div>
        </details>
        <EvidencePanel theme={theme} />
      </div>

      {theme.limitation && (
        <p className="bazi-mainline-note">{theme.limitation}</p>
      )}
    </article>
  );
}

export default function BaziMainlinePanel({
  narrative
}: {
  narrative: BaziMainlineNarrative;
}) {
  return (
    <section className="bazi-mainline bazi-foundation-analysis" aria-labelledby="bazi-mainline-title">
      <header className="bazi-mainline-head">
        <div>
          <span className="section-kicker">基础说明与边界</span>
          <h2 id="bazi-mainline-title">{narrative.title}</h2>
        </div>
        <small>事实可复核 · 解释有边界</small>
      </header>
      <p className="bazi-analysis-introduction">{narrative.introduction}</p>
      <section className="bazi-analysis-scan" aria-labelledby="bazi-analysis-scan-title">
        <header>
          <span id="bazi-analysis-scan-title">先看这几条</span>
          <small>{narrative.themes.length}项当前可读主题</small>
        </header>
        <ol>
          {narrative.themes.map(theme => (
            <li key={theme.id}>
              <b>{theme.title}</b>
              <p>{theme.scanSummary.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <div className="bazi-analysis-themes">
        {narrative.themes.map((theme, index) => (
          <AnalysisTheme key={theme.id} theme={theme} index={index} />
        ))}
      </div>
    </section>
  );
}
