import React from "react";
import type {
  BaziMainlineEvidence,
  BaziMainlineNarrative
} from "@/lib/domain/baziMainlineNarrative";

function SourceLabel({ item }: { item: BaziMainlineEvidence }) {
  return item.sourceKind === "traditional-catalog"
    ? <span>传统规则目录</span>
    : <span>项目计算实现</span>;
}

export default function BaziMainlinePanel({
  narrative
}: {
  narrative: BaziMainlineNarrative;
}) {
  if (narrative.status === "uncertain") {
    return (
      <section className="bazi-mainline is-uncertain" aria-labelledby="bazi-mainline-title">
        <header className="bazi-mainline-head">
          <div>
            <span className="section-kicker">八字分析</span>
            <h2 id="bazi-mainline-title">命盘解读</h2>
          </div>
          <small>只解释已确认事实</small>
        </header>
        <div className="bazi-mainline-uncertain" role="status">
          <h3>{narrative.title}</h3>
          {narrative.candidates.length > 0 && (
            <p>当前候选：{narrative.candidates.join(" 或 ")}</p>
          )}
          <p>{narrative.message}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bazi-mainline" aria-labelledby="bazi-mainline-title">
      <header className="bazi-mainline-head">
        <div>
          <span className="section-kicker">八字分析</span>
          <h2 id="bazi-mainline-title">命盘解读</h2>
        </div>
        <small>一条可复核的命盘主线</small>
      </header>

      <ol className="bazi-mainline-layers">
        <li className="bazi-mainline-answer is-professional">
          <span aria-hidden>01</span>
          <div>
            <small>专业分析</small>
            <h3>{narrative.professionalAnalysis.title}</h3>
            <p>{narrative.professionalAnalysis.text}</p>
          </div>
        </li>

        <li className="bazi-mainline-answer is-imagery">
          <span aria-hidden>02</span>
          <div>
            <small>形象解释</small>
            <h3>{narrative.imagery.title}</h3>
            <p className="bazi-mainline-disclaimer">{narrative.imagery.disclaimer}</p>
            <blockquote>{narrative.imagery.text}</blockquote>
          </div>
        </li>

        <li className="bazi-mainline-answer is-plain">
          <span aria-hidden>03</span>
          <div>
            <small>白话解读</small>
            <h3>{narrative.plainReading.title}</h3>
            <p>{narrative.plainReading.text}</p>
            <p className="bazi-mainline-boundary">{narrative.plainReading.boundary}</p>
          </div>
        </li>

        <li className="bazi-mainline-answer is-evidence">
          <span aria-hidden>04</span>
          <details className="bazi-mainline-evidence">
            <summary>
              <span>为什么这样说</span>
              <small>事实依据 · 默认收起</small>
            </summary>
            <div className="bazi-mainline-evidence-list">
              {narrative.evidence.map(item => (
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
                {narrative.evidence.map(item => (
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
        </li>
      </ol>

      {narrative.limitation && (
        <p className="bazi-mainline-note">{narrative.limitation}</p>
      )}
    </section>
  );
}
