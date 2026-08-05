import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeBazi } from "@/lib/domain/bazi";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";
import { buildProfessionalRelationshipFactsV1 } from "@/lib/domain/professionalRelationshipFacts";
import { selectRelationshipImageryCore } from "@/lib/domain/relationshipImageryCoreNarratives";
import {
  buildRelationshipImageryInteractionInput,
  type RelationshipImageryInteractionInputSelection
} from "@/lib/domain/relationshipImageryInteractionInput";
import {
  RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLE_CATALOG,
  RELATIONSHIP_IMAGERY_INTERACTION_SAMPLE_VERSION,
  selectRelationshipImageryInteractionNarrativeSample,
  type RelationshipImageryInteractionNarrativeSampleEntry
} from "@/lib/domain/relationshipImageryInteractionNarrativeSamples";
import { buildRelationshipImageryInput } from "@/lib/domain/relationshipMainlineFoundation";
import type { RelationshipType } from "@/lib/domain/relationshipInteractions";

const CALCULATED_AT = new Date("2026-08-05T04:00:00.000Z");

function fictionalFacts(birthDate: string) {
  const chart = computeBazi({
    gender: "other",
    birthDate,
    birthTime: "12:00",
    birthLocation: "虚构测试城市",
    timezone: "Asia/Shanghai",
    unknownTime: false
  });
  return buildProfessionalBaziFactsOnServer(chart, CALCULATED_AT)
    .professionalFacts;
}

function interactionInputForDates(
  relationshipTypeId: RelationshipType,
  personABirthDate: string,
  personBBirthDate: string
): RelationshipImageryInteractionInputSelection {
  const personA = fictionalFacts(personABirthDate);
  const personB = fictionalFacts(personBBirthDate);
  const professionalFacts = buildProfessionalRelationshipFactsV1(
    { facts: personA, timezoneBasis: "provided" },
    { facts: personB, timezoneBasis: "provided" },
    { calculatedAt: CALCULATED_AT.toISOString() }
  );
  const imageryInput = buildRelationshipImageryInput(
    professionalFacts,
    relationshipTypeId
  );
  const coreSelection = selectRelationshipImageryCore(imageryInput);
  return buildRelationshipImageryInteractionInput({
    relationshipTypeId,
    imageryInput,
    coreSelection,
    professionalFacts
  });
}

function interactionInput(
  relationshipTypeId: RelationshipType,
  reverse = false
): RelationshipImageryInteractionInputSelection {
  return interactionInputForDates(
    relationshipTypeId,
    reverse ? "1990-07-17" : "1990-04-09",
    reverse ? "1990-04-09" : "1990-07-17"
  );
}

describe("relationship imagery interaction narrative samples", () => {
  it("contains exactly four approved narratives for one directed imagery pair", () => {
    expect(Object.keys(RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLE_CATALOG))
      .toEqual(["partner", "cooperation", "family", "friend"]);
    Object.values(
      RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLE_CATALOG
    ).forEach(entry => {
      expect(entry).toMatchObject({
        personASelectionKey: "甲-辰",
        personBSelectionKey: "癸-未",
        reviewStatus: "human_reviewed_approved",
        contentKind: "modern_relationship_interpretation",
        contentVersion: RELATIONSHIP_IMAGERY_INTERACTION_SAMPLE_VERSION
      });
      expect(Object.keys(entry.sections)).toEqual([
        "commonality",
        "difference",
        "interactionState"
      ]);
      expect(Object.values(entry.sections).every(section => section.length > 0))
        .toBe(true);
    });
  });

  it("selects all four contexts from the same confirmed interaction facts", () => {
    const selections = (["partner", "cooperation", "family", "friend"] as const)
      .map(relationshipTypeId => {
        const input = interactionInput(relationshipTypeId);
        expect(input.status).toBe("available");
        return selectRelationshipImageryInteractionNarrativeSample(input);
      });
    expect(selections.every(selection => selection.status === "available"))
      .toBe(true);
    expect(selections.map(selection => (
      selection.status === "available" ? selection.entry.relationshipTypeId : null
    ))).toEqual(["partner", "cooperation", "family", "friend"]);
  });

  it("keeps both approved core narratives unchanged in all four contexts", () => {
    const inputs = (["partner", "cooperation", "family", "friend"] as const)
      .map(relationshipTypeId => interactionInput(relationshipTypeId));
    expect(inputs.every(input => input.status === "available")).toBe(true);
    if (inputs.some(input => input.status !== "available")) return;
    const available = inputs as Array<
      Extract<RelationshipImageryInteractionInputSelection, { status: "available" }>
    >;
    const coreSnapshots = available.map(input => input.coreImagery.participants.map(
      participant => ({
        selectionKey: participant.selectionKey,
        title: participant.entry.title,
        narrative: participant.narrative,
        contentVersion: participant.entry.contentVersion
      })
    ));
    expect(coreSnapshots).toEqual([
      coreSnapshots[0],
      coreSnapshots[0],
      coreSnapshots[0],
      coreSnapshots[0]
    ]);
  });

  it("changes prose materially by context while keeping the three-layer structure", () => {
    const entries = Object.values(
      RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLE_CATALOG
    );
    (["commonality", "difference", "interactionState"] as const)
      .forEach(section => {
        expect(new Set(entries.map(entry => entry.sections[section])).size)
          .toBe(4);
      });
    expect(entries[0].sections.commonality).toContain("恋爱相处");
    expect(entries[1].sections.commonality).toContain("共事协作");
    expect(entries[2].sections.commonality).toContain("家庭日常");
    expect(entries[3].sections.commonality).toContain("友情往来");
    expect(entries[3].sections.difference).toContain(
      "你更偏向拓宽交流的边界，对方更偏向沉淀交流带来的感悟。"
    );
    expect(entries[3].sections.difference).not.toContain(
      "你负责拓宽交流的边界，对方负责沉淀交流带来的感悟。"
    );
  });

  it("stops when any approved catalog identity or prose field is altered", () => {
    const entry: RelationshipImageryInteractionNarrativeSampleEntry =
      RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLE_CATALOG.friend;
    const original: RelationshipImageryInteractionNarrativeSampleEntry = {
      ...entry,
      sections: { ...entry.sections }
    };
    const mutations: Array<(
      value: RelationshipImageryInteractionNarrativeSampleEntry
    ) => void> = [
      value => { value.id = "tampered-id"; },
      value => { Object.assign(value, { contentKind: "tampered-kind" }); },
      value => { Object.assign(value, { contentVersion: "tampered-version" }); },
      value => { value.relationshipTypeId = "partner"; },
      value => { value.relationshipContextLabel = "情感"; },
      value => { Object.assign(value, { personASelectionKey: "甲-卯" }); },
      value => { Object.assign(value, { personBSelectionKey: "癸-午" }); },
      value => { value.sections.commonality = "tampered-commonality"; },
      value => { value.sections.difference = "tampered-difference"; },
      value => { value.sections.interactionState = "tampered-state"; }
    ];
    try {
      mutations.forEach(mutate => {
        Object.assign(entry, original, { sections: { ...original.sections } });
        mutate(entry);
        expect(selectRelationshipImageryInteractionNarrativeSample(
          interactionInput("friend")
        )).toEqual({ status: "not_available", reason: "input_unavailable" });
      });
    } finally {
      Object.assign(entry, original, { sections: { ...original.sections } });
    }
  });

  it("stops when the interaction context label is altered", () => {
    const input = interactionInput("friend");
    expect(input.status).toBe("available");
    if (input.status !== "available") return;
    const altered: RelationshipImageryInteractionInputSelection = {
      ...input,
      relationshipContext: {
        ...input.relationshipContext,
        label: "工作"
      }
    };
    expect(selectRelationshipImageryInteractionNarrativeSample(altered))
      .toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("stops for reversed people, another pair, unavailable facts, or altered metadata", () => {
    expect(selectRelationshipImageryInteractionNarrativeSample(
      interactionInput("partner", true)
    )).toEqual({ status: "not_available", reason: "input_unavailable" });
    expect(selectRelationshipImageryInteractionNarrativeSample(
      interactionInputForDates("partner", "1992-04-15", "1994-09-23")
    )).toEqual({ status: "not_available", reason: "input_unavailable" });

    const unavailable: RelationshipImageryInteractionInputSelection = {
      status: "not_available",
      reason: "input_unavailable"
    };
    expect(selectRelationshipImageryInteractionNarrativeSample(unavailable))
      .toEqual({ status: "not_available", reason: "input_unavailable" });

    const altered = interactionInput("friend");
    expect(altered.status).toBe("available");
    if (altered.status !== "available") return;
    const alteredInput: Extract<
      RelationshipImageryInteractionInputSelection,
      { status: "available" }
    > = {
      ...altered,
      modernImageryMetadata: {
        ...altered.modernImageryMetadata,
        participants: [
          {
            ...altered.modernImageryMetadata.participants[0],
            dayStemFamily: {
              ...altered.modernImageryMetadata.participants[0].dayStemFamily,
              value: "山地"
            }
          },
          altered.modernImageryMetadata.participants[1]
        ]
      }
    };
    expect(selectRelationshipImageryInteractionNarrativeSample(alteredInput))
      .toEqual({ status: "not_available", reason: "input_unavailable" });
  });

  it("contains no prohibited result, advice, fate, or scoring language", () => {
    const prose = Object.values(
      RELATIONSHIP_IMAGERY_INTERACTION_NARRATIVE_SAMPLE_CATALOG
    ).flatMap(entry => Object.values(entry.sections)).join("\n");
    expect(prose).not.toMatch(
      /缘分来源|注定|宿命|匹配度|评分|吉凶|必合|必分|关系结论|行动建议|应该|必须|谁补谁/
    );
  });

  it("reads only the interaction input contract and has no fallback or AI generation", () => {
    const source = readFileSync(
      "src/lib/domain/relationshipImageryInteractionNarrativeSamples.ts",
      "utf8"
    );
    expect(source).not.toMatch(
      /from\s+["'][^"']*(?:baziDirectNarratives|professionalRelationshipFacts|relationshipImageryCoreNarratives)["']/
    );
    expect(source).not.toMatch(
      /defaultNarrative|nearest|approximate|templateReplace|generateText|openai|anthropic/i
    );
  });
});
