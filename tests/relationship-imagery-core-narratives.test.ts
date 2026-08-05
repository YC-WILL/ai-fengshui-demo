import { describe, expect, it } from "vitest";
import {
  BAZI_DIRECT_NARRATIVE_CATALOG,
  BAZI_DIRECT_NARRATIVE_FACT_IDS
} from "@/lib/domain/baziDirectNarratives";
import {
  PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY,
  type ProfessionalBaziFact
} from "@/lib/domain/professionalBaziFacts";
import {
  RELATIONSHIP_IMAGERY_CORE_CATALOG,
  relationshipImageryCoreForOther,
  selectRelationshipImageryCore
} from "@/lib/domain/relationshipImageryCoreNarratives";
import type {
  RelationshipImageryInput,
  RelationshipParticipantImageryInput
} from "@/lib/domain/relationshipMainlineFoundation";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";

type BaziNarrativeKey = keyof typeof BAZI_DIRECT_NARRATIVE_CATALOG;

function confirmedFact(
  value: unknown,
  sourcePosition: string
): ProfessionalBaziFact<unknown> {
  return {
    value,
    sourcePosition,
    calculationConvention: "test fixture copied from approved Bazi entry",
    ruleVersion: "test-v1",
    sourceRuleId: PROFESSIONAL_BAZI_SOURCE_RULE_REGISTRY.catalog.dayMaster,
    certainty: "confirmed"
  };
}

function participant(
  id: RelationshipParticipantImageryInput["id"],
  label: RelationshipParticipantImageryInput["label"],
  selectionKey: BaziNarrativeKey
): RelationshipParticipantImageryInput {
  const entry = BAZI_DIRECT_NARRATIVE_CATALOG[selectionKey];
  return {
    id,
    label,
    selectionKey,
    entry,
    dependencyFacts: {
      "dayMaster.stem": confirmedFact(entry.dayStem, "日柱天干"),
      "dayMaster.element": confirmedFact(entry.requiredFacts.dayElement, "日主五行"),
      "dayMaster.yinYang": confirmedFact(entry.requiredFacts.dayYinYang, "日主阴阳"),
      "monthCommand.branch": confirmedFact(entry.monthBranch, "月令地支"),
      "monthCommand.mainStem": confirmedFact(entry.requiredFacts.monthMainStem, "月令本气天干"),
      "monthCommand.mainTenGod": confirmedFact(entry.requiredFacts.monthMainTenGod, "月令本气十神")
    }
  };
}

function availableInput(
  relationshipTypeId: RelationshipType,
  personASelectionKey: BaziNarrativeKey,
  personBSelectionKey: BaziNarrativeKey
): Extract<RelationshipImageryInput, { status: "available" }> {
  return {
    status: "available",
    relationshipTypeId,
    relationshipType: relationshipTypeId === "partner" ? "情感"
      : relationshipTypeId === "family" ? "家人"
        : relationshipTypeId === "friend" ? "朋友" : "工作",
    participants: [
      participant("personA", "你", personASelectionKey),
      participant("personB", "对方", personBSelectionKey)
    ]
  };
}

describe("relationship imagery core narratives", () => {
  it("covers the complete 120-entry Bazi imagery catalog", () => {
    const baziKeys = Object.keys(BAZI_DIRECT_NARRATIVE_CATALOG).sort();
    const coreKeys = Object.keys(RELATIONSHIP_IMAGERY_CORE_CATALOG).sort();
    expect(coreKeys).toEqual(baziKeys);
    expect(coreKeys).toHaveLength(120);
  });

  it("binds every approved core to its exact selection key and six source facts", () => {
    Object.values(RELATIONSHIP_IMAGERY_CORE_CATALOG).forEach(entry => {
      const source = BAZI_DIRECT_NARRATIVE_CATALOG[entry.selectionKey];
      expect(entry).toMatchObject({
        reviewStatus: "human_reviewed_approved",
        requiredFacts: {
          dayStem: source.dayStem,
          dayElement: source.requiredFacts.dayElement,
          dayYinYang: source.requiredFacts.dayYinYang,
          monthBranch: source.monthBranch,
          monthMainStem: source.requiredFacts.monthMainStem,
          monthMainTenGod: source.requiredFacts.monthMainTenGod
        }
      });
      expect(entry.factDependencies).toEqual(BAZI_DIRECT_NARRATIVE_FACT_IDS);
      expect(entry.narrative.startsWith("你")).toBe(true);
      expect(entry.narrative).not.toContain("你们");
    });
  });

  it("returns independently selected core narratives for an arbitrary pair", () => {
    const selection = selectRelationshipImageryCore(
      availableInput("friend", "甲-辰", "癸-未")
    );
    expect(selection.status).toBe("available");
    if (selection.status !== "available") return;
    expect(selection.participants[0]).toMatchObject({
      label: "你",
      selectionKey: "甲-辰",
      narrative: expect.stringContaining("你像春雨中根系四通八达的乔木")
    });
    expect(selection.participants[1]).toMatchObject({
      label: "对方",
      selectionKey: "癸-未",
      narrative: expect.stringContaining("对方像夏末顺着器物轮廓缓缓汇入容器的清露")
    });
  });

  it("keeps both core selections unchanged across all four relationship contexts", () => {
    const selections = (["partner", "cooperation", "family", "friend"] as const)
      .map(type => selectRelationshipImageryCore(
        availableInput(type, "甲-辰", "癸-未")
      ));
    expect(selections.every(selection => selection.status === "available")).toBe(true);
    expect(selections.map(selection => JSON.stringify(selection))).toEqual([
      JSON.stringify(selections[0]),
      JSON.stringify(selections[0]),
      JSON.stringify(selections[0]),
      JSON.stringify(selections[0])
    ]);
  });

  it("uses approved copy for 你 and only deterministic salutation conversion for 对方", () => {
    const input = availableInput("partner", "乙-寅", "辛-寅");
    const selection = selectRelationshipImageryCore(input);
    expect(selection.status).toBe("available");
    if (selection.status !== "available") return;
    expect(selection.participants[0].narrative).toBe(
      RELATIONSHIP_IMAGERY_CORE_CATALOG["乙-寅"].narrative
    );
    expect(selection.participants[1].narrative).toBe(
      relationshipImageryCoreForOther(
        RELATIONSHIP_IMAGERY_CORE_CATALOG["辛-寅"].narrative
      )
    );
  });

  it("stops the whole pair when either participant fact is uncertain or mismatched", () => {
    const uncertain = availableInput("family", "甲-辰", "癸-未");
    uncertain.participants[1].dependencyFacts["monthCommand.branch"] = {
      ...uncertain.participants[1].dependencyFacts["monthCommand.branch"],
      certainty: "uncertain"
    };
    expect(selectRelationshipImageryCore(uncertain)).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });

    const mismatched = availableInput("family", "甲-辰", "癸-未");
    mismatched.participants[0].dependencyFacts["dayMaster.element"] = {
      ...mismatched.participants[0].dependencyFacts["dayMaster.element"],
      value: "火"
    };
    expect(selectRelationshipImageryCore(mismatched)).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });
  });

  it("stops the whole pair for a forged Bazi entry or missing core entry", () => {
    const forged = availableInput("cooperation", "甲-辰", "癸-未");
    forged.participants[0].entry = {
      ...forged.participants[0].entry,
      narrative: "伪造来源"
    };
    expect(selectRelationshipImageryCore(forged)).toEqual({
      status: "not_available",
      reason: "input_unavailable"
    });

    const missing = availableInput("cooperation", "甲-辰", "癸-未");
    const saved = RELATIONSHIP_IMAGERY_CORE_CATALOG["癸-未"];
    Reflect.deleteProperty(RELATIONSHIP_IMAGERY_CORE_CATALOG, "癸-未");
    try {
      expect(selectRelationshipImageryCore(missing)).toEqual({
        status: "not_available",
        reason: "input_unavailable"
      });
    } finally {
      RELATIONSHIP_IMAGERY_CORE_CATALOG["癸-未"] = saved;
    }
  });

  it("stops the whole pair when a core entry binding is altered", () => {
    const input = availableInput("friend", "甲-辰", "癸-未");
    const saved = RELATIONSHIP_IMAGERY_CORE_CATALOG["癸-未"];
    RELATIONSHIP_IMAGERY_CORE_CATALOG["癸-未"] = {
      ...saved,
      requiredFacts: {
        ...saved.requiredFacts,
        monthMainStem: "甲"
      }
    };
    try {
      expect(selectRelationshipImageryCore(input)).toEqual({
        status: "not_available",
        reason: "input_unavailable"
      });
    } finally {
      RELATIONSHIP_IMAGERY_CORE_CATALOG["癸-未"] = saved;
    }
  });

  it.each([
    ["id", "relationship-imagery-core:tampered:v1"],
    ["title", "被篡改的标题"],
    ["narrative", "你像一段被篡改的正文。"],
    ["contentVersion", "relationship-imagery-core-tampered"]
  ] as const)(
    "stops the whole pair when approved core %s is altered",
    (field, value) => {
      const input = availableInput("friend", "甲-辰", "癸-未");
      const saved = RELATIONSHIP_IMAGERY_CORE_CATALOG["癸-未"];
      const altered = { ...saved };
      Reflect.set(altered, field, value);
      RELATIONSHIP_IMAGERY_CORE_CATALOG["癸-未"] = altered;
      try {
        expect(selectRelationshipImageryCore(input)).toEqual({
          status: "not_available",
          reason: "input_unavailable"
        });
      } finally {
        RELATIONSHIP_IMAGERY_CORE_CATALOG["癸-未"] = saved;
      }
    }
  );

  it("does not generate pair interaction, integration, or relationship conclusions", () => {
    const selection = selectRelationshipImageryCore(
      availableInput("partner", "丙-午", "癸-子")
    );
    expect(selection.status).toBe("available");
    if (selection.status !== "available") return;
    const output = selection.participants.map(item => item.narrative).join("\n");
    expect(output).not.toMatch(/相通之处|差异与碰撞|共存与交融|匹配度|关系结论/);
  });
});
