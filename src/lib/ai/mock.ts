// ============================================================
// Mock AI Provider
//
// 不调用任何外网。根据 reportType + tier 返回对应模板，
// 把规则引擎的关键结论拼接进去，用于本地开发和 demo。
// ============================================================

import type { AIProvider } from "./client";
import type { AIGenerateInput, AIGenerateOutput } from "../types";

export class MockProvider implements AIProvider {
  readonly name = "mock";

  async generateReport(input: AIGenerateInput): Promise<AIGenerateOutput> {
    const text = mockMarkdown(input);
    return {
      text,
      provider: this.name,
      model: "mock-1",
      reasoningEffort: input.tier,
      promptTokens: 0,
      completionTokens: text.length,
      raw: { mock: true }
    };
  }
}

function mockMarkdown(input: AIGenerateInput): string {
  const { reportType, tier, ruleResult } = input;
  const r = ruleResult as Record<string, unknown>;

  switch (reportType) {
    case "bazi_basic":
      return mockBaziBasic(r);
    case "bazi_deep":
      return mockBaziDeep(r);
    case "marriage_basic":
      return mockMarriageBasic(r);
    case "marriage_deep":
      return mockMarriageDeep(r);
    case "home_fengshui_basic":
      return mockFengshuiBasic(r);
    case "home_fengshui_deep":
      return mockFengshuiDeep(r);
    case "date_selection":
      return mockDateSelection(r);
    case "daily_almanac":
      return mockAlmanacNote(r);
    default:
      return `（mock 报告 · ${reportType} · tier=${tier}）\n\n暂无对应模板。`;
  }
}

// ----------------- 八字基础 -----------------
function mockBaziBasic(r: Record<string, unknown>): string {
  const dm = (r["dayMaster"] as string) ?? "未知";
  const zodiac = (r["zodiac"] as string) ?? "—";
  const ele = (r["elementSummary"] as string) ?? "—";
  const profile = (r["personalityProfile"] as string) ?? "暂无足够信息生成性格画像。";
  const suggestions = ((r["lifeSuggestions"] as string[]) ?? []).map(item => `- ${item}`).join("\n");
  const pillars = (r["pillars"] as Record<string, string>) ?? {};
  return `
# 八字基础参考

## 1. 用户信息摘要
日主：**${dm}**　生肖：**${zodiac}**
四柱：年 ${pillars.year ?? "—"}　月 ${pillars.month ?? "—"}　日 ${pillars.day ?? "—"}　时 ${pillars.hour ?? "—"}

## 2. 五行分布
${ele}

## 3. 性格画像
${profile}

## 4. 生活建议（3 条）
${suggestions || "- 结合近期真实经历，选择一个最想调整的行为，从小步骤开始观察。"}

> 本报告为基础版，仅供文化与生活规划参考，不构成任何专业决策建议。
`.trim();
}

// ----------------- 八字深度 -----------------
function mockBaziDeep(r: Record<string, unknown>): string {
  const dm = (r["dayMaster"] as string) ?? "未知";
  const zodiac = (r["zodiac"] as string) ?? "—";
  const ele = (r["elementSummary"] as string) ?? "—";
  const pillars = (r["pillars"] as Record<string, string>) ?? {};
  return `
# 八字深度参考报告

## 1. 用户信息摘要
日主：**${dm}**　生肖：**${zodiac}**
四柱：年 ${pillars.year}　月 ${pillars.month}　日 ${pillars.day}　时 ${pillars.hour ?? "—"}

## 2. 四柱与五行结构
${ele}。整体结构倾向显示出特定的节奏偏好，建议结合现实经历理解，不必拘泥于"格局好坏"的简单标签。

## 3. 性格与行为倾向
日主特性影响处事方式：你可能在沟通中更偏向 _稳健 / 表达克制_ 的方式，遇到压力时倾向先消化、再回应。注意避免长期"自我消化"导致的过度内耗。

## 4. 事业与学习方向
适合的方向倾向：需要长期专注、结果有积累效应的领域；不太适合需要频繁短促应酬的角色。
**可执行建议**：
- 每季度给自己设一个"小成就"目标，控制颗粒度避免烂尾。
- 主动找一个非同行的"局外人"提供反馈。

## 5. 财富习惯与风险偏好
财富习惯倾向稳健。
**注意**：
- 不要把所有积蓄放进单一品类。
- 在大额支出（>3 个月生活费）前与至少一位信任的朋友/家人讨论。
- 涉及具体投资请咨询持牌专业人士，本报告不构成任何投资建议。

## 6. 情感关系模式
你倾向于在关系中先观察、再投入。这意味着早期可能显得"慢热"，长期信任建立后会更稳定。
**建议**：在关系初期主动表达自己的节奏偏好，避免对方误读为"冷淡"。

## 7. 年度生活节奏参考
未来 12 个月，建议把重心放在：1) 巩固已有积累；2) 启动 1 个长周期小项目；3) 每季度 1 次健康复盘。

## 8. 可执行行动建议
- 建立"每日 30 分钟无干扰时段"。
- 每月固定 1 次小型聚会，维持人际网络温度。
- 每年体检 1 次（不替代医疗诊断）。

## 9. 注意事项
- 本报告基于简化版八字结构，不替代严谨命理分析。
- 涉及健康、法律、投资、婚姻请咨询对应专业人士。
`.trim();
}

// ----------------- 关系基础 -----------------
function mockMarriageBasic(r: Record<string, unknown>): string {
  const a = (r["partyA"] as Record<string, string>) ?? {};
  const b = (r["partyB"] as Record<string, string>) ?? {};
  const style = (r["communicationStyle"] as string) ?? "";
  const strengths = ((r["strengths"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  const friction = ((r["frictionPoints"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  return `
# 关系基础参考报告

## 1. 双方信息摘要
甲方：日主 ${a.dayMaster ?? "—"}　生肖 ${a.zodiac ?? "—"}
乙方：日主 ${b.dayMaster ?? "—"}　生肖 ${b.zodiac ?? "—"}

## 2. 沟通风格关键词
${style}

## 3. 关系优势
${strengths || "- 共同价值观可后续观察补充"}

## 4. 潜在摩擦点
${friction || "- 暂未发现明显结构性张力"}

## 5. 相处建议
- 把每周固定 5–15 分钟设为"两人对齐时间"。
- 重大支出 24 小时内不下决定。
- 情绪高时不做承诺、不做决定。
`.trim();
}

// ----------------- 关系深度 -----------------
function mockMarriageDeep(r: Record<string, unknown>): string {
  const basic = mockMarriageBasic(r);
  return basic + `

## 6. 金钱观与家庭责任倾向
建议在共同账目上引入"3 个篮子"：日常支出 / 储蓄 / 自由额度。
明确每月家务分工时间表，避免"理所当然"的分配。

## 7. 冲突处理建议
- 任何一方说出"我需要 30 分钟冷静"时，另一方不追问。
- 同一个议题两次讨论无法对齐时，引入"延迟一周再谈"机制。

## 8. 适合共同推进的事项
- 共同学习一个技能（每周 1 次，3 个月一轮）
- 共同规划一次 3–5 天的短旅行

## 9. 需要提前沟通的问题
- 父母赡养与节假日安排
- 是否要孩子 / 时点偏好
- 重大职业变动时的家庭支持机制

## 10. 备注
关系是动态的，没有"必合"或"必分"。本报告以沟通建议为核心，请勿作为感情存续的唯一依据。
`.trim();
}

// ----------------- 风水基础 -----------------
function mockFengshuiBasic(r: Record<string, unknown>): string {
  const orientation = (r["orientationNote"] as string) ?? "—";
  const layout = (r["layoutNote"] as string) ?? "—";
  const rooms = (r["perRoom"] as Array<{ name: string; traditionalView: string; practicalView: string; suggestions: string[] }>) ?? [];
  const zero = ((r["improvementsZeroBudget"] as string[]) ?? []).slice(0, 3).map(s => `- ${s}`).join("\n");
  return `
# 住宅基础参考报告

## 1. 房屋摘要
${orientation}
${layout}

## 2. 整体空间判断
建议从「采光、通风、动线、整洁度、噪音、隐私、心理舒适度」7 个维度逐一审视。

## 3. 关键空间
${rooms.map(r2 => `### ${r2.name}\n- 传统：${r2.traditionalView}\n- 现实：${r2.practicalView}\n- 建议：${r2.suggestions.join("；")}`).join("\n\n") || "（未输入房间信息）"}

## 4. 0 元调整建议
${zero || "- 整理玄关与客厅 30 分钟\n- 调整沙发/床朝向使其「背有依靠」\n- 夜间增加暖色辅光"}
`.trim();
}

// ----------------- 风水深度 -----------------
function mockFengshuiDeep(r: Record<string, unknown>): string {
  const basic = mockFengshuiBasic(r);
  const low = ((r["improvementsLowBudget"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  const mid = ((r["improvementsMediumBudget"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  return basic + `

## 5. 300 元内优化方案
${low || "- 暂无具体建议"}

## 6. 1000 元内优化方案
${mid || "- 暂无具体建议"}

## 7. 提示
所有建议以"提升空间秩序、采光、通风、心理舒适度"为目标，不承诺"发财、转运"。
`.trim();
}

// ----------------- 择日 -----------------
function mockDateSelection(r: Record<string, unknown>): string {
  const recommended = (r["recommended"] as Array<{ date: string; ganzhiDay: string; zodiacOfDay: string; score: number; reasons: string[] }>) ?? [];
  const notRec = (r["notRecommended"] as Array<{ date: string; cautions: string[] }>) ?? [];
  const prep = ((r["preparationChecklist"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  return `
# 民俗择日参考报告

## 1. 推荐日期
${recommended.map(c => `- **${c.date}**（${c.ganzhiDay}日 / ${c.zodiacOfDay}日，评分 ${c.score}）：${c.reasons.join("；") || "—"}`).join("\n") || "- 当前区间内无强推荐日期，建议适度扩大查询范围。"}

## 2. 不建议日期
${notRec.map(c => `- ${c.date}：${c.cautions.join("；") || "—"}`).join("\n") || "- 暂无明显不推荐日期。"}

## 3. 现实准备清单
${prep}

## 4. 注意事项
本结果为「民俗参考」，不作为该事项的唯一决策依据。请综合考虑家庭、合同、签证、天气、节假日等现实条件。
`.trim();
}

// ----------------- 黄历短文 -----------------
function mockAlmanacNote(r: Record<string, unknown>): string {
  const oneLine = (r["oneLine"] as string) ?? "心安即吉日。";
  return `### 今日一句\n\n> ${oneLine}\n`;
}
