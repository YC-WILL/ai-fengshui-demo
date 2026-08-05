import { readFileSync } from "node:fs";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RelationshipMainlineFoundation from "@/components/RelationshipMainlineFoundation";
import { computeBazi } from "@/lib/domain/bazi";
import { buildRelationshipMainlineDataFlow } from "@/lib/relationshipMainlineDataFlow";

const CALCULATED_AT = new Date("2026-08-05T04:00:00.000Z");

function fictionalChart(birthDate: string) {
  return computeBazi({
    gender: "other",
    birthDate,
    birthTime: "12:00",
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime: false
  });
}

function completeFlow() {
  return buildRelationshipMainlineDataFlow({
    personAChart: fictionalChart("1990-04-19"),
    personBChart: fictionalChart("1990-07-27"),
    personATimezoneBasis: "provided",
    personBTimezoneBasis: "provided",
    relationshipTypeId: "partner",
    calculatedAt: CALCULATED_AT
  });
}

describe("isolated relationship mainline data flow", () => {
  it("builds one production-shaped fictional pair into the complete nine-section reading", () => {
    const { reading } = completeFlow();
    const markup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, reading)
    );
    const orderedSectionIds = [
      "relationship-mainline-foundation-title",
      "relationship-mainline-zodiac-title",
      "relationship-mainline-day-master-title",
      "relationship-mainline-imagery-title",
      "relationship-mainline-yin-yang-title",
      "relationship-mainline-birth-xiu-title",
      "relationship-mainline-five-elements-title",
      "relationship-mainline-ten-gods-title",
      "relationship-mainline-day-branches-title"
    ];

    orderedSectionIds.forEach(id => expect(markup).toContain(id));
    orderedSectionIds.slice(1).forEach((id, index) => {
      expect(markup.indexOf(orderedSectionIds[index])).toBeLessThan(
        markup.indexOf(id)
      );
    });
    expect(reading.imagery.status).toBe("available");
    expect(reading.dayBranchRelations.status).toBe("available");
    expect(markup).not.toMatch(/候选|审核状态|选择键|技术原因|匹配度|重试/);
  });

  it("always renders both approved core narratives and adds three interaction sections only on an exact approved sample", () => {
    const { reading } = completeFlow();
    expect(reading.imagery.status).toBe("available");
    if (reading.imagery.status !== "available") return;

    expect(reading.imagery.participants.map(participant => participant.selectionKey)).toEqual([
      "甲-辰",
      "癸-未"
    ]);
    expect(reading.imagery.participants.map(participant => participant.narrative)).toEqual([
      expect.stringContaining("你像春雨中根系四通八达的乔木"),
      expect.stringContaining("对方像夏末顺着器物轮廓缓缓汇入容器的清露")
    ]);
    expect(reading.imagery.interaction).not.toBeNull();
    expect(Object.keys(reading.imagery.interaction?.sections ?? {})).toEqual([
      "commonality",
      "difference",
      "interactionState"
    ]);

    const unmatched = buildRelationshipMainlineDataFlow({
      personAChart: fictionalChart("1992-04-15"),
      personBChart: fictionalChart("1994-09-22"),
      personATimezoneBasis: "provided",
      personBTimezoneBasis: "provided",
      relationshipTypeId: "partner",
      calculatedAt: CALCULATED_AT
    }).reading;
    expect(unmatched.imagery.status).toBe("available");
    if (unmatched.imagery.status !== "available") return;
    expect(unmatched.imagery.participants).toHaveLength(2);
    expect(unmatched.imagery.interaction).toBeNull();
    const unmatchedMarkup = renderToStaticMarkup(
      createElement(RelationshipMainlineFoundation, unmatched)
    );
    expect(unmatchedMarkup).toContain("relationship-mainline-imagery-title");
    expect(unmatchedMarkup).not.toMatch(/重试|技术原因|input_unavailable/);
  });

  it("connects only the marriage display layer while keeping the data flow free of persistence side effects", () => {
    const source = readFileSync(
      "src/lib/relationshipMainlineDataFlow.ts",
      "utf8"
    );
    const marriagePage = readFileSync("src/app/marriage/page.tsx", "utf8");
    const workspaces = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");

    expect(source).not.toMatch(/PlateSaveControl|plateRecords|database|prisma|fetch\(|\/marriage/);
    expect(marriagePage).toContain("RelationWorkspace");
    expect(workspaces).toContain("buildRelationshipMainlineDataFlow");
    expect(workspaces).toContain("<RelationshipMainlineFoundation {...mainlineReading} />");
    expect(workspaces).toContain('continuation ? "legacy" : "analysis"');
    expect(workspaces.indexOf("relationshipView === \"analysis\"")).toBeLessThan(
      workspaces.indexOf("relationshipView === \"legacy\"")
    );
    const analysisView = workspaces.slice(
      workspaces.indexOf("relationshipView === \"analysis\""),
      workspaces.indexOf("relationshipView === \"legacy\"")
    );
    expect(analysisView).not.toContain("PlateSaveControl");
    expect(analysisView).not.toContain("relationship-card-grid");
  });

  it("does not ship fictional fixtures or preview query entrances", () => {
    const marriagePage = readFileSync("src/app/marriage/page.tsx", "utf8");
    const workspaces = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");

    expect(marriagePage).not.toMatch(/preview|getDevelopmentFixture|虚构测试城市/);
    expect(workspaces).not.toMatch(/developmentFixture|RelationshipDevelopmentFixture/);
  });
});
