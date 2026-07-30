import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BaziMainlinePanel from "@/components/BaziMainlinePanel";
import { computeBazi } from "@/lib/domain/bazi";
import {
  BAZI_MAINLINE_FACT_IDS,
  buildBaziMainlineNarrative
} from "@/lib/domain/baziMainlineNarrative";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

const calculatedAt = new Date("2026-07-30T08:00:00.000Z");

function fictionalNarrative(
  input: Parameters<typeof computeBazi>[0]
) {
  const chart = computeBazi(input);
  const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, calculatedAt);
  return {
    chart,
    professionalFacts,
    narrative: buildBaziMainlineNarrative(professionalFacts)
  };
}

describe("Bazi analysis mainline narrative", () => {
  it("builds one complete four-layer narrative from confirmed facts", () => {
    const { narrative } = fictionalNarrative({
      gender: "male",
      birthDate: "1992-04-15",
      birthTime: "10:00",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });

    expect(narrative?.status).toBe("ready");
    if (!narrative || narrative.status !== "ready") return;

    expect(narrative.professionalAnalysis.text).toMatch(/日主.*月令.*本气.*十神|日主.*月令.*形成/);
    expect(narrative.imagery.disclaimer).toContain("现代意象");
    expect(narrative.imagery.disclaimer).toContain("不是古籍原句");
    expect(narrative.plainReading.boundary).toContain("不证明某段现实经历已经发生");
    expect(narrative.evidence.map(item => item.id)).toEqual(BAZI_MAINLINE_FACT_IDS);

    const evidenceIds = new Set(narrative.evidence.map(item => item.id));
    [
      ...narrative.professionalAnalysis.factIds,
      ...narrative.imagery.factIds,
      ...narrative.plainReading.factIds
    ].forEach(id => expect(evidenceIds.has(id)).toBe(true));
  });

  it("does not use or explain an unavailable hour pillar", () => {
    const { narrative } = fictionalNarrative({
      gender: "other",
      birthDate: "1985-03-22",
      birthTime: "",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });

    expect(narrative?.status).toBe("ready");
    if (!narrative || narrative.status !== "ready") return;

    expect(narrative.evidence.every(item => !item.id.includes("hour"))).toBe(true);
    expect(narrative.professionalAnalysis.text).not.toContain("时柱");
    expect(narrative.imagery.text).not.toContain("时柱");
    expect(narrative.plainReading.text).not.toContain("时柱");
    expect(narrative.limitation).toMatch(/没有使用时柱、时柱藏干/);
  });

  it("stops before imagery and plain reading when the month pillar has boundary candidates", () => {
    const { narrative, professionalFacts } = fictionalNarrative({
      gender: "other",
      birthDate: "2024-02-04",
      birthTime: "",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });

    expect(professionalFacts.uncertainty.monthPillarCandidates.value.length).toBeGreaterThan(1);
    expect(narrative).toMatchObject({
      status: "uncertain",
      candidates: professionalFacts.uncertainty.monthPillarCandidates.value
    });
    expect(JSON.stringify(narrative)).not.toMatch(/imagery|plainReading|professionalAnalysis/);
  });

  it("removes the interpretation when a required fact is unavailable", () => {
    const { professionalFacts } = fictionalNarrative({
      gender: "other",
      birthDate: "1992-04-15",
      birthTime: "10:00",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const withoutMonthTenGod = structuredClone(professionalFacts);
    withoutMonthTenGod.monthCommand.mainTenGod = {
      ...withoutMonthTenGod.monthCommand.mainTenGod,
      value: null,
      certainty: "unavailable"
    };

    expect(buildBaziMainlineNarrative(withoutMonthTenGod)).toBeNull();
    expect(buildBaziMainlineNarrative(null)).toBeNull();
  });

  it("selects imagery and plain text from the same professional facts", () => {
    const first = fictionalNarrative({
      gender: "other",
      birthDate: "1992-04-15",
      birthTime: "10:00",
      birthLocation: "虚构测试城市甲",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const second = fictionalNarrative({
      gender: "other",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      birthLocation: "虚构测试城市乙",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });

    expect(first.narrative?.status).toBe("ready");
    expect(second.narrative?.status).toBe("ready");
    if (
      !first.narrative
      || first.narrative.status !== "ready"
      || !second.narrative
      || second.narrative.status !== "ready"
    ) return;

    expect(first.professionalFacts.monthCommand.branch.value)
      .not.toBe(second.professionalFacts.monthCommand.branch.value);
    expect(first.narrative.imagery.text).not.toBe(second.narrative.imagery.text);
    expect(first.narrative.plainReading.text).toContain(
      `${first.professionalFacts.monthCommand.mainStem.value}相对日主${first.professionalFacts.dayMaster.stem.value}`
    );
    expect(second.narrative.plainReading.text).toContain(
      `${second.professionalFacts.monthCommand.mainStem.value}相对日主${second.professionalFacts.dayMaster.stem.value}`
    );
    expect(first.narrative.plainReading.text).not.toBe(second.narrative.plainReading.text);
    expect(buildBaziMainlineNarrative).toHaveLength(1);
  });

  it("keeps catalog and code sources distinct in the trace", () => {
    const { narrative } = fictionalNarrative({
      gender: "other",
      birthDate: "1992-04-15",
      birthTime: "10:00",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    expect(narrative?.status).toBe("ready");
    if (!narrative || narrative.status !== "ready") return;

    expect(new Set(narrative.evidence.map(item => item.sourceKind))).toEqual(
      new Set(["traditional-catalog", "project-code"])
    );
    narrative.evidence.forEach(item => {
      expect(item.sourceKind).toBe(
        item.fact.sourceRuleId.startsWith("catalog:")
          ? "traditional-catalog"
          : "project-code"
      );
    });
  });

  it("renders the four layers in order and keeps evidence collapsed by default", () => {
    const { narrative } = fictionalNarrative({
      gender: "other",
      birthDate: "1992-04-15",
      birthTime: "10:00",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    expect(narrative?.status).toBe("ready");
    if (!narrative || narrative.status !== "ready") return;

    const markup = renderToStaticMarkup(
      createElement(BaziMainlinePanel, { narrative })
    );
    const professional = markup.indexOf("专业分析");
    const imagery = markup.indexOf("形象解释");
    const plain = markup.indexOf("白话解读");
    const evidence = markup.indexOf("为什么这样说");

    expect(professional).toBeGreaterThan(-1);
    expect(professional).toBeLessThan(imagery);
    expect(imagery).toBeLessThan(plain);
    expect(plain).toBeLessThan(evidence);
    expect(markup).toContain("<ol");
    expect(markup).toContain("<details");
    expect(markup).not.toMatch(/<details[^>]* open/);
    expect(markup).toContain("传统规则目录");
    expect(markup).toContain("项目计算实现");
  });
});
