import { describe, expect, it } from "vitest";
import { buildTheoryGuidance, selectTheoryCards, THEORY_CATALOG_VERSION } from "../src/lib/knowledge/theoryCatalog";
import { buildTheoryGuidanceFromDatabase } from "../src/lib/knowledge/theoryRepository";

describe("theory catalog", () => {
  it("selects psychology and Feng Shui correspondences by report module", () => {
    const cards = selectTheoryCards("home_fengshui_basic", { userSituation: "卧室潮湿、晚上睡不好" });
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some(card => card.psychology.includes("环境"))).toBe(true);
    expect(cards.some(card => card.fengshui.includes("藏风聚气") || card.fengshui.includes("阴阳"))).toBe(true);
  });

  it("keeps traditional concepts explicitly bounded", () => {
    const guidance = buildTheoryGuidance("marriage_basic", { userSituation: "谈钱时争执" });
    expect(guidance).toContain(THEORY_CATALOG_VERSION);
    expect(guidance).toContain("不得互相冒充科学证据");
    expect(guidance).toContain("不得使用正缘、孽缘、克夫、克妻、必合或必分");
  });

  it("prefers active database cards when available", async () => {
    const guidance = await buildTheoryGuidanceFromDatabase(
      "bazi_basic",
      { userSituation: "连续被拒后怀疑自己" },
      {
        theoryCard: {
          findMany: async () => [
            {
              id: "db-self-confidence",
              version: "db.v1",
              module: "self",
              psychology: "数据库里的认知重评",
              fengshui: "数据库里的动静平衡",
              mechanism: "先把事实和自我评价分开，再安排一个低风险验证动作。",
              whenToUse: JSON.stringify(["被拒", "怀疑自己"]),
              allowed: "允许回应用户的具体受挫场景。",
              forbidden: "不得把短期失败写成能力定论。",
              action: "复盘一场对话，记录一个事实和一个下次动作。",
              review: "三天后看行动完成次数。"
            }
          ]
        }
      } as never
    );

    expect(guidance).toContain("db.v1");
    expect(guidance).toContain("db-self-confidence");
    expect(guidance).toContain("数据库里的认知重评");
  });

  it("falls back to the code catalog when database cards are unavailable", async () => {
    const guidance = await buildTheoryGuidanceFromDatabase(
      "marriage_basic",
      { userSituation: "谈钱时争执" },
      {
        theoryCard: {
          findMany: async () => {
            throw new Error("database unavailable");
          }
        }
      } as never
    );

    expect(guidance).toContain(THEORY_CATALOG_VERSION);
    expect(guidance).toContain("不得使用正缘、孽缘、克夫、克妻、必合或必分");
  });
});
