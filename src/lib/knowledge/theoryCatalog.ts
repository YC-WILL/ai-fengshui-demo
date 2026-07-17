import type { ReportType } from "../types";

export type TheoryCard = {
  id: string;
  module: "self" | "relationship" | "home" | "date";
  psychology: string;
  fengshui: string;
  mechanism: string;
  whenToUse: string[];
  allowed: string;
  forbidden: string;
  action: string;
  review: string;
};

/**
 * Versioned, code-owned knowledge cards. These are a reasoning guardrail for
 * the model, not a claim that traditional Feng Shui concepts are scientific
 * evidence. Database persistence is intentionally deferred until the catalog
 * has been reviewed in real reports.
 */
export const THEORY_CATALOG_VERSION = "2026-07-18.v1";

export const THEORY_CATALOG: readonly TheoryCard[] = [
  {
    id: "self-abc-wood",
    module: "self",
    psychology: "认知行为模型 ABC",
    fengshui: "阴阳平衡与五行节奏",
    mechanism: "把用户的事实、解释、情绪和行动分开；传统节奏只作为观察角度，不作为命定结论。",
    whenToUse: ["失败", "被拒", "怀疑自己", "焦虑", "低落", "拖延"],
    allowed: "可说一次结果不等于能力结论，并邀请用户观察下一步行为。",
    forbidden: "不得诊断心理疾病，不得说命中注定或不适合某条人生道路。",
    action: "记录一件事实、一个自动想法和一个可验证的小动作。",
    review: "七天后比较事实记录、情绪强度和行动完成次数。"
  },
  {
    id: "self-woop-season",
    module: "self",
    psychology: "WOOP 与执行意图",
    fengshui: "节气、顺时与动静安排",
    mechanism: "把愿望放进具体时间、地点和触发条件，避免把传统时令写成结果保证。",
    whenToUse: ["方向", "目标", "学习", "转行", "准备", "习惯"],
    allowed: "建议先做低风险小实验，再依据结果调整。",
    forbidden: "不得承诺某个时辰或方位会带来成功。",
    action: "写下一个目标、一个障碍和‘如果发生 X，就做 Y’。",
    review: "在约定日期检查是否完成，以及障碍是否真的出现。"
  },
  {
    id: "self-safety-space",
    module: "self",
    psychology: "自我决定理论",
    fengshui: "藏风聚气与安顿感",
    mechanism: "把自主感、胜任感、连接感和可休息的环境联系起来。",
    whenToUse: ["没劲", "无味", "孤独", "压力", "失去动力"],
    allowed: "优先恢复一项可控的小行动和一处稳定的休息位置。",
    forbidden: "不得把情绪低落直接归因为风水不好。",
    action: "选择一个 20 分钟内能完成、且由用户自己决定的行动。",
    review: "记录行动后的精力、掌控感和与他人的连接感。"
  },
  {
    id: "relationship-oars-flow",
    module: "relationship",
    psychology: "动机式访谈 OARS 与非暴力沟通",
    fengshui: "阴阳互补与空间分区",
    mechanism: "将‘相生相克’翻译为表达顺序、倾听方式和边界安排。",
    whenToUse: ["争执", "沟通", "钱", "父母", "家务", "婚期", "冷战"],
    allowed: "描述互动循环和双方需要，不评判谁更适合这段关系。",
    forbidden: "不得使用正缘、孽缘、克夫、克妻、必合或必分。",
    action: "一人先说事实和需要，另一人先复述，再提出一个具体请求。",
    review: "记录一次谈话是否完成复述、请求和下一步确认。"
  },
  {
    id: "relationship-attachment-boundary",
    module: "relationship",
    psychology: "依恋互动与边界理论",
    fengshui: "门窗、卧室与内外边界",
    mechanism: "把追问、退缩和防御理解为互动循环，不给个人贴固定标签。",
    whenToUse: ["不安", "回避", "追问", "隐私", "家人介入", "安全感"],
    allowed: "使用‘当……时，可能会……’描述可观察行为。",
    forbidden: "不得断言某人属于某种依恋类型或存在心理问题。",
    action: "为一个敏感议题约定时长、顺序和暂停后的重新开始时间。",
    review: "复盘是否减少重复追问，是否更清楚表达边界。"
  },
  {
    id: "relationship-decision",
    module: "relationship",
    psychology: "协商决策与公平感",
    fengshui: "中宫、主次与共同空间",
    mechanism: "把‘平衡’落到责任、金钱、时间和家庭决定的分配。",
    whenToUse: ["储蓄", "收入", "分工", "搬家", "婚礼", "共同计划"],
    allowed: "提供可比较的选项、底线和复盘日期。",
    forbidden: "不得用命理结构替代双方真实协商。",
    action: "各自写出一项底线、一项偏好和一个可让步点。",
    review: "一周后确认约定是否执行，必要时调整分工。"
  },
  {
    id: "home-comfort",
    module: "home",
    psychology: "环境心理学与人—环境匹配",
    fengshui: "藏风聚气、明堂开阔",
    mechanism: "把‘气’翻译为温湿度、空气、光线、噪音和空间舒适度。",
    whenToUse: ["潮湿", "霉", "噪音", "西晒", "通风", "采光"],
    allowed: "只根据用户提供的信息判断，未提供的条件必须建议观察。",
    forbidden: "不得仅凭朝向或户型断言通风、采光或财运。",
    action: "在指定时段记录温度、噪音、眩光或异味，再决定调整顺序。",
    review: "比较调整前后的睡眠、专注和居住舒适度。"
  },
  {
    id: "home-affordance",
    module: "home",
    psychology: "行为可供性、认知负荷与隐私调节",
    fengshui: "动线、背后有靠与门冲",
    mechanism: "把顺不顺眼、有没有靠翻译为走动成本、视觉干扰和安全感。",
    whenToUse: ["收纳", "动线", "分心", "睡眠", "隐私", "座位"],
    allowed: "建议移动具体物件并设置观察周期。",
    forbidden: "不得宣称摆放物品可以化煞、转运或保证发财。",
    action: "只调整一个高频区域，减少一次绕行或一个视觉干扰源。",
    review: "三天后询问使用次数、寻找时间和分心次数是否变化。"
  },
  {
    id: "home-restoration",
    module: "home",
    psychology: "注意力恢复与恢复性环境",
    fengshui: "阴阳动静与卧室安定",
    mechanism: "把‘静’落到光线、声音、屏幕和休息边界。",
    whenToUse: ["睡眠", "疲劳", "卧室", "学习", "恢复"],
    allowed: "优先给出零成本或低成本的空间试验。",
    forbidden: "不得把失眠或情绪问题诊断为住宅风水问题。",
    action: "连续三晚固定一个休息时段，减少一项刺激并记录入睡感受。",
    review: "比较入睡时间、夜间醒来和第二天精力。"
  },
  {
    id: "date-constraints",
    module: "date",
    psychology: "约束满足与决策科学",
    fengshui: "择日宜忌、冲煞与节气",
    mechanism: "现实硬限制优先，民俗日期只用于候选排序和仪式感。",
    whenToUse: ["搬家", "签约", "婚礼", "开业", "出行", "装修"],
    allowed: "先筛选人员、场地、预算、交通和天气等可执行条件。",
    forbidden: "不得说错过某日会发生坏结果。",
    action: "列出硬限制、偏好条件和两个备用方案。",
    review: "在事件前再次确认人员、文件、交通和场地状态。"
  },
  {
    id: "date-intention",
    module: "date",
    psychology: "时间锚定与执行意图",
    fengshui: "吉时与仪式性时间",
    mechanism: "把选定日期变成准备节奏和行动承诺，不承诺结果。",
    whenToUse: ["准备", "倒计时", "签约", "搬家", "开工"],
    allowed: "给出倒排清单和临近时的确认节点。",
    forbidden: "不得把吉时写成成功保证。",
    action: "为事件设置 T-7、T-3、T-1 三个准备节点。",
    review: "事件后记录哪些准备真正降低了临场压力。"
  },
  {
    id: "date-ritual",
    module: "date",
    psychology: "仪式感与承诺机制",
    fengshui: "顺时、纳吉等民俗象征",
    mechanism: "仪式可以帮助集中注意力和确认共同意愿，但不改变客观结果。",
    whenToUse: ["婚礼", "开业", "搬家", "签约", "重要开始"],
    allowed: "把仪式转成一句共同确认和一个实际准备动作。",
    forbidden: "不得暗示不做仪式就会不顺。",
    action: "在开始前用一分钟确认目标、分工和第一步。",
    review: "事后询问仪式是否帮助大家更清楚地进入状态。"
  }
];

function moduleForReport(reportType: ReportType): TheoryCard["module"] | null {
  if (reportType.startsWith("bazi")) return "self";
  if (reportType.startsWith("marriage")) return "relationship";
  if (reportType.startsWith("home_fengshui")) return "home";
  if (reportType.startsWith("date_selection")) return "date";
  return null;
}

export function selectTheoryCards(reportType: ReportType, ruleResult: unknown, limit = 3): TheoryCard[] {
  const module = moduleForReport(reportType);
  if (!module) return [];
  const text = JSON.stringify(ruleResult ?? "");
  const cards = THEORY_CATALOG.filter(card => card.module === module);
  const scored = cards.map(card => ({
    card,
    score: card.whenToUse.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0)
  }));
  return scored
    .sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id))
    .slice(0, limit)
    .map(item => item.card);
}

export function buildTheoryGuidance(reportType: ReportType, ruleResult: unknown): string {
  const cards = selectTheoryCards(reportType, ruleResult);
  if (cards.length === 0) return "";
  return JSON.stringify({
    version: THEORY_CATALOG_VERSION,
    instruction: "心理学是行为行动参考，风水是传统文化视角；不得互相冒充科学证据。优先回应用户事实，未知信息使用条件式表达。",
    cards: cards.map(({ id, psychology, fengshui, mechanism, allowed, forbidden, action, review }) => ({
      id, psychology, fengshui, mechanism, allowed, forbidden, action, review
    }))
  }, null, 2);
}
