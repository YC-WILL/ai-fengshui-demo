import React from "react";
import type {
  RelationshipMainlineFoundation as RelationshipMainlineFoundationModel,
  RelationshipBirthXiuFacts,
  RelationshipDirectionalTenGodFacts,
  RelationshipFiveElementFacts,
  RelationshipMainlineImagery,
  RelationshipZodiacFacts,
  RelationshipYinYangFacts
} from "@/lib/domain/relationshipMainlineFoundation";
import type { Element } from "@/lib/domain/elements";
import type { RelationshipDayBranchNarrativeSelection } from "@/lib/domain/relationshipDayBranchNarratives";

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];

interface FoundationField {
  id: "day-master" | "month-command" | "main-qi";
  label: "日主" | "月令" | "本气";
  value: "dayMaster" | "monthCommand" | "mainQi";
}

const FOUNDATION_FIELDS: FoundationField[] = [
  { id: "day-master", label: "日主", value: "dayMaster" },
  { id: "month-command", label: "月令", value: "monthCommand" },
  { id: "main-qi", label: "本气", value: "mainQi" }
];

export default function RelationshipMainlineFoundation({
  foundation,
  zodiac,
  imagery,
  yinYang,
  birthXiu,
  fiveElements,
  directionalTenGods,
  dayBranchRelations
}: {
  foundation: RelationshipMainlineFoundationModel;
  zodiac?: RelationshipZodiacFacts;
  imagery?: RelationshipMainlineImagery;
  yinYang?: RelationshipYinYangFacts;
  birthXiu?: RelationshipBirthXiuFacts;
  fiveElements?: RelationshipFiveElementFacts;
  directionalTenGods?: RelationshipDirectionalTenGodFacts;
  dayBranchRelations?: RelationshipDayBranchNarrativeSelection;
}) {
  const visibleFields = FOUNDATION_FIELDS.filter(field =>
    foundation.participants.some(participant => participant[field.value])
  );
  const dayMasterNarratives = foundation.participants.flatMap(participant =>
    participant.dayMasterNarrative
      ? [{ id: participant.id, text: participant.dayMasterNarrative }]
      : []
  );
  const hasCompleteDayMasterNarrative =
    dayMasterNarratives.length === foundation.participants.length;

  if (
    visibleFields.length === 0
    && zodiac?.status !== "available"
    && !hasCompleteDayMasterNarrative
    && imagery?.status !== "available"
    && yinYang?.status !== "available"
    && birthXiu?.status !== "available"
    && fiveElements?.status !== "available"
    && directionalTenGods?.status !== "available"
    && dayBranchRelations?.status !== "available"
  ) return null;

  return (
    <>
      {visibleFields.length > 0 && <section
        className="relationship-mainline-foundation"
        aria-labelledby="relationship-mainline-foundation-title"
      >
        <h3 id="relationship-mainline-foundation-title">基础信息</h3>
        <div className="relationship-foundation-grid">
          {visibleFields.map(field => (
            <section key={field.id} aria-labelledby={`relationship-foundation-${field.id}`}>
              <span
                className="relationship-foundation-field-label"
                id={`relationship-foundation-${field.id}`}
              >
                {field.label}
              </span>
              <dl>
                {foundation.participants.map(participant => {
                  const value = participant[field.value];
                  if (!value) return null;
                  return (
                    <div key={participant.id}>
                      <dt>{participant.label}</dt>
                      <dd>{value}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
      </section>}

      {zodiac?.status === "available" && (
        <section className="relationship-mainline-section" aria-labelledby="relationship-mainline-zodiac-title">
          <h3 id="relationship-mainline-zodiac-title">生肖</h3>
          <dl className="relationship-mainline-pair-lines">
            {zodiac.participants.map(participant => (
              <div key={participant.id}>
                <dt>{participant.label}</dt>
                <dd>{participant.zodiac}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {hasCompleteDayMasterNarrative && (
        <section
          className="relationship-mainline-day-master"
          aria-labelledby="relationship-mainline-day-master-title"
        >
          <h3 id="relationship-mainline-day-master-title">日主</h3>
          <div>
            {dayMasterNarratives.map(item => <p key={item.id}>{item.text}</p>)}
          </div>
        </section>
      )}

      {imagery?.status === "available" && (
        <section className="relationship-mainline-imagery" aria-labelledby="relationship-mainline-imagery-title">
          <h3 id="relationship-mainline-imagery-title">物象</h3>
          <div className="relationship-mainline-imagery-cores">
            {imagery.participants.map(participant => (
              <article key={participant.id}>
                <h4>{participant.label} · {participant.entry.title}</h4>
                <p>{participant.narrative}</p>
              </article>
            ))}
          </div>
          {imagery.interaction && (
            <div className="relationship-mainline-imagery-interaction">
              <p>{imagery.interaction.sections.commonality}</p>
              <p>{imagery.interaction.sections.difference}</p>
              <p>{imagery.interaction.sections.interactionState}</p>
            </div>
          )}
        </section>
      )}

      {yinYang?.status === "available" && (
        <section className="relationship-mainline-yin-yang" aria-labelledby="relationship-mainline-yin-yang-title">
          <h3 id="relationship-mainline-yin-yang-title">阴阳</h3>
          <div className="relationship-yin-yang-pair">
            {yinYang.participants.map(participant => (
              <article key={participant.id} aria-label={`${participant.label}的阴阳明字构成，共${participant.coverageCount}个明字`}>
                <header><b>{participant.label}</b><small>覆盖 {participant.coverageCount} 个明字</small></header>
                {(["阳", "阴"] as const).map(value => (
                  <div key={value}>
                    <span><b>{value}</b><small>{participant.counts[value]} 个 · {participant.ratios[value]}%</small></span>
                    <i aria-hidden><em style={{ width: `${participant.ratios[value]}%` }} /></i>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>
      )}

      {birthXiu?.status === "available" && (
        <section className="relationship-mainline-birth-xiu" aria-labelledby="relationship-mainline-birth-xiu-title">
          <h3 id="relationship-mainline-birth-xiu-title">出生日值二十八宿</h3>
          <div className="relationship-birth-xiu-pair">
            {birthXiu.participants.map(participant => (
              <article key={participant.id}>
                <header><b>{participant.label}</b></header>
                <strong>{participant.xiu}{participant.zheng}{participant.animal}</strong>
                <p>{({ 东: "东方", 南: "南方", 西: "西方", 北: "北方" } as const)[participant.gong]}{participant.shou} · {participant.zheng} · {participant.animal}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {fiveElements?.status === "available" && (
        <section className="relationship-mainline-five-elements" aria-labelledby="relationship-mainline-five-elements-title">
          <h3 id="relationship-mainline-five-elements-title">五行</h3>
          <div className="relationship-five-elements-pair">
            {fiveElements.participants.map(participant => (
              <article key={participant.id} aria-label={`${participant.label}的五行明字构成，共${participant.coverageCount}个明字`}>
                <header><b>{participant.label}</b><small>覆盖 {participant.coverageCount} 个明字</small></header>
                <dl>
                  {ELEMENTS.map(element => (
                    <div key={element}>
                      <dt>{element}</dt>
                      <dd>{participant.counts[element]} 个</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {directionalTenGods?.status === "available" && (
        <section className="relationship-mainline-ten-gods" aria-labelledby="relationship-mainline-ten-gods-title">
          <h3 id="relationship-mainline-ten-gods-title">十神</h3>
          <div>
            {directionalTenGods.lines.map(line => (
              <p key={line.perspective}>{line.statement}</p>
            ))}
          </div>
        </section>
      )}

      {dayBranchRelations?.status === "available" && (
        <section className="relationship-mainline-day-branches" aria-labelledby="relationship-mainline-day-branches-title">
          <h3 id="relationship-mainline-day-branches-title">地支关系</h3>
          <dl className="relationship-day-branch-pair">
            <div><dt>你的日支</dt><dd>{dayBranchRelations.personABranch}</dd></div>
            <div><dt>对方日支</dt><dd>{dayBranchRelations.personBBranch}</dd></div>
          </dl>
          <div className="relationship-day-branch-narratives">
            {dayBranchRelations.items.map(item => (
              <article key={item.entry.id}>
                <h4>{item.entry.title}</h4>
                <p>{item.entry.narrative}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
