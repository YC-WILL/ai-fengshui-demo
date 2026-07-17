import { describe, expect, it } from "vitest";
import { buildTheoryGuidance, selectTheoryCards, THEORY_CATALOG_VERSION } from "../src/lib/knowledge/theoryCatalog";

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
});
