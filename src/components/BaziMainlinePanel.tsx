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

function YinYangSummary({ theme }: { theme: ReadyBaziAnalysisTheme }) {
  if (!theme.yinYangSummary) return null;
  const { counts, ratios, coverageCount } = theme.yinYangSummary;

  return (
    <div className="bazi-yin-yang-summary" aria-label={`阴阳明字统计，共${coverageCount}个明字`}>
      {(["阳", "阴"] as const).map(yinYang => (
        <div key={yinYang}>
          <span><b>{yinYang}</b><small>{counts[yinYang]} 个 · {ratios[yinYang]}%</small></span>
          <i aria-hidden><em style={{ width: `${ratios[yinYang]}%` }} /></i>
        </div>
      ))}
    </div>
  );
}

function TenGodSummary({ theme }: { theme: ReadyBaziAnalysisTheme }) {
  if (!theme.tenGodPositions) return null;

  return (
    <div className="bazi-ten-god-summary" aria-label="按盘面柱位整理的十神">
      {theme.tenGodPositions.map(item => (
        <article key={item.position}>
          <header><b>{item.position}</b><span>{item.visible}</span></header>
          <small>藏干</small>
          <p>{item.hidden.join("、") || "无"}</p>
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
        </dl>
      </section>

      {foundation.dayMaster && (
        <section className="bazi-direct-section bazi-direct-day-master" aria-labelledby="bazi-direct-day-master-title">
          <h3 id="bazi-direct-day-master-title">日主</h3>
          <p>你的日主是{foundation.dayMaster.stem}，五行为{foundation.dayMaster.element}，阴阳属{foundation.dayMaster.yinYang}，也称{foundation.dayMaster.yinYang}{foundation.dayMaster.element}。</p>
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
      <div className="bazi-direct-narrative" aria-label="命盘物象正文">
        {entry.narrative.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}

function SolarTermNarrative({ narrative }: { narrative: BaziMainlineNarrative }) {
  if (narrative.solarTermNarrative.status !== "available") return null;

  return (
    <section className="bazi-direct-section bazi-direct-solar-term" aria-labelledby="bazi-direct-solar-term-title">
      <h3 id="bazi-direct-solar-term-title">节气</h3>
      <p>{narrative.solarTermNarrative.entry.narrative}</p>
    </section>
  );
}

function FactTheme({ theme }: { theme: ReadyBaziAnalysisTheme }) {
  const presentation = {
    "yin-yang": {
      title: "阴阳",
      description: "这里统计你的盘面天干和地支中的阴阳明字，不计藏干。"
    },
    "five-elements": {
      title: "五行",
      description: "五行数量来自你的盘面天干和地支明字，藏干中才出现的五行另行列出。"
    },
    "ten-gods-pillars": {
      title: "十神",
      description: "以日主为参照，按盘面柱位查看天干所见与地支所藏的十神。"
    },
    "natal-branch-relations": {
      title: "地支关系",
      description: "下面列出盘面柱位地支之间已经形成的关系，同一组地支可能同时出现多个名称。"
    }
  } as const;
  if (theme.id === "day-master-month-command") return null;
  const copy = presentation[theme.id];

  return (
    <section className="bazi-direct-section bazi-direct-fact-theme" aria-labelledby={`bazi-direct-${theme.id}`}>
      <h3 id={`bazi-direct-${theme.id}`}>{copy.title}</h3>
      <p className="bazi-direct-description">{copy.description}</p>
      <YinYangSummary theme={theme} />
      <ElementSummary theme={theme} />
      <TenGodSummary theme={theme} />
      <BranchRelationSummary theme={theme} />
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
      <div className="bazi-direct-sections">
        <Foundation narrative={narrative} />
        <DirectNarrative narrative={narrative} />
        <SolarTermNarrative narrative={narrative} />
        {narrative.themes.map(theme => (
          <FactTheme key={theme.id} theme={theme} />
        ))}
      </div>
    </section>
  );
}
