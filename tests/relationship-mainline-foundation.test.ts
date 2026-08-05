import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RelationshipMainlineFoundation from "@/components/RelationshipMainlineFoundation";
import { computeBazi } from "@/lib/domain/bazi";
import {
  buildRelationshipBirthXiuFacts,
  buildRelationshipDirectionalTenGodFacts,
  buildRelationshipFiveElementFacts,
  buildRelationshipImageryInput,
  buildRelationshipMainlineFoundation,
  buildRelationshipMainlineReading,
  buildRelationshipYinYangFacts,
  buildRelationshipZodiacFacts
} from "@/lib/domain/relationshipMainlineFoundation";
import { buildBaziBirthXiuFacts } from "@/lib/domain/baziBirthXiuFacts";
import { buildProfessionalRelationshipFactsV1 } from "@/lib/domain/professionalRelationshipFacts";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

const CALCULATED_AT = new Date("2026-08-04T04:00:00.000Z");

function fictionalChart(birthDate: string, unknownTime = false) {
  return computeBazi({
    gender: "other",
    birthDate,
    birthTime: unknownTime ? "" : "12:00",
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime
  });
}

function fictionalFacts(birthDate: string, unknownTime = false) {
  const chart = fictionalChart(birthDate, unknownTime);
  return buildProfessionalBaziFactsOnServer(chart, CALCULATED_AT)
    .professionalFacts;
}

function relationshipBirthXiuInput(
  partnerUnknownTime = false,
  personABirthDate = "1992-04-15",
  personBBirthDate = "1994-09-22"
) {
  return {
    personA: buildBaziBirthXiuFacts(fictionalChart(personABirthDate)),
    personB: buildBaziBirthXiuFacts(
      fictionalChart(personBBirthDate, partnerUnknownTime)
    )
  };
}

function relationshipFactsWithUnknownPartnerTime() {
  return buildProfessionalRelationshipFactsV1(
    { facts: fictionalFacts("1992-04-15"), timezoneBasis: "provided" },
    { facts: fictionalFacts("1994-09-22", true), timezoneBasis: "provided" },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
}

function relationshipFacts() {
  return buildProfessionalRelationshipFactsV1(
    { facts: fictionalFacts("1992-04-15"), timezoneBasis: "provided" },
    { facts: fictionalFacts("1994-09-22"), timezoneBasis: "provided" },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
}

function relationshipFactsWithDifferentDayStems() {
  return buildProfessionalRelationshipFactsV1(
    { facts: fictionalFacts("1992-04-15"), timezoneBasis: "provided" },
    { facts: fictionalFacts("1994-09-23"), timezoneBasis: "provided" },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
}

function relationshipFactsForContinuousReading() {
  return buildProfessionalRelationshipFactsV1(
    { facts: fictionalFacts("1992-05-11"), timezoneBasis: "provided" },
    { facts: fictionalFacts("1994-09-22"), timezoneBasis: "provided" },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
}

describe("relationship mainline foundation", () => {
  it("organizes both participants under the same three Bazi foundation fields", () => {
    const foundation = buildRelationshipMainlineFoundation(
      relationshipFacts()
    );

    expect(foundation.participants).toHaveLength(2);
    expect(foundation.participants[0]).toMatchObject({
      id: "personA",
      label: "你",
      dayMaster: "辛金 · 阴",
      dayMasterNarrative: "你的日主是辛，五行为金，阴阳属阴，也称阴金。",
      monthCommand: "辰土",
      mainQi: "戊土 · 正印"
    });
    expect(foundation.participants[1]).toMatchObject({
      id: "personB",
      label: "对方",
      dayMaster: "辛金 · 阴",
      dayMasterNarrative: "对方的日主是辛，五行为金，阴阳属阴，也称阴金。",
      monthCommand: "酉金",
      mainQi: "辛金 · 比肩"
    });
  });

  it("renders a continuous three-column comparison instead of two profile cards", () => {
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, {
        foundation: buildRelationshipMainlineFoundation(relationshipFacts())
      })
    );

    expect(markup).toContain("基础信息");
    expect(markup).toContain("日主");
    expect(markup).toContain("月令");
    expect(markup).toContain("本气");
    expect(markup).toContain("你");
    expect(markup).toContain("对方");
    expect(markup).not.toContain("不确定");
    expect(markup).not.toContain("候选");
    expect(markup).not.toContain("匹配");
  });

  it("renders both fact-generated day-master sentences in one continuous section", () => {
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, {
        foundation: buildRelationshipMainlineFoundation(relationshipFacts())
      })
    );
    const selfSentence = "你的日主是辛，五行为金，阴阳属阴，也称阴金。";
    const otherSentence = "对方的日主是辛，五行为金，阴阳属阴，也称阴金。";

    expect(markup).toContain(selfSentence);
    expect(markup).toContain(otherSentence);
    expect(markup.indexOf(selfSentence)).toBeLessThan(markup.indexOf(otherSentence));
    expect(markup.match(/<h[1-6][^>]*>日主<\/h[1-6]>/g)).toHaveLength(1);
    expect(markup.match(/class="relationship-mainline-day-master"/g)).toHaveLength(1);
    expect(markup).not.toMatch(/匹配度|互补|性格|关系结论|适合|不合/);
    expect(markup).not.toMatch(/来源|候选|不确定|算法|技术/);
  });

  it("hides an uncertain participant month line without exposing technical gaps", () => {
    const facts = relationshipFacts();
    const personB = facts.participants.personB.natalFacts;
    personB.monthCommand.branch.certainty = "uncertain";
    personB.monthCommand.branch.value = null;
    personB.monthCommand.element.certainty = "uncertain";
    personB.monthCommand.element.value = null;
    personB.monthCommand.mainStem.certainty = "uncertain";
    personB.monthCommand.mainStem.value = null;
    personB.monthCommand.mainTenGod.certainty = "uncertain";
    personB.monthCommand.mainTenGod.value = null;

    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, {
        foundation: buildRelationshipMainlineFoundation(facts)
      })
    );

    expect(markup).toContain("辛金 · 阴");
    expect(markup).toContain("辰土");
    expect(markup).not.toContain("酉金");
    expect(markup).not.toContain("不确定");
  });

  it("hides the whole ordinary day-master section unless both participants are confirmed", () => {
    const facts = relationshipFacts();
    const personB = facts.participants.personB.natalFacts;
    personB.dayMaster.stem.certainty = "uncertain";

    const foundation = buildRelationshipMainlineFoundation(facts);
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, { foundation })
    );

    expect(foundation.participants[1].dayMasterNarrative).toBeNull();
    expect(markup).not.toContain("relationship-mainline-day-master");
    expect(markup).not.toContain("你的日主是");
    expect(markup).not.toContain("候选");
    expect(markup).not.toContain("不确定");
  });
});

describe("relationship imagery input", () => {
  it("returns two traceable approved Bazi imagery entries when both exact selections are available", () => {
    const input = buildRelationshipImageryInput(relationshipFacts(), "partner");

    expect(input.status).toBe("available");
    if (input.status !== "available") return;

    expect(input.relationshipType).toBe("情感");
    expect(input.participants).toHaveLength(2);
    expect(input.participants.map(participant => participant.label)).toEqual([
      "你",
      "对方"
    ]);
    input.participants.forEach(participant => {
      expect(participant.selectionKey).toBe(
        `${participant.entry.dayStem}-${participant.entry.monthBranch}`
      );
      expect(participant.entry.reviewStatus).toBe("human_reviewed_approved");
      expect(Object.keys(participant.dependencyFacts)).toEqual(
        participant.entry.factDependencies
      );
      participant.entry.factDependencies.forEach(dependencyId => {
        expect(participant.dependencyFacts[dependencyId]).toMatchObject({
          certainty: "confirmed"
        });
        expect(participant.dependencyFacts[dependencyId].sourcePosition).toBeTruthy();
        expect(participant.dependencyFacts[dependencyId].sourceRuleId).toBeTruthy();
        expect(participant.dependencyFacts[dependencyId].ruleVersion).toBeTruthy();
      });
    });
  });

  it("changes only the expression context when the relationship type changes", () => {
    const facts = relationshipFacts();
    const emotional = buildRelationshipImageryInput(facts, "partner");
    const work = buildRelationshipImageryInput(facts, "cooperation");

    expect(emotional.status).toBe("available");
    expect(work.status).toBe("available");
    if (emotional.status !== "available" || work.status !== "available") return;

    expect(emotional.relationshipType).toBe("情感");
    expect(work.relationshipType).toBe("工作");
    expect(work.participants).toEqual(emotional.participants);
  });

  it("makes the whole input unavailable when either participant imagery is uncertain", () => {
    const facts = relationshipFacts();
    facts.participants.personB.natalFacts.monthCommand.branch.certainty = "uncertain";

    expect(buildRelationshipImageryInput(facts, "family")).toEqual({
      status: "not_available",
      relationshipTypeId: "family",
      relationshipType: "家人",
      reason: "participant_imagery_unavailable"
    });
  });

  it("contains no relationship narrative, encounter cause, destiny, or result fields", () => {
    const input = buildRelationshipImageryInput(relationshipFacts(), "friend");
    const topLevelKeys = Object.keys(input);

    expect(input.relationshipType).toBe("朋友");
    expect(topLevelKeys).not.toEqual(
      expect.arrayContaining([
        "narrative",
        "whyMet",
        "encounterReason",
        "destiny",
        "relationshipResult",
        "collision",
        "integration"
      ])
    );
    expect(JSON.stringify(input)).not.toMatch(
      /为什么相遇|注定|缘分来源|关系结果|必合|必分/
    );
  });
});

describe("continuous isolated relationship reading", () => {
  it("binds both zodiac values to confirmed professional year-branch facts", () => {
    const zodiac = buildRelationshipZodiacFacts(relationshipFacts());
    expect(zodiac.status).toBe("available");
    if (zodiac.status !== "available") return;

    expect(zodiac.participants.map(participant => ({
      label: participant.label,
      branch: participant.yearBranch,
      zodiac: participant.zodiac,
      certainty: participant.sourceFact.certainty,
      mappingTrace: participant.mappingTrace
    }))).toEqual([
      {
        label: "你",
        branch: "申",
        zodiac: "猴",
        certainty: "confirmed",
        mappingTrace: {
          sourceRuleId: "code:elements:ZODIAC_BY_BRANCH",
          ruleVersion: "bazi-deterministic-v1"
        }
      },
      {
        label: "对方",
        branch: "戌",
        zodiac: "狗",
        certainty: "confirmed",
        mappingTrace: {
          sourceRuleId: "code:elements:ZODIAC_BY_BRANCH",
          ruleVersion: "bazi-deterministic-v1"
        }
      }
    ]);
  });

  it("renders the continuous reading through birth daily xiu in order", () => {
    const facts = relationshipFactsForContinuousReading();
    const reading = buildRelationshipMainlineReading(
      facts,
      "friend",
      relationshipBirthXiuInput(false, "1992-05-11", "1994-09-22")
    );
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );

    expect(reading.imagery.status).toBe("available");
    if (reading.imagery.status !== "available") return;
    expect(reading.imagery.participants.map(participant => participant.entry.title)).toEqual([
      "初夏灯火",
      "温润银饰"
    ]);
    expect(markup.indexOf("relationship-mainline-foundation-title")).toBeLessThan(markup.indexOf("relationship-mainline-zodiac-title"));
    expect(markup.indexOf("relationship-mainline-zodiac-title")).toBeLessThan(markup.indexOf("relationship-mainline-day-master-title"));
    expect(markup.indexOf("relationship-mainline-day-master-title")).toBeLessThan(markup.indexOf("relationship-mainline-imagery-title"));
    expect(markup.indexOf("relationship-mainline-imagery-title")).toBeLessThan(markup.indexOf("relationship-mainline-yin-yang-title"));
    expect(markup.indexOf("relationship-mainline-yin-yang-title")).toBeLessThan(markup.indexOf("relationship-mainline-birth-xiu-title"));
    expect(markup.indexOf("relationship-mainline-birth-xiu-title")).toBeLessThan(markup.indexOf("relationship-mainline-five-elements-title"));
    expect(markup.indexOf("relationship-mainline-five-elements-title")).toBeLessThan(markup.indexOf("relationship-mainline-ten-gods-title"));
    expect(markup.indexOf("relationship-mainline-ten-gods-title")).toBeLessThan(markup.indexOf("relationship-mainline-day-branches-title"));
    expect(markup).toContain("<dt>你</dt><dd>猴</dd>");
    expect(markup).toContain("<dt>对方</dt><dd>狗</dd>");
    expect(markup).toContain("你 · 初夏灯火");
    expect(markup).toContain("对方 · 温润银饰");
    expect(markup).toContain("张月鹿");
    expect(markup).toContain("井木犴");
    expect(reading.imagery.interaction).toBeNull();
    expect(markup).toContain("<dt>你的日支</dt><dd>亥</dd>");
    expect(markup).toContain("<dt>对方日支</dt><dd>亥</dd>");
    expect(markup).toContain("同支");
    expect(markup).toContain("自刑");
    expect(markup).not.toMatch(/候选|审核状态|选择键|技术原因|匹配度|生肖配对/);
  });

  it("projects both complete confirmed Bazi daily-xiu facts with traceability", () => {
    const birthXiu = buildRelationshipBirthXiuFacts(
      relationshipFacts(),
      relationshipBirthXiuInput()
    );
    expect(birthXiu).toEqual({
      status: "available",
      participants: [
        {
          id: "personA",
          label: "你",
          birthCivilDate: "1992-04-15",
          calculationKind: "traditional_daily_xiu",
          calculationConvention: expect.stringMatching(/出生地民用日期.*不表示.*月球.*实际星宿位置/),
          xiu: "轸",
          zheng: "水",
          animal: "蚓",
          gong: "南",
          shou: "朱雀",
          certainty: "confirmed",
          sourceRuleId: "dependency:lunar-typescript:Lunar:getXiu:getZheng:getAnimal:getGong:getShou",
          algorithmVersion: "lunar-typescript@1.8.6",
          schemaVersion: "bazi-birth-xiu-facts-v1"
        },
        {
          id: "personB",
          label: "对方",
          birthCivilDate: "1994-09-22",
          calculationKind: "traditional_daily_xiu",
          calculationConvention: expect.stringMatching(/出生地民用日期.*不表示.*月球.*实际星宿位置/),
          xiu: "井",
          zheng: "木",
          animal: "犴",
          gong: "南",
          shou: "朱雀",
          certainty: "confirmed",
          sourceRuleId: "dependency:lunar-typescript:Lunar:getXiu:getZheng:getAnimal:getGong:getShou",
          algorithmVersion: "lunar-typescript@1.8.6",
          schemaVersion: "bazi-birth-xiu-facts-v1"
        }
      ]
    });
  });

  it("keeps daily xiu available when birth time is unknown but civil date is confirmed", () => {
    const birthXiu = buildRelationshipBirthXiuFacts(
      relationshipFactsWithUnknownPartnerTime(),
      relationshipBirthXiuInput(true)
    );
    expect(birthXiu.status).toBe("available");
    if (birthXiu.status !== "available") return;
    expect(birthXiu.participants[1]).toMatchObject({
      birthCivilDate: "1994-09-22",
      xiu: "井",
      certainty: "confirmed"
    });
  });

  it("does not let relationship type change either participant's daily-xiu fact", () => {
    const facts = relationshipFacts();
    const input = relationshipBirthXiuInput();
    const emotional = buildRelationshipMainlineReading(facts, "partner", input);
    const work = buildRelationshipMainlineReading(facts, "cooperation", input);

    expect(work.birthXiu).toEqual(emotional.birthXiu);
  });

  it("hides only daily xiu when either participant fact is unavailable or incomplete", () => {
    const facts = relationshipFacts();
    const input = relationshipBirthXiuInput();
    input.personB.certainty = "unavailable";
    input.personB.xiu = null;
    const reading = buildRelationshipMainlineReading(facts, "partner", input);
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );

    expect(reading.birthXiu.status).toBe("not_available");
    expect(markup).not.toContain("relationship-mainline-birth-xiu-title");
    expect(markup).toContain("relationship-mainline-foundation-title");
    expect(markup).toContain("relationship-mainline-yin-yang-title");
  });

  it("rejects a confirmed daily-xiu input when any required display field is incomplete", () => {
    const input = relationshipBirthXiuInput();
    input.personB.animal = "";

    expect(buildRelationshipBirthXiuFacts(
      relationshipFacts(),
      input
    )).toEqual({ status: "not_available" });
  });

  it("shows only the two daily-xiu facts without algorithms, pairing, or conclusions", () => {
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, buildRelationshipMainlineReading(
        relationshipFacts(),
        "friend",
        relationshipBirthXiuInput()
      ))
    );

    expect(markup).toContain("出生日值二十八宿");
    expect(markup).toContain("南方朱雀 · 水 · 蚓");
    expect(markup).toContain("南方朱雀 · 木 · 犴");
    expect(markup).not.toContain("relationship-birth-xiu-visual-placeholder");
    expect(markup).not.toMatch(/本命星宿|算法|索引|日期转换|候选|来源|不可用|配对|吉|凶|性格|命运|关系结果/);
    expect(markup).not.toContain("历法为你的出生日期");
  });

  it("counts eight visible characters for each complete four-pillar participant", () => {
    const yinYang = buildRelationshipYinYangFacts(relationshipFacts());
    expect(yinYang.status).toBe("available");
    if (yinYang.status !== "available") return;

    yinYang.participants.forEach(participant => {
      expect(participant.coverageCount).toBe(8);
      expect(participant.counts.阳 + participant.counts.阴).toBe(8);
      expect(participant.sources.map(source => source.position)).toEqual([
        "年柱", "月柱", "日柱", "时柱"
      ]);
      expect(participant.ruleTraces).toEqual(expect.arrayContaining([
        expect.objectContaining({ sourceRuleId: "code:elements:STEM_YIN_YANG" }),
        expect.objectContaining({ sourceRuleId: "code:elements:BRANCH_YIN_YANG" })
      ]));
    });
  });

  it("keeps separate coverage when one participant has no confirmed hour pillar", () => {
    const reading = buildRelationshipMainlineReading(
      relationshipFactsWithUnknownPartnerTime(),
      "partner"
    );
    expect(reading.yinYang.status).toBe("available");
    if (reading.yinYang.status !== "available") return;
    expect(reading.yinYang.participants.map(participant => participant.coverageCount)).toEqual([8, 6]);

    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );
    expect(markup).toContain("覆盖 8 个明字");
    expect(markup).toContain("覆盖 6 个明字");
  });

  it("excludes candidate year and month pillars from the visible-character count", () => {
    const facts = relationshipFacts();
    const personA = facts.participants.personA.natalFacts;
    personA.uncertainty.yearPillarCandidates.value = ["甲申", "乙酉"];
    personA.uncertainty.monthPillarCandidates.value = ["丙辰", "丁巳"];
    expect(personA.pillars[0].ganzhi.certainty).toBe("confirmed");
    expect(personA.pillars[1].ganzhi.certainty).toBe("confirmed");
    const yinYang = buildRelationshipYinYangFacts(facts);

    expect(yinYang.status).toBe("available");
    if (yinYang.status !== "available") return;
    expect(yinYang.participants[0].coverageCount).toBe(4);
    expect(yinYang.participants[0].sources.map(source => source.position)).toEqual(["日柱", "时柱"]);
  });

  it("hides only yin-yang when either participant has no reliable visible position", () => {
    const facts = relationshipFacts();
    facts.participants.personA.natalFacts.pillars.forEach(pillar => {
      pillar.ganzhi.certainty = "uncertain";
    });
    const reading = buildRelationshipMainlineReading(facts, "partner");
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );

    expect(reading.yinYang.status).toBe("not_available");
    expect(markup).not.toContain("relationship-mainline-yin-yang-title");
    expect(markup).toContain("relationship-mainline-foundation-title");
    expect(markup).toContain("relationship-mainline-day-master-title");
  });

  it("shows only composition and coverage without relational conclusions or technical gaps", () => {
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, buildRelationshipMainlineReading(
        relationshipFactsWithUnknownPartnerTime(),
        "partner"
      ))
    );
    expect(markup).toContain("阴阳");
    expect(markup).not.toMatch(/旺衰|力量|互补|匹配度|候选|技术原因|性格|关系结果/);
  });

  it("counts five visible elements across eight confirmed characters for each participant", () => {
    const facts = relationshipFacts();
    const fiveElements = buildRelationshipFiveElementFacts(facts);
    expect(fiveElements.status).toBe("available");
    if (fiveElements.status !== "available") return;

    fiveElements.participants.forEach(participant => {
      const natal = facts.participants[participant.id].natalFacts;
      expect(participant.coverageCount).toBe(8);
      expect(Object.values(participant.counts).reduce((sum, count) => sum + count, 0)).toBe(8);
      expect(participant.counts).toEqual(Object.fromEntries(
        Object.entries(natal.visibleElementCounts).map(([element, fact]) => [element, fact.value])
      ));
      expect(participant.sources.map(source => source.position)).toEqual([
        "年柱", "月柱", "日柱", "时柱"
      ]);
      expect(participant.ruleTraces).toEqual(expect.arrayContaining([
        expect.objectContaining({ sourceRuleId: "code:elements:STEM_ELEMENT" }),
        expect.objectContaining({ sourceRuleId: "code:elements:BRANCH_ELEMENT" })
      ]));
    });
  });

  it("keeps each five-element coverage separate when one birth time is unknown", () => {
    const reading = buildRelationshipMainlineReading(
      relationshipFactsWithUnknownPartnerTime(),
      "partner"
    );
    expect(reading.fiveElements.status).toBe("available");
    if (reading.fiveElements.status !== "available") return;
    expect(reading.fiveElements.participants.map(participant => participant.coverageCount)).toEqual([8, 6]);

    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );
    expect(markup).toContain("覆盖 8 个明字");
    expect(markup).toContain("覆盖 6 个明字");
  });

  it("excludes candidate year and month pillars from five-element counts", () => {
    const facts = relationshipFacts();
    const personA = facts.participants.personA.natalFacts;
    personA.uncertainty.yearPillarCandidates.value = ["甲申", "乙酉"];
    personA.uncertainty.monthPillarCandidates.value = ["丙辰", "丁巳"];
    expect(personA.pillars[0].ganzhi.certainty).toBe("confirmed");
    expect(personA.pillars[1].ganzhi.certainty).toBe("confirmed");
    const fiveElements = buildRelationshipFiveElementFacts(facts);

    expect(fiveElements.status).toBe("available");
    if (fiveElements.status !== "available") return;
    expect(fiveElements.participants[0].coverageCount).toBe(4);
    expect(Object.values(fiveElements.participants[0].counts).reduce((sum, count) => sum + count, 0)).toBe(4);
    expect(fiveElements.participants[0].sources.map(source => source.position)).toEqual(["日柱", "时柱"]);
  });

  it("hides only five elements when either participant has no reliable position", () => {
    const facts = relationshipFacts();
    facts.participants.personA.natalFacts.pillars.forEach(pillar => {
      pillar.ganzhi.certainty = "uncertain";
    });
    const reading = buildRelationshipMainlineReading(facts, "partner");
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );

    expect(reading.fiveElements.status).toBe("not_available");
    expect(markup).not.toContain("relationship-mainline-five-elements-title");
    expect(markup).toContain("relationship-mainline-foundation-title");
    expect(markup).toContain("relationship-mainline-day-master-title");
  });

  it("renders five-element counts without charts, strength, absence, or relationship judgments", () => {
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, buildRelationshipMainlineReading(
        relationshipFacts(),
        "friend"
      ))
    );
    expect(markup).toContain("relationship-mainline-five-elements-title");
    expect(markup).toMatch(/<dt>木<\/dt><dd>\d+ 个<\/dd>/);
    expect(markup).toMatch(/<dt>水<\/dt><dd>\d+ 个<\/dd>/);
    expect(markup).not.toMatch(/图表|旺衰|强弱|喜忌|格局|缺什么|谁补谁|相生|相克|互补|合适|匹配度|评分|关系结论|候选|技术原因/);
  });

  it("projects the two existing directional day-stem ten-god facts without recalculation", () => {
    const facts = relationshipFactsWithDifferentDayStems();
    const directional = buildRelationshipDirectionalTenGodFacts(facts);
    expect(directional.status).toBe("available");
    if (directional.status !== "available") return;

    expect(directional.lines.map(line => ({
      perspective: line.perspective,
      referenceDayMaster: line.referenceDayMaster,
      observedStem: line.observedStem,
      tenGod: line.tenGod
    }))).toEqual(facts.comparisonFacts.directionalDayStemTenGods.map(fact => fact.value));
    expect(directional.lines[0].tenGod).not.toBe(directional.lines[1].tenGod);
    expect(directional.lines[0].sourceFact).toBe(
      facts.comparisonFacts.directionalDayStemTenGods[0]
    );
    expect(directional.lines[1].sourceFact).toBe(
      facts.comparisonFacts.directionalDayStemTenGods[1]
    );
  });

  it("keeps both directional ten-god facts unchanged across relationship contexts", () => {
    const facts = relationshipFactsWithDifferentDayStems();
    const emotional = buildRelationshipMainlineReading(facts, "partner");
    const work = buildRelationshipMainlineReading(facts, "cooperation");

    expect(work.directionalTenGods).toEqual(emotional.directionalTenGods);
  });

  it("hides the whole ten-god section when either direction or a day-stem dependency is uncertain", () => {
    const uncertainDirection = relationshipFacts();
    uncertainDirection.comparisonFacts.directionalDayStemTenGods[0].certainty = "uncertain";
    expect(buildRelationshipDirectionalTenGodFacts(uncertainDirection)).toEqual({
      status: "not_available"
    });

    const uncertainDependency = relationshipFacts();
    uncertainDependency.participants.personB.natalFacts.dayMaster.stem.certainty = "uncertain";
    const reading = buildRelationshipMainlineReading(uncertainDependency, "friend");
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );
    expect(reading.directionalTenGods.status).toBe("not_available");
    expect(markup).not.toContain("relationship-mainline-ten-gods-title");
    expect(markup).toContain("relationship-mainline-five-elements-title");
  });

  it("renders two directional structure statements without behavior or relationship conclusions", () => {
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, buildRelationshipMainlineReading(
        relationshipFactsWithDifferentDayStems(),
        "friend"
      ))
    );

    expect(markup).toContain("以你的日主为参照，对方日干对应的十神是");
    expect(markup).toContain("以对方的日主为参照，你的日干对应的十神是");
    expect(markup.match(/对应的十神是/g)).toHaveLength(2);
    expect(markup).not.toMatch(/付出|控制|强势|不合|匹配度|吉|凶|角色分工|行动建议|关系结局|藏干十神|完整十神/);
  });

  it("hides only day-branch relations when no registered relation exists", () => {
    const reading = buildRelationshipMainlineReading(
      buildProfessionalRelationshipFactsV1(
        { facts: fictionalFacts("1992-01-01"), timezoneBasis: "provided" },
        { facts: fictionalFacts("1992-01-05"), timezoneBasis: "provided" },
        { calculatedAt: CALCULATED_AT.toISOString() }
      ),
      "partner"
    );
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );

    expect(reading.dayBranchRelations).toEqual({
      status: "not_available",
      reason: "no_registered_relation"
    });
    expect(markup).not.toContain("relationship-mainline-day-branches-title");
    expect(markup).toContain("relationship-mainline-ten-gods-title");
    expect(markup).toContain("relationship-mainline-five-elements-title");
  });

  it("does not expose day-branch sources, scopes, review status, or technical reasons", () => {
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, buildRelationshipMainlineReading(
        relationshipFactsForContinuousReading(),
        "friend"
      ))
    );

    expect(markup).toContain("地支关系");
    expect(markup).not.toMatch(/complete_pair|partial_group|reviewStatus|human_reviewed_approved|sourceRuleId|narrative_not_reviewed|facts_unavailable|技术原因|候选/);
  });

  it("hides only zodiac when either year branch is not confirmed", () => {
    const facts = relationshipFacts();
    const yearPillar = facts.participants.personB.natalFacts.pillars.find(
      pillar => pillar.position.value === "年柱"
    );
    if (!yearPillar) throw new Error("missing fictional year pillar");
    yearPillar.branch.certainty = "uncertain";
    const reading = buildRelationshipMainlineReading(facts, "partner");
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );

    expect(reading.zodiac.status).toBe("not_available");
    expect(markup).not.toContain("relationship-mainline-zodiac-title");
    expect(markup).toContain("relationship-mainline-day-master-title");
  });

  it("hides only zodiac when year-pillar candidates exist despite a confirmed year branch", () => {
    const facts = relationshipFacts();
    const personB = facts.participants.personB.natalFacts;
    const yearPillar = personB.pillars.find(pillar => pillar.position.value === "年柱");
    if (!yearPillar) throw new Error("missing fictional year pillar");
    expect(yearPillar.branch.certainty).toBe("confirmed");
    personB.uncertainty.yearPillarCandidates.value = ["甲戌", "乙亥"];
    personB.uncertainty.yearPillarCandidates.certainty = "uncertain";
    const reading = buildRelationshipMainlineReading(facts, "partner");
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );

    expect(reading.zodiac.status).toBe("not_available");
    expect(yearPillar.branch.certainty).toBe("confirmed");
    expect(markup).not.toContain("relationship-mainline-zodiac-title");
    expect(markup).toContain("relationship-mainline-day-master-title");
  });

  it("keeps both approved core imagery narratives when no interaction sample is approved", () => {
    const reading = buildRelationshipMainlineReading(relationshipFacts(), "partner");
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );

    expect(reading.zodiac.status).toBe("available");
    expect(reading.imagery.status).toBe("available");
    if (reading.imagery.status !== "available") return;
    expect(reading.imagery.participants).toHaveLength(2);
    expect(reading.imagery.interaction).toBeNull();
    expect(markup).toContain("relationship-mainline-zodiac-title");
    expect(markup).toContain("relationship-mainline-day-master-title");
    expect(markup).toContain("relationship-mainline-imagery-title");
    expect(markup).not.toMatch(/重试|input_unavailable|技术原因/);
  });
});
