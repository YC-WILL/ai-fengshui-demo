import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import {
  HIDDEN_STEM_REFERENCE,
  buildBaziMainline,
  buildBaziStructure,
  explainBaziCharacter,
  hiddenLayerReading,
  tenGodFor
} from "@/lib/domain/baziStructure";

describe("bazi structure evidence", () => {
  it("keeps the canonical hidden stems in main, middle and residual order", () => {
    expect(HIDDEN_STEM_REFERENCE.子).toEqual([{ stem: "癸", qiLevel: "本气" }]);
    expect(HIDDEN_STEM_REFERENCE.辰).toEqual([
      { stem: "戊", qiLevel: "本气" },
      { stem: "乙", qiLevel: "中气" },
      { stem: "癸", qiLevel: "余气" }
    ]);
    expect(Object.values(HIDDEN_STEM_REFERENCE).flat()).toHaveLength(28);
  });

  it("derives all ten-god families from the day master, element relation and polarity", () => {
    expect(tenGodFor("甲", "甲")).toMatchObject({ name: "比肩", relation: "同我", polarity: "同阴阳" });
    expect(tenGodFor("甲", "乙")).toMatchObject({ name: "劫财", relation: "同我", polarity: "异阴阳" });
    expect(tenGodFor("甲", "丙").name).toBe("食神");
    expect(tenGodFor("甲", "丁").name).toBe("伤官");
    expect(tenGodFor("甲", "戊").name).toBe("偏财");
    expect(tenGodFor("甲", "己").name).toBe("正财");
    expect(tenGodFor("甲", "庚").name).toBe("七杀");
    expect(tenGodFor("甲", "辛").name).toBe("正官");
    expect(tenGodFor("甲", "壬").name).toBe("偏印");
    expect(tenGodFor("甲", "癸").name).toBe("正印");
  });

  it("builds a traceable hierarchy for every available pillar", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    const structure = buildBaziStructure(chart);

    expect(structure.dayMaster).toMatchObject({ stem: chart.day.stem, source: "日柱天干" });
    expect(structure.monthCommand).toMatchObject({ branch: chart.month.branch, source: "月柱地支" });
    expect(structure.pillars).toHaveLength(4);
    expect(structure.pillars[2].visibleStem?.role).toBe("日主");
    structure.pillars.forEach(item => {
      expect(item.visibleStem?.source).toBe(`${item.name}天干`);
      expect(item.branch?.source).toBe(`${item.name}地支`);
      expect(item.hiddenStems.every(hidden => hidden.source.startsWith(`${item.name}地支`))).toBe(true);
    });
  });

  it("does not invent an hour pillar or evidence when birth time is unknown", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1985-03-22",
      birthTime: "",
      unknownTime: true
    });
    const hour = buildBaziStructure(chart).pillars[3];
    expect(hour.pillar).toBeNull();
    expect(hour.visibleStem).toBeNull();
    expect(hour.hiddenStems).toEqual([]);
  });

  it("explains each visible character as identity, source and role", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    const structure = buildBaziStructure(chart);
    const dayStem = explainBaziCharacter(structure.pillars[2], chart.dayMaster, "stem", structure);
    const monthBranch = explainBaziCharacter(structure.pillars[1], chart.dayMaster, "branch", structure);

    expect(dayStem).toMatchObject({
      character: chart.day.stem,
      source: "日柱天干",
      roleTitle: "日主"
    });
    expect(dayStem?.identity).toMatch(/[阴阳][木火土金水]天干/);
    expect(dayStem?.role).toMatch(/全盘的参照点/);
    expect(dayStem?.plainMeaning).toMatch(/白话里/);
    expect(dayStem?.connectionTitle).toMatch(/决定|起点/);
    expect(dayStem?.connection).toMatch(/放到你的盘里|其中一面/);
    expect(dayStem?.element).toMatch(/木|火|土|金|水/);
    expect(monthBranch).toMatchObject({
      character: chart.month.branch,
      source: "月柱地支",
      roleTitle: "月令"
    });
    expect(monthBranch?.role).toMatch(/季节位置|内部藏有/);
    expect(monthBranch?.plainMeaning).toMatch(/白话里/);
    expect(monthBranch?.connectionTitle).toMatch(/季节/);
    expect(monthBranch?.connection).toMatch(/月令|做事底色/);
  });

  it("connects the same chart characters to different life facets by pillar position", () => {
    const chart = computeBazi({
      gender: "other", birthDate: "1990-06-15", birthTime: "10:30", unknownTime: false
    });
    const structure = buildBaziStructure(chart);
    const explanations = structure.pillars.flatMap(pillar => [
      explainBaziCharacter(pillar, chart.dayMaster, "stem", structure),
      explainBaziCharacter(pillar, chart.dayMaster, "branch", structure)
    ]).filter(Boolean);

    expect(new Set(explanations.map(item => item?.connectionTitle)).size).toBe(8);
    expect(explanations[0]?.connection).toMatch(/外部呈现|早年环境/);
    expect(explanations[4]?.connection).toMatch(/日主|自我参照/);
    expect(explanations[6]?.connection).toMatch(/后续展开|长远想法/);
    expect(explanations.every(item => !item?.connection.match(/一定|必然|注定|人格|诊断/))).toBe(true);
  });

  it("gives the same character a different story when its chart context changes", () => {
    const firstChart = computeBazi({ gender: "other", birthDate: "2000-06-30", birthTime: "10:30", unknownTime: false });
    const secondChart = computeBazi({ gender: "other", birthDate: "1990-06-15", birthTime: "10:30", unknownTime: false });
    const firstStructure = buildBaziStructure(firstChart);
    const secondStructure = buildBaziStructure(secondChart);
    const first = explainBaziCharacter(firstStructure.pillars[0], firstChart.dayMaster, "stem", firstStructure);
    const second = explainBaziCharacter(secondStructure.pillars[0], secondChart.dayMaster, "stem", secondStructure);

    expect(first?.character).toBe("庚");
    expect(second?.character).toBe("庚");
    expect(first?.connection).not.toBe(second?.connection);
    expect(first?.connection).toMatch(/月令|环境底色|明现|地支/);
    expect(second?.connection).toMatch(/月令|环境底色|明现|地支/);
  });

  it("builds the three-question mainline from month command, visible stems and hidden stems", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2006-10-03",
      birthTime: "09:00",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const mainline = buildBaziMainline(chart);
    const monthChannel = mainline.flow.channels.find(channel => channel.isMonthCommand);

    expect(mainline.corePosition.title).toBe("先确认两个排盘事实");
    expect(mainline.flow.title).toBe("五类十神线索怎样分布");
    expect(mainline.meaning.title).toBe("两条可以对照生活的观察");
    expect(mainline.flow.channels.map(channel => channel.label)).toEqual([
      "承接来源", "自身力量", "表达输出", "现实事务", "规则约束"
    ]);
    expect(monthChannel).toMatchObject({ id: "constraint", label: "规则约束", isMonthCommand: true });
    expect(mainline.corePosition.summary).toMatch(/乙木（阴木）|酉月|月令本气辛|规则约束/);
    expect(mainline.meaning.basis).toMatch(/月令本气辛七杀|明干|藏干/);
    expect(mainline.elementOverview.prominent).toContain("火");
    expect(mainline.elementOverview.absentVisible).toEqual(["水"]);
    expect(mainline.elementOverview.foundInHidden).toEqual(["水"]);
    expect(mainline.elementOverview.absentEntirely).toEqual([]);
    expect(mainline.elementOverview.summary).toMatch(/明字|藏干|不等于缺陷/);
    expect(mainline.elementOverview.interpretation).toMatch(/接到新任务|需要推进|事务堆在一起|标准含糊|条件变化/);
    expect(mainline.monthReading.image).toMatch(/想象|时节/);
    expect(mainline.monthReading.interpretation).toMatch(/传统结构事实|项目的现代解释|现实经历核对/);
    expect(mainline.monthReading.interpretation).not.toMatch(/^传统上/);
    expect(mainline.tenGodReading.interpretation).toMatch(/日常场景|传统上|不是拿一个十神/);
  });

  it("turns hidden stems into pillar-specific situations without losing evidence", () => {
    const chart = computeBazi({ gender: "other", birthDate: "1990-06-15", birthTime: "10:30", unknownTime: false });
    const structure = buildBaziStructure(chart);
    const readings = structure.pillars.map(hiddenLayerReading);

    expect(readings[0]).toMatch(/陌生环境|长辈|本气/);
    expect(readings[1]).toMatch(/集体分工|日常任务|本气/);
    expect(readings[2]).toMatch(/真正作决定|亲近关系|本气/);
    expect(readings[3]).toMatch(/规划下一步|长期项目|本气/);
    expect(readings.join("")).not.toMatch(/一定|必然|注定|保证/);
  });

  it("keeps visible and hidden evidence traceable to exact pillar positions", () => {
    const mainline = buildBaziMainline(computeBazi({
      gender: "other",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      timezone: "Asia/Shanghai",
      unknownTime: false
    }));

    const evidence = mainline.flow.channels.flatMap(channel => [...channel.visible, ...channel.hidden]);
    expect(evidence.some(item => item.visibility === "天干显露")).toBe(true);
    expect(evidence.some(item => item.visibility === "地支藏干")).toBe(true);
    expect(evidence.every(item => /^(年柱|月柱|日柱|时柱)(天干|地支)/.test(item.source))).toBe(true);
    expect(evidence.filter(item => item.visibility === "天干显露")).toHaveLength(4);
  });

  it("does not invent hour evidence and names the limitation when time is unknown", () => {
    const mainline = buildBaziMainline(computeBazi({
      gender: "other",
      birthDate: "1985-03-22",
      birthTime: "",
      timezone: "Asia/Shanghai",
      unknownTime: true
    }));
    const evidence = mainline.flow.channels.flatMap(channel => [...channel.visible, ...channel.hidden]);

    expect(evidence.every(item => !item.source.startsWith("时柱"))).toBe(true);
    expect(mainline.incompleteNote).toMatch(/时柱及其藏干没有参与/);
    expect(mainline.meaning.temperament).not.toMatch(/时柱/);
  });

  it("changes the meaning with the combined chart instead of a single-god personality label", () => {
    const first = buildBaziMainline(computeBazi({
      gender: "other", birthDate: "2006-10-03", birthTime: "09:00", unknownTime: false
    }));
    const second = buildBaziMainline(computeBazi({
      gender: "other", birthDate: "1990-06-15", birthTime: "10:30", unknownTime: false
    }));

    expect(first.meaning.summary).not.toBe(second.meaning.summary);
    expect(first.meaning.temperament).not.toBe(second.meaning.temperament);
    expect(first.meaning.workingStyle).not.toBe(second.meaning.workingStyle);
    expect(first.meaning.basis).not.toBe(second.meaning.basis);
    expect(`${first.meaning.temperament}${first.meaning.workingStyle}${second.meaning.temperament}${second.meaning.workingStyle}`).not.toMatch(/你就是|天生|注定|一定|人格|焦虑症|抑郁症/);
    expect(first.meaning.summary).toMatch(/生活观察|不代表.*格局、旺衰或用神/);
    expect(first.meaning.basis).toMatch(/未使用自定义分数判断强弱/);
    expect(first.flow.summary).toMatch(/教学顺序|不代表.*实际.*流动/);
    expect(first.meaning.temperament.length).toBeLessThan(180);
    expect(first.meaning.workingStyle.length).toBeLessThan(180);
    expect(`${first.meaning.temperament}${second.meaning.temperament}`).not.toMatch(/像像|更像像/);
    expect(first.meaning.summary.length).toBeLessThan(220);
    expect(second.meaning.summary.length).toBeLessThan(220);
  });
});
