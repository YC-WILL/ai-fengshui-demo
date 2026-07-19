import type { ReportType } from "../types";

export type TheoryCard = {
  id: string;
  module: "self" | "relationship" | "home" | "date";
  source: string;
  topic: string;
  principle: string;
  whenToUse: string[];
  allowed: string;
  forbidden: string;
  action: string;
  review: string;
};

/**
 * 传统文化知识卡只用于提供观察角度。经典来源、后世解释和现实建议
 * 必须分开表达，不把民俗体系冒充科学证据，也不作确定性预测。
 */
export const THEORY_CATALOG_VERSION = "2026-07-20.tradition-v1";

export const THEORY_CATALOG: readonly TheoryCard[] = [
  {
    id: "yi-change-and-position",
    module: "self",
    source: "《周易·系辞》",
    topic: "变、时与位",
    principle: "卦爻辞常把处境放在变化过程与所处位置中理解；同一件事在开始、发展和收束阶段，合宜的做法可以不同。",
    whenToUse: ["变化", "转折", "方向", "选择", "开始", "停下", "进退"],
    allowed: "可以借阶段、时机和位置帮助用户看清当前处境。",
    forbidden: "不得把一次卦象写成不可改变的命运结论。",
    action: "先确认事情处于起步、推进、受阻还是收尾阶段，再谈下一步。",
    review: "后续回看处境是否已经换了阶段，原来的做法是否仍合时宜。"
  },
  {
    id: "yi-yin-yang-rhythm",
    module: "self",
    source: "《周易·系辞》",
    topic: "阴阳消长",
    principle: "阴阳表示相对、交替与消长，不等于好坏；动与静、进与退、显与藏需要结合处境，不可孤立判断。",
    whenToUse: ["忙", "累", "推进", "等待", "犹豫", "节奏", "休息"],
    allowed: "可以提醒用户辨别此刻更适合蓄力、观察还是行动。",
    forbidden: "不得把阴阳直接等同于性别、人格优劣或疾病。",
    action: "找出当前已经过盛的一端，以及需要补回的一端。",
    review: "观察调整后，事情是否从僵持转为更有余地。"
  },
  {
    id: "bagua-eight-images",
    module: "self",
    source: "《周易·说卦》",
    topic: "八卦取象",
    principle: "乾、坤、震、巽、坎、离、艮、兑以天地雷风水火山泽取象，重点在借自然现象理解不同的运行状态，而非给人贴固定标签。",
    whenToUse: ["行动", "承载", "启动", "进入", "困难", "看清", "停止", "表达"],
    allowed: "可以用一个最贴近处境的卦象作简短比喻，并说明比喻的限度。",
    forbidden: "不得凭单一卦象断定性格、职业、婚姻或未来结果。",
    action: "只选一个与当下最相关的象，转成一句可理解的提醒。",
    review: "回看这个取象是否帮助用户看清处境，而不是增加神秘感。"
  },
  {
    id: "bazi-stems-branches",
    module: "self",
    source: "《滴天髓》《三命通会》",
    topic: "四柱、干支与三元",
    principle: "四柱以年、月、日、时的干支记录出生时序；天干、地支与支中所藏共同构成传统命理的观察框架。",
    whenToUse: ["八字", "出生", "四柱", "天干", "地支", "藏干", "时辰"],
    allowed: "应先核对出生日期、时间、地点和历法换算，再说明结构。",
    forbidden: "信息不全时不得补造时柱，也不得把排盘当成人生事实。",
    action: "先标明已知资料、换算口径和仍不确定的部分。",
    review: "资料更正后重新核对四柱，避免沿用旧结论。"
  },
  {
    id: "bazi-day-master-month",
    module: "self",
    source: "《子平真诠》《滴天髓》",
    topic: "日主、月令与全局",
    principle: "子平法以日干为观察中心，并重视月令所代表的时令；判断不能只看一个字或五行数量，需连同全局生克、根气与寒暖燥湿。",
    whenToUse: ["日主", "月令", "旺", "弱", "格局", "五行", "命盘"],
    allowed: "可以说明哪种五行力量在本盘较显著，以及它在传统体系中的含义。",
    forbidden: "不得用强弱直接评价人的能力、品格或人生高低。",
    action: "按月令、日主、通根、透干和全局关系依次核对。",
    review: "检查解释是否来自完整结构，而非只凭数量或单一神煞。"
  },
  {
    id: "bazi-five-phases",
    module: "self",
    source: "传统五行生克体系",
    topic: "五行生克、制化与流通",
    principle: "木火土金水在命理中表示五类关系与运行方式；相生不必然为好，相克也不必然为坏，关键在全局是否有承接与转化。",
    whenToUse: ["木", "火", "土", "金", "水", "相生", "相克", "缺"],
    allowed: "可以用流通、受阻、偏聚等中性语言描述结构。",
    forbidden: "不得把五行缺少写成缺陷，也不得建议以消费物品保证补运。",
    action: "先看各五行之间有没有来路、承接和出口。",
    review: "确认最终表达没有把传统符号偷换成现实因果。"
  },
  {
    id: "yi-response-between-two",
    module: "relationship",
    source: "《周易》咸卦、恒卦",
    topic: "感应与长久",
    principle: "咸卦重在彼此感应，恒卦重在关系能够持续；传统取象可用来观察回应是否双向、约定是否能够长期实行。",
    whenToUse: ["关系", "回应", "相处", "长期", "承诺", "冷淡", "靠近"],
    allowed: "可以区分一时感受与长期相处条件。",
    forbidden: "不得据此判断正缘、孽缘、必合或必分。",
    action: "分别确认双方已经表达了什么、实际回应了什么。",
    review: "一段时间后回看约定是否稳定执行，而非只看当时情绪。"
  },
  {
    id: "yi-difference-and-common-ground",
    module: "relationship",
    source: "《周易》睽卦、同人卦",
    topic: "求同与存异",
    principle: "睽可用于观察分歧，同人可用于观察共同目标；关系中有不同并不自动等于破裂，有共同点也不代表所有问题已经解决。",
    whenToUse: ["分歧", "争执", "不同", "共同", "合作", "家人", "朋友"],
    allowed: "可以帮助用户分清价值冲突、方法不同和信息误会。",
    forbidden: "不得偏袒一方，也不得用卦名给任何人定性。",
    action: "先找一个共同目标，再明确一个暂时无法一致的地方。",
    review: "检查双方是否能在保留差异的同时推进共同事项。"
  },
  {
    id: "bagua-opposite-pairs",
    module: "relationship",
    source: "《周易·说卦》",
    topic: "天地、山泽、雷风、水火相对取象",
    principle: "八卦成对关系展示相反力量之间的定位、往来与制约，可用来观察一方推进时另一方如何承接，但不代表固定的人格配对。",
    whenToUse: ["配合", "互补", "节奏", "一方", "双方", "沟通", "分工"],
    allowed: "可以描述双方在具体事情中的角色与节奏差异。",
    forbidden: "不得把任何一方永久归为某一卦，也不得据此评定匹配度。",
    action: "只讨论当前事件里谁在推进、谁在承接、哪里需要换位。",
    review: "观察角色能否随场景变化，而不是长期固化。"
  },
  {
    id: "bazi-combination-clash",
    module: "relationship",
    source: "《三命通会》等子平命理传统",
    topic: "干支合冲刑害",
    principle: "合、冲、刑、害是干支关系术语，需要结合全局、位置和时令理解；合不等于感情好，冲也不等于关系坏。",
    whenToUse: ["合", "冲", "刑", "害", "八字", "两个人", "婚配"],
    allowed: "可以把结构差异转成需要进一步观察的相处议题。",
    forbidden: "不得用单一合冲预测离婚、出轨、疾病或灾祸。",
    action: "指出结构后，必须回到用户提供的真实相处情况核对。",
    review: "检查传统判断是否被现实信息支持；不支持时应撤回。"
  },
  {
    id: "fengshui-form-before-judgment",
    module: "home",
    source: "《葬书》及传统形势法",
    topic: "形势、气与止聚",
    principle: "传统风水先观察山水与形势，再谈气的行止聚散；用于现代住宅时，应先看真实建筑、周边环境与使用方式。",
    whenToUse: ["风水", "户型", "环境", "周边", "道路", "楼栋", "住宅"],
    allowed: "可以先核对外部环境、建筑条件和室内使用事实。",
    forbidden: "不得只凭一个方位或一张局部照片断定吉凶。",
    action: "按外部环境、入口、主要空间和日常使用顺序收集信息。",
    review: "补齐现场信息后再修正判断，保留未知项。"
  },
  {
    id: "fengshui-wind-water",
    module: "home",
    source: "《葬书》传统风水语汇",
    topic: "风、水与气的行止",
    principle: "传统以风与水讨论气的散聚；现代住宅表达必须先落实到通风、潮湿、漏水、异味和周边水体等可观察条件。",
    whenToUse: ["通风", "潮湿", "漏水", "异味", "水", "风", "霉"],
    allowed: "可以把传统取象与实际检查项目并列说明。",
    forbidden: "不得用聚气、散气替代漏水、霉菌或空气质量检测。",
    action: "先检查水源、湿度、风路与异味来源；涉及漏水时咨询专业人员。",
    review: "以问题是否真实改善为准，不以摆件或仪式作为验证。"
  },
  {
    id: "bagua-directions-space",
    module: "home",
    source: "《周易·说卦》及后世方位配卦传统",
    topic: "八卦方位与空间取象",
    principle: "后世常以八卦对应方位与自然之象；方位是传统观察层，不能越过采光、通风、结构、消防与实际用途。",
    whenToUse: ["方位", "朝向", "东", "西", "南", "北", "八卦"],
    allowed: "可以说明采用的是哪套方位体系，并把它标为民俗参考。",
    forbidden: "不得混用先天、后天方位，也不得凭方位承诺财运或健康。",
    action: "先确认坐向测量方法、房屋用途与现实环境，再谈取象。",
    review: "复核方位是否测准，建议是否仍符合真实使用需求。"
  },
  {
    id: "fengshui-yin-yang-space",
    module: "home",
    source: "传统阴阳与动静观",
    topic: "明暗、动静与内外",
    principle: "住宅中的阴阳可用来描述明暗、动静、开合与内外层次；它是相对关系，不是越亮、越静或越封闭越好。",
    whenToUse: ["采光", "卧室", "客厅", "安静", "吵", "隐私", "门窗"],
    allowed: "可以结合房间用途讨论光线、声音和开放程度。",
    forbidden: "不得把昏暗、噪音或睡眠问题直接归结为阴气、煞气。",
    action: "按空间用途检查光、声、视线和开合是否匹配。",
    review: "调整后观察使用是否更方便舒适，并根据季节再次检查。"
  },
  {
    id: "fengshui-entry-and-flow",
    module: "home",
    source: "传统阳宅的门、路与内外观",
    topic: "入口、动线与纳气",
    principle: "传统重视门与道路的来去；现代住宅首先应理解为入口是否安全清楚、通行是否顺畅、是否阻挡疏散。",
    whenToUse: ["门", "玄关", "动线", "走道", "收纳", "拥堵", "遮挡"],
    allowed: "可以提出低成本、可逆的通行和收纳调整。",
    forbidden: "不得为了所谓化煞阻挡消防通道、门窗或逃生路线。",
    action: "清理一个最高频的入口或走道，并保留必要通行宽度。",
    review: "观察一周内是否减少绕行、碰撞和临时堆放。"
  },
  {
    id: "yi-act-in-time",
    module: "date",
    source: "《周易·彖传》《系辞》",
    topic: "时义、时用与变通",
    principle: "《易》重视随时而变、因位而行；择日不是脱离现实寻找完美日期，而是在可行范围内选择准备更充分的时点。",
    whenToUse: ["日期", "时机", "什么时候", "安排", "开始", "延期"],
    allowed: "可以把传统时义放在人员、场地、天气和准备程度之后参考。",
    forbidden: "不得宣称某日天然保证成功，或错过就会有坏结果。",
    action: "先列不可变条件，再在可行日期中作民俗排序。",
    review: "临近日期时重新确认现实条件是否发生变化。"
  },
  {
    id: "calendar-solar-terms",
    module: "date",
    source: "传统历法与二十四节气",
    topic: "节气定月与季节转换",
    principle: "传统干支历以节气标记月令转换，不能简单用公历月份替代；临近交节时刻尤其需要核对时间与时区。",
    whenToUse: ["节气", "立春", "月份", "月令", "出生", "交节", "四季"],
    allowed: "可以明确说明采用的历法、时区和交节口径。",
    forbidden: "不得忽略交节时刻直接套用月份，也不得把节气当作天气预报。",
    action: "核对所在地时区、具体时刻及是否跨越交节。",
    review: "换算结果变化时，重新计算相关月柱与候选日期。"
  },
  {
    id: "calendar-stems-branches",
    module: "date",
    source: "传统干支纪日与择日体系",
    topic: "年、月、日、时干支",
    principle: "择日会同时观察年、月、日、时的干支关系，但日与时必须服务于具体事项和现实安排，不能只看一个宜忌标签。",
    whenToUse: ["黄历", "干支", "吉时", "冲", "宜", "忌", "择日"],
    allowed: "可以提供少量候选并说明所用规则与现实条件。",
    forbidden: "不得把通用黄历宜忌当成对每个人都相同的绝对结论。",
    action: "为每个候选同时记录事项适配、参与者时间和准备情况。",
    review: "在最终确认前检查规则是否冲突，并保留一个现实备用日期。"
  },
  {
    id: "calendar-event-specific",
    module: "date",
    source: "传统择日的因事取用原则",
    topic: "婚嫁、搬迁、开业、签约、出行与动工",
    principle: "不同事项关注点不同，传统规则也不应混成一张万能吉日表；同一天对不同事项可能采用不同判断。",
    whenToUse: ["婚礼", "搬家", "开业", "签约", "出行", "装修", "动工"],
    allowed: "可以按事项分别组织候选日期和准备重点。",
    forbidden: "不得跨事项照搬规则，也不得省略合同、安全、施工等专业要求。",
    action: "先确认具体事项，再调用对应规则与现实清单。",
    review: "事件前按事项重新检查人员、文件、交通、场地或施工条件。"
  },
  {
    id: "calendar-avoid-overselection",
    module: "date",
    source: "《周易》变通观与民俗择日边界",
    topic: "趋避有度",
    principle: "传统择日用于在多个可行方案中取舍，不应为了追求绝对吉日反复延误已经成熟的现实安排。",
    whenToUse: ["完美", "反复", "错过", "担心", "不敢", "候选", "备用"],
    allowed: "可以说明规则之间可能冲突，并帮助用户确定优先级。",
    forbidden: "不得制造禁忌焦虑，不得暗示付费才能避开坏结果。",
    action: "确定一个主选和一个备选，并写清更换条件。",
    review: "如果现实条件已满足，不因新增的次要禁忌无限推迟。"
  }
];

function moduleForReport(reportType: ReportType): TheoryCard["module"] | null {
  if (reportType.startsWith("bazi")) return "self";
  if (reportType.startsWith("marriage")) return "relationship";
  if (reportType.startsWith("home_fengshui")) return "home";
  if (reportType.startsWith("date_selection")) return "date";
  return null;
}

export function selectTheoryCardsFrom(
  cards: readonly TheoryCard[],
  reportType: ReportType,
  ruleResult: unknown,
  limit = 3
): TheoryCard[] {
  const module = moduleForReport(reportType);
  if (!module) return [];
  const text = JSON.stringify(ruleResult ?? "");
  const moduleCards = cards.filter(card => card.module === module);
  const scored = moduleCards.map(card => ({
    card,
    score: card.whenToUse.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0)
  }));
  return scored
    .sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id))
    .slice(0, limit)
    .map(item => item.card);
}

export function selectTheoryCards(reportType: ReportType, ruleResult: unknown, limit = 3): TheoryCard[] {
  return selectTheoryCardsFrom(THEORY_CATALOG, reportType, ruleResult, limit);
}

export function buildTheoryGuidanceFromCards(
  cards: readonly TheoryCard[],
  reportType: ReportType,
  ruleResult: unknown,
  version = THEORY_CATALOG_VERSION
): string {
  const selected = selectTheoryCardsFrom(cards, reportType, ruleResult);
  if (selected.length === 0) return "";
  return JSON.stringify({
    version,
    instruction: "以下内容是传统文化知识与民俗解释，不是科学证明或结果预测。区分经典原义、后世术数解释与现实条件；不作绝对吉凶判断。",
    cards: selected.map(({ id, source, topic, principle, allowed, forbidden, action, review }) => ({
      id, source, topic, principle, allowed, forbidden, action, review
    }))
  }, null, 2);
}

export function buildTheoryGuidance(reportType: ReportType, ruleResult: unknown): string {
  return buildTheoryGuidanceFromCards(THEORY_CATALOG, reportType, ruleResult);
}
