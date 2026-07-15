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
    case "date_selection_basic":
      return mockDateSelection(r, false);
    case "date_selection":
      return mockDateSelection(r, true);
    case "daily_almanac":
      return mockAlmanacNote(r);
    default:
      return `（mock 报告 · ${reportType} · tier=${tier}）\n\n暂无对应模板。`;
  }
}

// ----------------- 八字基础 -----------------
function mockBaziBasic(r: Record<string, unknown>): string {
  const core = (r["friendlyCoreConclusion"] as string) ?? "你的这份结果更适合当作一面观察自己的小镜子，不必急着给自己下结论。";
  const elementNote = (r["friendlyElementNote"] as string) ?? "五行只是传统文化里的观察线索，结合自己的真实经历来看就好。";
  const profile = (r["personalityProfile"] as string) ?? "暂无足够信息生成性格画像。";
  const reminders = ((r["lifeReminders"] as string[]) ?? []).map(item => `- ${item}`).join("\n");
  const suggestions = ((r["lifeSuggestions"] as string[]) ?? []).map(item => `- ${item}`).join("\n");
  const pillars = (r["pillars"] as Record<string, string>) ?? {};
  return `
# 这位朋友，我们聊聊你的性格与步调

## 1. 先说说整体印象
${core}

## 2. 看看五行的小提示
四柱参考：年 ${pillars.year ?? "—"} · 月 ${pillars.month ?? "—"} · 日 ${pillars.day ?? "—"} · 时 ${pillars.hour ?? "—"}
${elementNote}

## 3. 来看看你的性格画像
${profile}

## 4. 有两件事想提醒你
${reminders || "- 忙的时候也给自己留一点停顿，先看清真正重要的事。\n- 这些描述只是参考，请以自己的真实感受和经历为准。"}

## 5. 给你三句小建议
${suggestions || "- 结合近期真实经历，选择一个最想调整的行为，从小步骤开始观察。"}

## 6. 最后说一句
> 本报告为基础版，仅供传统文化体验、自我观察与生活规划参考，不构成医疗、心理、法律或投资等专业建议。
`.trim();
}

// ----------------- 八字深度 -----------------
function mockBaziDeep(r: Record<string, unknown>): string {
  const dm = (r["dayMaster"] as string) ?? "未知";
  const zodiac = (r["zodiac"] as string) ?? "—";
  const ele = (r["elementSummary"] as string) ?? "—";
  const core = (r["friendlyCoreConclusion"] as string) ?? "这份内容适合当作整理生活节奏的参考。";
  const profile = (r["personalityProfile"] as string) ?? "你可以结合自己的真实经历，慢慢辨认哪些描述更贴近自己。";
  const strongest = (r["elementStrongest"] as string) ?? "土";
  const weakest = (r["elementWeakest"] as string) ?? "水";
  const lifeSuggestions = (r["lifeSuggestions"] as string[]) ?? [];
  const sceneByElement: Record<string, { work: string; relation: string; rhythm: string }> = {
    木: { work: "需要持续生长、能逐步搭建方法的事情", relation: "把尚未成形的想法早点说出来", rhythm: "每月留一次学习或尝试新事物的时间" },
    火: { work: "需要表达、带动气氛和快速启动的事情", relation: "热情之外也给彼此留一点缓冲", rhythm: "把高投入的日子与安静恢复的日子交替安排" },
    土: { work: "需要耐心承接、把复杂事情稳稳落地的事情", relation: "别只顾着承担，也要及时说出自己的需要", rhythm: "每周整理一次待办，留下真正重要的三件事" },
    金: { work: "需要判断、整理边界和提高完成度的事情", relation: "原则说清楚以后，也给变化留一点空间", rhythm: "在重要决定前留出一段不被打扰的复盘时间" },
    水: { work: "需要观察、连接信息和灵活调整的事情", relation: "感受不必都放在心里，可以从一件小事慢慢说起", rhythm: "在连续忙碌之后安排明确的独处和恢复时间" }
  };
  const strongScene = sceneByElement[strongest] ?? sceneByElement.土;
  const weakScene = sceneByElement[weakest] ?? sceneByElement.水;
  const pillars = (r["pillars"] as Record<string, string>) ?? {};
  return `
# 这位朋友，我们把你的生活节奏细细看一遍

## 1. 用户信息摘要
日主：**${dm}**　生肖：**${zodiac}**
四柱：年 ${pillars.year}　月 ${pillars.month}　日 ${pillars.day}　时 ${pillars.hour ?? "—"}

## 2. 四柱与五行结构
${ele}。${core}

## 3. 性格与行为倾向
${profile}

## 4. 事业与学习方向
从你较突出的${strongest}元素来看，你可能更容易在${strongScene.work}里找到自己的步调。相对弱的${weakest}也提醒你：选择不只看“能不能做好”，还要看长期做下去是否有恢复的余地。
**可执行建议**：
- ${lifeSuggestions[0] ?? strongScene.rhythm}。
- ${lifeSuggestions[1] ?? `找一位信任的人，从旁给你一次关于${weakest}节奏的反馈`}。

## 5. 财富习惯与风险偏好
财富习惯倾向稳健。
**注意**：
- 不要把所有积蓄放进单一品类。
- 在大额支出（>3 个月生活费）前与至少一位信任的朋友/家人讨论。
- 涉及具体投资请咨询持牌专业人士，本报告不构成任何投资建议。

## 6. 情感关系模式
关系里可以留意${weakScene.relation}。这不是性格定论，而是提醒你：越熟悉的关系，越值得把期待说得具体一些。
**建议**：${lifeSuggestions[2] ?? "选一件最近的小事，用“我希望……”代替让对方猜测"}。

## 7. 年度生活节奏参考
未来 12 个月，建议把重心放在：1) 巩固已有积累；2) 启动 1 个长周期小项目；3) 每季度 1 次健康复盘。

## 8. 可执行行动建议
${lifeSuggestions.slice(0, 3).map(item => `- ${item}`).join("\n") || `- ${strongScene.rhythm}。\n- ${weakScene.rhythm}。\n- 每月回看一次这些调整是否真的让生活更舒服。`}

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
  const relation = (r["dayMasterRelation"] as { kind?: string }) ?? {};
  const openingByRelation: Record<string, string> = {
    same: "你们像走在相近步速上的两个人，很多时候不用多解释就能跟上彼此。也正因为太熟悉这种节奏，遇到新问题时，不妨有意听听那个不一样的想法。",
    sheng: "你们像一场自然的接力，一方常会顺手多扶一把，另一方也容易接住这份好意。走得久了，记得让付出被看见、让回应说出口，关系会更轻松。",
    ke: "你们像两种不同拍子的音乐，放在一起会有张力，也可能碰出新的办法。不同不等于不好，关键是声音变大之前，能不能先听清彼此真正介意什么。"
  };
  const opening = openingByRelation[relation.kind ?? ""] ?? "你们像两个并肩走路的人，有时步子自然合在一起，有时也需要停下来问一句。关系没有固定答案，愿意听见彼此、一起调整，比任何标签都重要。";
  return `
# 两位朋友，我们看看彼此相处的步调

## 1. 先说说你们相处的感觉
${opening}

## 2. 看看你们各自的步调
甲方：日主 ${a.dayMaster ?? "—"}　生肖 ${a.zodiac ?? "—"}
乙方：日主 ${b.dayMaster ?? "—"}　生肖 ${b.zodiac ?? "—"}
${style}

## 3. 你们合拍的地方
${strengths || "- 共同价值观可后续观察补充"}

## 4. 有些不同也值得听见
${friction || "- 暂未发现明显结构性张力"}

## 5. 给你们三句相处建议
${suggestions || "- 每周留十分钟，只聊近来的感受，不急着解决问题。\n- 重要决定先听完彼此的顾虑，再一起定时间。\n- 情绪上来时先暂停，约好什么时候继续谈。"}

## 6. 最后说一句
> 这份内容只提供传统文化与沟通视角的参考，不判断你们是否适合，也不能替代专业的伴侣或心理咨询。
`.trim();
}

// ----------------- 关系深度 -----------------
function mockMarriageDeep(r: Record<string, unknown>): string {
  const basic = mockMarriageBasic(r).replace(
    "# 两位朋友，我们看看彼此相处的步调",
    "# 两位朋友，我们把这段相处慢慢聊开"
  );
  const relation = (r["dayMasterRelation"] as { kind?: string }) ?? {};
  const responsibility = relation.kind === "sheng"
    ? "先说清哪些付出是自愿、哪些事情需要轮流承担，避免照顾久了变成默认责任。"
    : relation.kind === "ke"
      ? "先约好哪些支出和家庭安排必须共同决定，别在分歧最热的时候临时定规则。"
      : "分工时有意交换一次角色，能帮助你们看见彼此平时容易忽略的辛苦。";
  return basic + `

## 7. 聊聊金钱与家庭责任
建议在共同账目上引入"3 个篮子"：日常支出 / 储蓄 / 自由额度。
${responsibility}

## 8. 意见不同时可以这样做
- 任何一方说出"我需要 30 分钟冷静"时，另一方不追问。
- 同一个议题两次讨论无法对齐时，引入"延迟一周再谈"机制。

## 9. 适合一起做的几件事
- 共同学习一个技能（每周 1 次，3 个月一轮）
- 共同规划一次 3–5 天的短旅行

## 10. 有些重要问题可以提前谈
- 父母赡养与节假日安排
- 是否要孩子 / 时点偏好
- 重大职业变动时的家庭支持机制

## 11. 最后再叮嘱一句
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
  const focus = (r["focus"] as { label?: string; summary?: string }) ?? {};
  return `
# 这位朋友，我们一起看看这个家

## 1. 先说说这个家的整体感觉
${focus.summary ?? "家像一个每天接住你的容器。先让光线、空气和走动的路线舒展开，再谈传统上的讲究，住起来往往会更安稳。"}

## 2. 我们从门口慢慢走一圈
${orientation}
${layout}

## 3. 逐个看看你在意的空间
${rooms.map(r2 => `### 先看看${r2.name}\n传统上，${r2.traditionalView}\n回到日常生活，${r2.practicalView}\n你可以先试试：${r2.suggestions.join("；")}`).join("\n\n") || "（未输入房间信息）"}

## 4. 关于${focus.label ?? "日常居住"}，有几处想轻轻提醒你
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
function mockDateSelection(r: Record<string, unknown>, deep: boolean): string {
  const recommended = (r["recommended"] as Array<{ date: string; ganzhiDay: string; zodiacOfDay: string; score: number; reasons: string[] }>) ?? [];
  const notRec = (r["notRecommended"] as Array<{ date: string; cautions: string[] }>) ?? [];
  const prep = ((r["preparationChecklist"] as string[]) ?? []).map(s => `- ${s}`).join("\n");
  const firstDate = recommended[0]?.date;
  const event = (r["event"] as string) ?? "";
  const eventLabel = (r["eventLabel"] as string) ?? "这件事";
  const openingByEvent: Record<string, string> = {
    wedding: "选婚礼日子，先照顾两家人的方便与当天流程是否从容，再把民俗偏好放进来一起权衡。",
    moving: "搬家的日子不只看日期，也要看搬运、水电、天气和新居是否准备妥当。",
    opening: "开业更像一场多人配合的开场，人员、手续和设备顺畅，比追求一个“完美日期”更重要。",
    signing: "签约真正要守住的是条款清楚、双方在场和留有核对时间，日子只帮你把节奏安排得从容些。",
    travel: "出行先看天气、交通与同行人的状态，选日只是帮你避开太赶、太挤的安排。",
    renovation_start: "动工前先让施工、材料与邻里沟通都落稳，选一个大家能从容开始的日子就很好。"
  };
  const eventOpening = openingByEvent[event] ?? `安排${eventLabel}，先把现实准备放稳，再从民俗角度挑一个更从容的日子。`;
  const sayNaturally = (text: string) => text
    .replace("当日日干与本人日干同元素，节奏相对一致。", "当天与你熟悉的做事节奏比较接近。")
    .replace("本人日干生当日日干，做事相对顺势。", "从传统角度看，当天做事较容易顺着节奏展开。")
    .replace("当日日干生本人日干，能量偏支援。", "从传统角度看，当天较适合借助他人和已有条件推进。")
    .replace("本人日干克当日日干，传统视角下偏耗，需更细致准备。", "当天可能更费精力，若要安排重要事情，准备不妨细一点。")
    .replace("当日日干克本人日干，传统视角下偏受阻，重要事项请预留缓冲。", "当天推进事情可能不够从容，重要安排记得多留缓冲。")
    .replace("当日地支与本人年支相冲，传统视角下不宜大事，可视情况微调或避开。", "传统上认为当天与你的节奏稍有冲突，可以优先看看其他日期。")
    .replace("周末签约需确认对方主体在岗，避免拖延。", "若在周末签约，记得先确认相关人员是否在岗。")
    .replace("周末时段宾客出席率更高，现实层面更合适。", "周末通常更方便亲友到场，现实安排也更从容。");
  const selectedDates = deep ? recommended : recommended.slice(0, 2);
  const selectedPrep = deep
    ? prep
    : ((r["preparationChecklist"] as string[]) ?? []).slice(0, 3).map(s => `- ${s}`).join("\n");
  const title = deep
    ? "# 这位朋友，我们把这段日子细细挑一遍"
    : "# 这位朋友，先挑个从容的日子";
  const common = `
${title}

## 1. 先说说这段日子
以下为民俗参考，不作为${eventLabel}的唯一决策依据。${eventOpening}${firstDate ? `这段时间里，${firstDate}可以先放进备选；` : "这段时间暂时没有特别突出的选择，"}真正重要的仍是人、事和准备是否妥当。

## 2. 这是为你挑出的几个日子
${selectedDates.map(c => `- **${c.date}**（${c.ganzhiDay}日 / ${c.zodiacOfDay}日）：${c.reasons.map(sayNaturally).join("；") || "整体节奏较平稳，可以结合现实安排考虑。"}`).join("\n") || "- 当前区间没有特别突出的选择，可以放宽日期，或优先按人员与现实条件安排。"}
`.trim();

  if (!deep) {
    return `${common}

## 3. 日子之外，先准备好这三件事
${selectedPrep || "- 确认同行或参与人员的时间\n- 留意天气与交通\n- 给临时变化留一点余地"}

## 4. 最后说一句
> 这是每天都可以使用的免费民俗参考，不作为这件事的唯一决策依据。准备周全、彼此方便，往往比追求一个“完美日期”更重要。`;
  }

  return `${common}

## 3. 有几个日子不妨绕开
${notRec.map(c => `- ${c.date}：${c.cautions.map(sayNaturally).join("；") || "当天安排可能不够从容，可以优先看看其他日期。"}`).join("\n") || "- 暂时没有特别需要绕开的日期，按现实安排选择即可。"}

## 4. 日子之外更要准备好这些事
${selectedPrep}

## 5. 临近时再确认一遍
请再看看家庭安排、合同、签证、天气、交通和节假日；若现实条件变化，换一个日子也没有关系。

## 6. 最后说一句
> 本结果为民俗参考，不作为这件事的唯一决策依据，也不能预言事情结果。准备周全、彼此方便，通常比追求一个“完美日期”更重要。
`;
}

// ----------------- 黄历短文 -----------------
function mockAlmanacNote(r: Record<string, unknown>): string {
  const oneLine = (r["oneLine"] as string) ?? "心安即吉日。";
  return `### 今日一句\n\n> ${oneLine}\n`;
}
