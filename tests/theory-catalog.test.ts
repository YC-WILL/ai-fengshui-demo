import { describe, expect, it } from "vitest";
import {
  buildTheoryGuidance,
  selectTheoryCards,
  THEORY_CATALOG,
  THEORY_CATALOG_VERSION
} from "../src/lib/knowledge/theoryCatalog";
import { buildTheoryGuidanceFromDatabase } from "../src/lib/knowledge/theoryRepository";
import { syncTheoryCards } from "../src/lib/knowledge/theorySync";

describe("traditional theory catalog", () => {
  it("contains Zhouyi, Bagua, Feng Shui and Bazi knowledge without psychology theories", () => {
    const catalogText = JSON.stringify(THEORY_CATALOG);
    expect(THEORY_CATALOG.length).toBe(20);
    expect(catalogText).toContain("《周易");
    expect(catalogText).toContain("八卦");
    expect(catalogText).toContain("风水");
    expect(catalogText).toContain("《滴天髓》");
    expect(catalogText).not.toMatch(/认知行为|WOOP|依恋|心理学|非暴力沟通|执行意图|环境心理/);
  });

  it("selects traditional cards by report module and user context", () => {
    const cards = selectTheoryCards("home_fengshui_basic", { userSituation: "卧室潮湿、有霉味" });
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some(card => card.source.includes("葬书"))).toBe(true);
    expect(cards.some(card => card.topic.includes("风") || card.topic.includes("阴阳"))).toBe(true);
  });

  it("keeps traditional concepts explicitly bounded", () => {
    const guidance = buildTheoryGuidance("marriage_basic", { userSituation: "两个人有分歧" });
    expect(guidance).toContain(THEORY_CATALOG_VERSION);
    expect(guidance).toContain("不是科学证明或结果预测");
    expect(guidance).toContain("不得用单一合冲预测离婚、出轨、疾病或灾祸");
  });

  it("uses current-version database cards through legacy storage columns", async () => {
    const guidance = await buildTheoryGuidanceFromDatabase(
      "bazi_basic",
      { userSituation: "想了解四柱月令" },
      {
        theoryCard: {
          findMany: async () => [
            {
              id: "db-bazi-month-command",
              version: THEORY_CATALOG_VERSION,
              module: "self",
              psychology: "《子平真诠》",
              fengshui: "日主与月令",
              mechanism: "以日干为观察中心，并结合月令与全局关系。",
              whenToUse: JSON.stringify(["四柱", "月令"]),
              allowed: "可以说明传统结构。",
              forbidden: "不得作命定结论。",
              action: "先核对排盘。",
              review: "检查是否只凭单一字判断。"
            }
          ]
        }
      } as never
    );

    expect(guidance).toContain(THEORY_CATALOG_VERSION);
    expect(guidance).toContain("db-bazi-month-command");
    expect(guidance).toContain("《子平真诠》");
    expect(guidance).not.toContain("心理学");
  });

  it("rejects an older psychology-card database version", async () => {
    const guidance = await buildTheoryGuidanceFromDatabase(
      "bazi_basic",
      { userSituation: "想了解五行" },
      {
        theoryCard: {
          findMany: async () => [
            {
              id: "old-psychology-card",
              version: "2026-07-18.v1",
              module: "self",
              psychology: "认知行为模型 ABC",
              fengshui: "阴阳平衡",
              mechanism: "旧内容",
              whenToUse: "[]",
              allowed: "旧内容",
              forbidden: "旧内容",
              action: "旧内容",
              review: "旧内容"
            }
          ]
        }
      } as never
    );

    expect(guidance).toContain(THEORY_CATALOG_VERSION);
    expect(guidance).not.toContain("认知行为模型 ABC");
  });

  it("falls back to the code catalog when database cards are unavailable", async () => {
    const guidance = await buildTheoryGuidanceFromDatabase(
      "marriage_basic",
      { userSituation: "两个人沟通有分歧" },
      {
        theoryCard: {
          findMany: async () => {
            throw new Error("database unavailable");
          }
        }
      } as never
    );

    expect(guidance).toContain(THEORY_CATALOG_VERSION);
    expect(guidance).toContain("《周易》");
  });

  it("syncs the traditional catalog and deactivates obsolete cards", async () => {
    const upserts: Array<Record<string, unknown>> = [];
    const updates: Array<Record<string, unknown>> = [];
    const count = await syncTheoryCards({
      theoryCard: {
        upsert: async (args: Record<string, unknown>) => {
          upserts.push(args);
          return args;
        },
        updateMany: async (args: Record<string, unknown>) => {
          updates.push(args);
          return { count: 12 };
        }
      }
    } as never);

    expect(count).toBe(20);
    expect(upserts).toHaveLength(20);
    expect(JSON.stringify(upserts)).not.toMatch(/认知行为|WOOP|依恋|心理学|非暴力沟通/);
    expect(updates).toEqual([
      expect.objectContaining({ data: { isActive: false } })
    ]);
  });
});
