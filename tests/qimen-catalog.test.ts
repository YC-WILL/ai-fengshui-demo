import { describe, expect, it } from "vitest";
import {
  QIMEN_CATALOG_VERSION,
  QIMEN_ENTITIES,
  QIMEN_INTERPRETATIONS,
  QIMEN_METHOD_RULES,
  QIMEN_RELATIONS
} from "@/lib/knowledge/qimenCatalog";
import { syncQimenKnowledge } from "@/lib/knowledge/qimenSync";

const entities = (category: string) => QIMEN_ENTITIES.filter(item => item.category === category);
const relations = (type: string) => QIMEN_RELATIONS.filter(item => item.relationType === type);

describe("Qimen foundational catalog", () => {
  it("contains complete foundational layers", () => {
    expect(QIMEN_CATALOG_VERSION).toBe("2026-07-20.qimen-foundation-v2");
    expect(entities("qimen_palace")).toHaveLength(9);
    expect(entities("qimen_gate")).toHaveLength(8);
    expect(entities("qimen_star")).toHaveLength(9);
    expect(entities("qimen_deity")).toHaveLength(8);
    expect(entities("qimen_stem_role")).toHaveLength(9);
    expect(entities("qimen_jia_leader")).toHaveLength(6);
    expect(entities("qimen_dun")).toHaveLength(2);
    expect(entities("qimen_bureau")).toHaveLength(18);
    expect(entities("qimen_yuan")).toHaveLength(3);
    expect(entities("qimen_pattern")).toHaveLength(5);
    expect(QIMEN_ENTITIES).toHaveLength(77);
  });

  it("maps all 24 solar terms and three Yuan to a reviewable bureau", () => {
    const mappings = relations("solar_term_yuan_bureau");
    expect(mappings).toHaveLength(72);
    expect(new Set(mappings.map(item => item.attributes.solarTerm)).size).toBe(24);
    expect(mappings.find(item => item.id === "qimen-term-bureau-dongzhi-upper"))
      .toMatchObject({ resultCode: "yang-1", attributes: { yuan: "upper", dun: "yang", bureau: 1 } });
    expect(mappings.find(item => item.id === "qimen-term-bureau-xiazhi-middle"))
      .toMatchObject({ resultCode: "yin-3", attributes: { yuan: "middle", dun: "yin", bureau: 3 } });
    expect(relations("palace_opposition")).toHaveLength(8);
  });

  it("keeps canonical palace, gate, star and Jia-concealment mappings", () => {
    expect(entities("qimen_palace").find(item => item.code === "kan-1")?.attributes)
      .toMatchObject({ number: 1, trigram: "坎", direction: "北", phase: "水" });
    expect(entities("qimen_gate").find(item => item.code === "open")?.attributes)
      .toMatchObject({ basePalace: "qian-6", phase: "金", classicalGroup: "三吉门" });
    expect(entities("qimen_star").find(item => item.code === "ying")?.attributes)
      .toMatchObject({ basePalace: "li-9", phase: "火" });
    expect(relations("jia_concealment")).toHaveLength(6);
    expect(relations("jia_concealment").find(item => item.id === "qimen-conceal-jia-zi")?.objectCodes)
      .toEqual(["qimenStem:wu"]);
  });

  it("versions a reviewable hourly method without pretending the full engine exists", () => {
    expect(QIMEN_METHOD_RULES).toHaveLength(16);
    expect(QIMEN_METHOD_RULES.map(item => item.step)).toEqual([...Array(16)].map((_, index) => index + 1));
    expect(QIMEN_METHOD_RULES.find(item => item.code === "method_scope")?.rule)
      .toMatchObject({ engineMayChooseSilently: false, proposedMethod: "hourly_rotating_qimen" });
    expect(QIMEN_METHOD_RULES.find(item => item.code === "three_yuan")?.explanation).toContain("算法未核验前");
    expect(QIMEN_METHOD_RULES.find(item => item.code === "bureau_table")?.rule)
      .toMatchObject({ relationType: "solar_term_yuan_bureau", expectedMappings: 72 });
    expect(QIMEN_METHOD_RULES.find(item => item.code === "pattern_detection")?.rule)
      .toMatchObject({ requireMachineCondition: true, forbidNameOnlyVerdict: true });
  });

  it("keeps every explanation sourced and inside the product safety boundary", () => {
    expect(QIMEN_INTERPRETATIONS).toHaveLength(60);
    expect([...QIMEN_ENTITIES, ...QIMEN_RELATIONS, ...QIMEN_METHOD_RULES, ...QIMEN_INTERPRETATIONS]
      .every(item => item.sourceUrl.startsWith("https://"))).toBe(true);
    expect(QIMEN_INTERPRETATIONS.every(item => item.forbiddenUse.includes("不得"))).toBe(true);
    expect(JSON.stringify({ QIMEN_ENTITIES, QIMEN_RELATIONS, QIMEN_METHOD_RULES, QIMEN_INTERPRETATIONS }))
      .not.toMatch(/心理学|星座|命中注定|保证发财|必然离婚|疾病预测/);
  });

  it("syncs only the Qimen scope and deactivates obsolete Qimen rows", async () => {
    const calls = { entity: 0, relation: 0, method: 0, interpretation: 0 };
    const updates: unknown[] = [];
    const model = (key: keyof typeof calls) => ({
      upsert: async () => { calls[key] += 1; return {}; },
      updateMany: async (args: unknown) => { updates.push(args); return { count: 0 }; }
    });
    const counts = await syncQimenKnowledge({
      traditionalEntity: model("entity"), traditionalRelation: model("relation"),
      traditionalMethodRule: model("method"), traditionalInterpretationCard: model("interpretation")
    } as never);
    expect(counts).toEqual({ entities: 77, relations: 111, methodRules: 16, interpretations: 60 });
    expect(calls).toEqual({ entity: 77, relation: 111, method: 16, interpretation: 60 });
    expect(JSON.stringify(updates)).toContain('"system":"qimen"');
    expect(JSON.stringify(updates)).toContain('"method":"qimen_hourly_rotating"');
  });
});
