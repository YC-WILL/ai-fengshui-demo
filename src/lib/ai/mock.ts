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
  const core = (r["friendlyCoreConclusion"] as string) ?? "这位朋友，你的这份结果更适合当作一面观察自己的小镜子，不必急着给自己下结论。";
  const elementNote = (r["friendlyElementNote"] as string) ?? "这位朋友，五行只是传统文化里的观察线索，结合自己的真实经历来看就好。";
  const profile = (r["personalityProfile"] as string) ?? "暂无足够信息生成性格画像。";
  const reminders = ((r["lifeReminders"] as string[]) ?? []).map(item => `- ${item}`).join("\n");
  const suggestions = ((r["lifeSuggestions"] as string[]) ?? []).map(item => `- ${item}`).join("\n");
  const pillars = (r["pillars"] as Record<string, string>) ?? {};
  return `
# 八字基础参考

## 1. 这位朋友，先说说整体印象
${core}

## 2. 这位朋友，看看五行的小提示
四柱参考：年 ${pillars.year ?? "—"} · 月 ${pillars.month ?? "—"} · 日 ${pillars.day ?? "—"} · 时 ${pillars.hour ?? "—"}
${elementNote}

## 3. 这位朋友，来看看你的性格画像
${profile}

## 4. 这位朋友，有两件事想提醒你
${reminders || "- 忙的时候也给自己留一点停顿，先看清真正重要的事。\n- 这些描述只是参考，请以自己的真实感受和经历为准。"}

## 5. 这位朋友，给你三句小建议
${suggestions || "- 结合近期真实经历，选择一个最想调整的行为，从小步骤开始观察。"}

## 6. 这位朋友，最后说一句
> 本报告为基础版，仅供传统文化体验、自我观察与生活规划参考，不构成医疗、心理、法律或投资等专业建议。
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
  const suggestions = ((r["suggestions"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  return `
# 关系基础参考报告

## 1. 两位朋友，先说说你们相处的感觉
你们更像两个并肩走路的人：有些时候步子自然合在一起，有些时候也需要等一等、问一句。关系没有固定答案，真正让人走得长久的，是愿意听见彼此，也愿意一起调整。

## 2. 两位朋友，看看你们各自的步调
甲方：日主 ${a.dayMaster ?? "—"}　生肖 ${a.zodiac ?? "—"}
乙方：日主 ${b.dayMaster ?? "—"}　生肖 ${b.zodiac ?? "—"}
${style}

## 3. 两位朋友，你们合拍的地方
${strengths || "- 共同价值观可后续观察补充"}

## 4. 两位朋友，有些不同也值得听见
${friction || "- 暂未发现明显结构性张力"}

## 5. 两位朋友，给你们三句相处建议
${suggestions || "- 每周留十分钟，只聊近来的感受，不急着解决问题。\n- 重要决定先听完彼此的顾虑，再一起定时间。\n- 情绪上来时先暂停，约好什么时候继续谈。"}

## 6. 两位朋友，最后说一句
> 这份内容只提供传统文化与沟通视角的参考，不判断你们是否适合，也不能替代专业的伴侣或心理咨询。
`.trim();
}

// ----------------- 关系深度 -----------------
function mockMarriageDeep(r: Record<string, unknown>): string {
  const basic = mockMarriageBasic(r);
  return basic + `

## 7. 两位朋友，聊聊金钱与家庭责任
建议在共同账目上引入"3 个篮子"：日常支出 / 储蓄 / 自由额度。
明确每月家务分工时间表，避免"理所当然"的分配。

## 8. 两位朋友，意见不同时可以这样做
- 任何一方说出"我需要 30 分钟冷静"时，另一方不追问。
- 同一个议题两次讨论无法对齐时，引入"延迟一周再谈"机制。

## 9. 两位朋友，适合一起做的几件事
- 共同学习一个技能（每周 1 次，3 个月一轮）
- 共同规划一次 3–5 天的短旅行

## 10. 两位朋友，有些重要问题可以提前谈
- 父母赡养与节假日安排
- 是否要孩子 / 时点偏好
- 重大职业变动时的家庭支持机制

## 11. 两位朋友，最后再叮嘱一句
关系会随着相处慢慢变化，这份内容只提供沟通线索，不替你们判断关系结果。
`.trim();
}

// ----------------- 风水基础 -----------------
function mockFengshuiBasic(r: Record<string, unknown>): string {
  const orientation = (r["orientationNote"] as string) ?? "—";
  const layout = (r["layoutNote"] as string) ?? "—";
  const rooms = (r["perRoom"] as Array<{ name: string; traditionalView: string; practicalView: string; suggestions: string[] }>) ?? [];
  const zero = ((r["improvementsZeroBudget"] as string[]) ?? []).slice(0, 3).map(s => `- ${s}`).join("\n");
  const warnings = ((r["warnings"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  return `
# 这位朋友，我们一起看看这个家

## 1. 先说说这个家的整体感觉
家像一个每天接住你的容器。先让光线、空气和走动的路线舒展开，再谈传统上的讲究，住起来往往会更安稳。

## 2. 我们从门口慢慢走一圈
${orientation}
${layout}

## 3. 逐个看看你在意的空间
${rooms.map(r2 => `### 先看看${r2.name}\n传统上，${r2.traditionalView}\n回到日常生活，${r2.practicalView}\n你可以先试试：${r2.suggestions.join("；")}`).join("\n\n") || "（未输入房间信息）"}

## 4. 有几处想轻轻提醒你
${warnings || "- 若没有明显的潮湿、霉味、噪音或动线阻挡，不必为了传统说法做大改动。"}

## 5. 不花钱也可以先做这三件事
${zero || "- 整理玄关与客厅 30 分钟\n- 调整沙发/床朝向使其「背有依靠」\n- 夜间增加暖色辅光"}

## 6. 最后说一句
> 这份内容只提供传统文化与居住体验参考，不承诺发财、转运或化煞效果；涉及漏水、电路、燃气和结构安全，请咨询专业人员。
`.trim();
}

// ----------------- 风水深度 -----------------
function mockFengshuiDeep(r: Record<string, unknown>): string {
  const basic = mockFengshuiBasic(r).replace(
    "# 这位朋友，我们一起看看这个家",
    "# 这位朋友，我们把这个家细细走一遍"
  );
  const low = ((r["improvementsLowBudget"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  const mid = ((r["improvementsMediumBudget"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  return basic + `

## 7. 三百元以内可以添些什么
${low || "- 暂无具体建议"}

## 8. 一千元以内怎样排优先级
${mid || "- 暂无具体建议"}

## 9. 调整后慢慢住一阵再看
所有建议以"提升空间秩序、采光、通风、心理舒适度"为目标，不承诺"发财、转运"。
`.trim();
}

// ----------------- 择日 -----------------
function mockDateSelection(r: Record<string, unknown>): string {
  const recommended = (r["recommended"] as Array<{ date: string; ganzhiDay: string; zodiacOfDay: string; score: number; reasons: string[] }>) ?? [];
  const notRec = (r["notRecommended"] as Array<{ date: string; cautions: string[] }>) ?? [];
  const prep = ((r["preparationChecklist"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  const firstDate = recommended[0]?.date;
  const sayNaturally = (text: string) => text
    .replace("当日日干与本人日干同元素，节奏相对一致。", "当天与你熟悉的做事节奏比较接近。")
    .replace("本人日干生当日日干，做事相对顺势。", "从传统角度看，当天做事较容易顺着节奏展开。")
    .replace("当日日干生本人日干，能量偏支援。", "从传统角度看，当天较适合借助他人和已有条件推进。")
    .replace("本人日干克当日日干，传统视角下偏耗，需更细致准备。", "当天可能更费精力，若要安排重要事情，准备不妨细一点。")
    .replace("当日日干克本人日干，传统视角下偏受阻，重要事项请预留缓冲。", "当天推进事情可能不够从容，重要安排记得多留缓冲。")
    .replace("当日地支与本人年支相冲，传统视角下不宜大事，可视情况微调或避开。", "传统上认为当天与你的节奏稍有冲突，可以优先看看其他日期。")
    .replace("周末签约需确认对方主体在岗，避免拖延。", "若在周末签约，记得先确认相关人员是否在岗。")
    .replace("周末时段宾客出席率更高，现实层面更合适。", "周末通常更方便亲友到场，现实安排也更从容。");
  return `
# 民俗择日参考报告

## 1. 这位朋友，先说说这段日子
以下为民俗参考，不作为这件事的唯一决策依据。${firstDate ? `这段时间里，${firstDate}可以先放进备选；` : "这段时间暂时没有特别突出的选择，"}日子只是帮你安排得更从容，真正重要的仍是人、事和准备是否妥当。

## 2. 这位朋友，这是为你挑出的几个日子
${recommended.map(c => `- **${c.date}**（${c.ganzhiDay}日 / ${c.zodiacOfDay}日）：${c.reasons.map(sayNaturally).join("；") || "整体节奏较平稳，可以结合现实安排考虑。"}`).join("\n") || "- 当前区间没有特别突出的选择，可以放宽日期，或优先按人员与现实条件安排。"}

## 3. 这位朋友，有几个日子不妨绕开
${notRec.map(c => `- ${c.date}：${c.cautions.map(sayNaturally).join("；") || "当天安排可能不够从容，可以优先看看其他日期。"}`).join("\n") || "- 暂时没有特别需要绕开的日期，按现实安排选择即可。"}

## 4. 这位朋友，日子之外更要准备好这些事
${prep}

## 5. 这位朋友，临近时再确认一遍
请再看看家庭安排、合同、签证、天气、交通和节假日；若现实条件变化，换一个日子也没有关系。

## 6. 这位朋友，最后说一句
> 本结果为民俗参考，不作为这件事的唯一决策依据，也不能预言事情结果。准备周全、彼此方便，通常比追求一个“完美日期”更重要。
`.trim();
}

// ----------------- 黄历短文 -----------------
function mockAlmanacNote(r: Record<string, unknown>): string {
  const oneLine = (r["oneLine"] as string) ?? "心安即吉日。";
  return `### 今日一句\n\n> ${oneLine}\n`;
}
