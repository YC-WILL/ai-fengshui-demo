// ============================================================
// 八字（四柱）简化计算
//
// ⚠️ MVP 注意：本实现采用简化算法 ——
//   · 年柱按公历年份近似（未严格按立春切换）
//   · 月柱按公历月份近似（未按节气切换）
//   · 日柱使用儒略日法，结果较准确
//   · 时柱按 24 小时区间近似（未按真太阳时）
//
// 正式上线请替换为成熟农历/节气库（如 lunar-typescript），
// 本文件已尽量隔离接口，便于无痛替换。
// ============================================================

import {
  STEMS, BRANCHES, STEM_ELEMENT, BRANCH_ELEMENT,
  STEM_YIN_YANG, ZODIAC_BY_BRANCH, elementDistribution,
  type Stem, type Branch, type Element
} from "./elements";
import type { BaziInput } from "../types";
import { behavioralAccent } from "./behavioralAccent";

export interface Pillar {
  stem: Stem;
  branch: Branch;
  stemElement: Element;
  branchElement: Element;
  pillarLabel: string; // e.g. "甲子"
}

export interface BaziChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // 出生时间未知时为 null
  dayMaster: Stem;
  zodiac: string;
  elementDistribution: ReturnType<typeof elementDistribution>;
  notes: string[];
  inputSnapshot: BaziInput;
}

// ---------- 儒略日 ----------
function toJulianDay(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

// 1900-01-01 (Gregorian) 是 甲戌日：stem=0(甲), branch=10(戌)
// JD(1900-01-01) = 2415021
function dayPillarFromJD(jd: number): Pillar {
  const stemIdx = ((jd - 1) % 10 + 10) % 10;
  const branchIdx = ((jd + 1) % 12 + 12) % 12;
  return makePillar(stemIdx, branchIdx);
}

function makePillar(stemIdx: number, branchIdx: number): Pillar {
  const stem = STEMS[stemIdx];
  const branch = BRANCHES[branchIdx];
  return {
    stem,
    branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    pillarLabel: `${stem}${branch}`
  };
}

// ---------- 年柱（简化：按公历年份） ----------
function yearPillar(year: number): Pillar {
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  return makePillar(stemIdx, branchIdx);
}

// ---------- 月柱（简化：按公历月份）----------
// 五虎遁：年干 → 寅月起干
const FIVE_TIGER: Record<Stem, Stem> = {
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲"
};
function monthPillar(yearStem: Stem, month: number): Pillar {
  // Gregorian month → branch： Feb→寅(2), …, Dec→子(0), Jan→丑(1)
  const branchIdx = month % 12;
  // 寅月起干 = FIVE_TIGER[yearStem]，然后按 (branchIdx - 2) 偏移
  const startStem = FIVE_TIGER[yearStem];
  const startStemIdx = STEMS.indexOf(startStem);
  // 从寅(2)开始按月推进
  const offsetFromYin = ((branchIdx - 2) % 12 + 12) % 12;
  const stemIdx = (startStemIdx + offsetFromYin) % 10;
  return makePillar(stemIdx, branchIdx);
}

// ---------- 时柱（简化：按 24 小时区间）----------
// 五鼠遁：日干 → 子时起干
const FIVE_RAT: Record<Stem, Stem> = {
  甲: "甲", 己: "甲",
  乙: "丙", 庚: "丙",
  丙: "戊", 辛: "戊",
  丁: "庚", 壬: "庚",
  戊: "壬", 癸: "壬"
};
function hourBranchIndex(hour: number): number {
  // 23-1=子(0), 1-3=丑(1), ..., 21-23=亥(11)
  return Math.floor(((hour + 1) % 24) / 2);
}
function hourPillar(dayStem: Stem, hour: number): Pillar {
  const branchIdx = hourBranchIndex(hour);
  const startStem = FIVE_RAT[dayStem];
  const startStemIdx = STEMS.indexOf(startStem);
  const stemIdx = (startStemIdx + branchIdx) % 10;
  return makePillar(stemIdx, branchIdx);
}

// ---------- 主函数 ----------
export function computeBazi(input: BaziInput): BaziChart {
  const notes: string[] = [];
  const [yStr, mStr, dStr] = input.birthDate.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);

  if (!y || !m || !d) {
    throw new Error("出生日期格式错误，应为 YYYY-MM-DD");
  }

  const yp = yearPillar(y);
  const mp = monthPillar(yp.stem, m);
  const jd = toJulianDay(y, m, d);
  const dp = dayPillarFromJD(jd);

  let hp: Pillar | null = null;
  if (input.unknownTime) {
    notes.push("出生时间未知，时柱已省略，相关结论仅参考。");
  } else if (input.birthTime) {
    const [hh] = input.birthTime.split(":").map(n => parseInt(n, 10));
    if (Number.isFinite(hh)) {
      hp = hourPillar(dp.stem, hh);
    } else {
      notes.push("出生时间解析失败，时柱已省略。");
    }
  } else {
    notes.push("未填写出生时间，时柱已省略。");
  }

  const allElements: Element[] = [
    yp.stemElement, yp.branchElement,
    mp.stemElement, mp.branchElement,
    dp.stemElement, dp.branchElement,
    ...(hp ? [hp.stemElement, hp.branchElement] : [])
  ];

  notes.push("本计算为简化版：年/月柱未严格按立春与节气切换，仅供参考。");

  return {
    year: yp,
    month: mp,
    day: dp,
    hour: hp,
    dayMaster: dp.stem,
    zodiac: ZODIAC_BY_BRANCH[yp.branch],
    elementDistribution: elementDistribution(allElements),
    notes,
    inputSnapshot: input
  };
}

// ---------- 简化"性格画像"与生活建议派生 ----------
// 使用日主、五行相对强弱与隐性生日行为侧重生成观察性描述，避免固定人格标签。
const GIFT_BY_ELEMENT: Record<Element, string> = {
  木: "生长和尝试",
  火: "表达和行动",
  土: "稳定和落实",
  金: "取舍和边界",
  水: "观察和转圜"
};

interface DayMasterPattern {
  strength: string;
  decision: string;
  action: string;
}

interface DayBranchModifier {
  tradeoff: string;
  pressure: string;
  reminder: string;
  action: string;
}

export interface PersonalNarrativeFacts {
  traitKeywords: [string, string, string];
  firstResponse: string;
  coreStrength: string;
  decisionPattern: string;
  planningPreference: string;
  pressurePattern: string;
  cautionSignals: [string, string];
  actionSeeds: [string, string, string];
  elementContext: { prominentGift: string; quieterGift: string };
  userContext?: string;
  timeRhythm: string;
  birthPlaceContext?: string;
  /** 针对用户自述困境的场景化回应，供 Prompt/本地兜底使用。 */
  situationResponse?: string;
  /** 以现实行为为主的短期行动计划，避免只给性格化套话。 */
  situationActionPlan?: string[];
  supportReminder?: string;
}

function situationGuidance(userContext?: string): Pick<PersonalNarrativeFacts, "situationResponse" | "situationActionPlan" | "supportReminder"> {
  const text = (userContext ?? "").trim();
  if (!text) return {};
  const career = /(保险|中介|销售|客户|谈单|成交|业绩|工作|职业|求职|生意)/.test(text);
  const rejection = /(失败|被拒|拒绝|没谈成|连续|业绩下滑|没有成交)/.test(text);
  const lowMood = /(低落|抑郁|怀疑自己|自我否定|失眠|撑不住|情绪不好|难受|焦虑|无味|找不到出口)/.test(text);
  if (career && (rejection || lowMood)) {
    return {
      situationResponse: "连续被拒绝很容易让人把结果误认为能力评价，但一段时间的谈单结果不能单独证明你是否适合这份工作。先把一次谈单拆成需求、信任、时机、预算四类线索，再决定下一步，而不是直接给自己下结论。",
      situationActionPlan: [
        "第 1 天：挑最近一场未成交谈单，分别写下需求、信任、时机、预算各一条事实；只记录可观察内容，不写“客户不喜欢我”。",
        "第 2–3 天：每天只复盘一场，记一个做得好的提问和一个下次要调整的动作；把目标改为完成一次高质量需求确认，而不是当场成交。",
        "第 4 天：把开场或需求确认改成三问小脚本，找同事演练 10 分钟，再用于一位新客户并记录客户的原话反馈。",
        "第 5–6 天：给每次跟进设置一个明确下一步（补资料、约时间或暂缓），当天完成不超过 3 个高质量跟进，避免用堆数量惩罚自己。",
        "第 7 天：回看一周记录，比较四类原因各出现几次；选出现最多的一类做下周唯一改进主题，并保留一项已经有效的做法。"
      ],
      supportReminder: lowMood
        ? "如果低落、失眠或无法工作持续数日，可以先告诉信任的人并联系专业心理/医疗支持；求助不是对工作的否定。"
        : undefined
    };
  }
  const student = /(大学|大一|大二|大三|大四|学生|学业|课程|考试|论文|宿舍|同学|社交|交朋友)/.test(text);
  const socialOrStudy = /(交朋友|社交|孤独|没朋友|学业|成绩|考试|拖延|方向|专业|焦虑|无味|出口)/.test(text);
  if (student && socialOrStudy) {
    return {
      situationResponse: "大学生活觉得无味、又找不到情绪出口时，问题不一定是你不够努力，也可能是每天缺少能带来反馈的具体连接。先把学业压力、社交困难和情绪状态分开处理，不用一次解决整段大学生活。",
      situationActionPlan: [
        "今天：用 5 分钟把压力分成学业、社交、生活三栏，每栏只写一件最具体的事；再选一件 20 分钟内能完成的小任务。",
        "明天：在课堂或社团里向一个相对熟悉的人问一个具体问题，聊 3 分钟即可；目标是完成一次真实互动，不要求马上交到朋友。",
        "第 3–4 天：把一项作业拆成‘打开资料、写 100 字、提交一个问题’三步，每次只做 25 分钟，结束时记录完成了哪一步。",
        "第 5 天：安排一次能产生感官反馈的活动，例如去操场走 15 分钟、吃一顿热饭或到图书馆换座位；观察情绪有没有从 2 分变成 3 分。",
        "第 7 天：回看一周记录，分别留下一个有效学习动作和一个让你感觉被连接的时刻，再决定下周只延续哪两件事。"
      ],
      supportReminder: lowMood
        ? "如果焦虑或低落持续数日，已经明显影响睡眠、上课或完成作业，可以告诉信任的人，并联系学校心理中心或专业支持；这不是给自己贴标签。"
        : undefined
    };
  }
  if (lowMood) {
    return {
      situationResponse: "你描述的低落值得被认真接住。先把‘我是不是不行’和眼前发生的事实分开，今天只处理一个可完成的小步骤，不急着用一时状态给自己定性。",
      situationActionPlan: [
        "今天：写下一个具体事实、一个感受和一个需要，控制在 5 分钟内；完成后只选一件 20 分钟内能做完的事。",
        "接下来三天：每天固定一个 20 分钟行动时段，结束时记录完成了什么，不用评价整天表现。",
        "第 7 天：和信任的人聊 15 分钟，说明你希望对方提供的是倾听、陪伴还是一起找专业支持。"
      ],
      supportReminder: "如果低落、失眠或无法工作持续数日，可以先告诉信任的人并联系专业心理/医疗支持；求助不是软弱。"
    };
  }
  return {
    situationResponse: "你写下的这件具体事情，比任何抽象标签都更值得先看。可以把它拆成已经发生的事实、你在意的部分和下一步想验证的一个小问题。",
    situationActionPlan: [
      "今天用 5 分钟写下三列：事实、在意、可验证的问题，各写一条。",
      "本周挑一个最小行动，在 20 分钟内完成，并记录结果而不是先评价自己。",
      "一周后回看记录，保留一个有效做法，调整一个仍卡住的环节。"
    ]
  };
}

function timeRhythm(chart: BaziChart): string {
  if (!chart.hour) return "出生时间未提供，先不对一天中的反应节奏下结论";
  const branch = chart.hour.branch;
  if (["子", "丑", "寅"].includes(branch)) return "更容易在安静、少打扰的时段整理想法，再决定是否开口";
  if (["卯", "辰", "巳"].includes(branch)) return "更容易在事情刚启动时迅速进入状态，边做边校准方向";
  if (["午", "未", "申"].includes(branch)) return "在互动和任务交错时反应较快，需要把优先顺序说清";
  return "更容易先观察一天的变化，等信息齐一点再给出明确回应";
}

const DAY_MASTER_PATTERN: Record<Stem, DayMasterPattern> = {
  甲: { strength: "认准方向后，你通常愿意主动开路，把模糊的想法推到可以行动的位置", decision: "你会先判断这件事值不值得长期投入，再决定从哪里开始", action: "同时出现多个目标时，只保留一个本周必须推进的主任务" },
  乙: { strength: "你善于看见关系中的细节，也较会用柔和方式让事情继续向前", decision: "你常先衡量不同人的位置，再寻找既能推进又不伤和气的做法", action: "讨论超过十分钟仍没有结论时，分别写下一项不可退让和一项可以协商的条件" },
  丙: { strength: "你较容易把态度和热情传递出去，也能带动身边的人进入状态", decision: "你会先确认自己是否认同，再用行动和表达推动结果", action: "重要回应前先复述一次对方的重点，再表达自己的看法" },
  丁: { strength: "你对细微变化较敏感，愿意在真正重要的事情上持续投入注意力", decision: "你通常要先确认内心是否认同，才愿意给出明确承诺", action: "犹豫超过一天的事情，写下事实、担心和需要分别是什么" },
  戊: { strength: "你面对复杂局面时较能稳住秩序，也愿意承担看得见的责任", decision: "你会优先考虑现实条件、责任归属和结果能否落地", action: "接下新责任前，先明确哪些部分不属于自己，以及何时需要别人接手" },
  己: { strength: "你较会照顾具体细节和身边人的感受，能让熟悉的生活保持安稳", decision: "你常从熟悉程度、现实影响和身边人的感受开始判断", action: "答应帮忙前，先说清自己能做到的范围和需要对方承担的部分" },
  庚: { strength: "你面对问题时较容易抓住关键，也愿意把标准和边界说清楚", decision: "你倾向先确定原则和底线，再比较哪种方案最有效", action: "给出明确结论时，同时补充一条依据和一个仍可商量的部分" },
  辛: { strength: "你对分寸、品质和细节有较清楚的感受，也善于发现需要修整之处", decision: "你通常会比较细节与长期影响，不愿只凭一时冲动决定", action: "每次复盘同时写下一项需调整之处和一项已经有效的做法" },
  壬: { strength: "你能较快吸收新信息，也常能在变化中找到新的连接和路径", decision: "你会先搜集不同信息，再寻找弹性最大、可继续调整的方案", action: "资料搜集前先写下两个决策条件，满足后就停止继续扩展选项" },
  癸: { strength: "你对环境和他人的细微反应较敏锐，安静观察时常能看见被忽略的部分", decision: "你倾向先观察变化和后果，确认内心感受后再表态", action: "重要讨论前先写下一句自己的判断，交流时不要等到最后才说" }
};

const REMINDER_BY_DAY_MASTER: Record<Stem, string> = {
  甲: "当待办不断增加却没有一件进入收尾时，先停下来判断自己是在推进，还是只是在不断开新头",
  乙: "一场讨论如果有了共同方案，却没有人知道你的真实偏好，可能是协调已经盖过了表达",
  丙: "当别人开始解释第二遍时，可以先检查自己是否太早回应，遗漏了对方真正想说的部分",
  丁: "重要事情在心里推演很多遍却没有开口时，沉默本身也可能让对方误判你的态度",
  戊: "当一件事越来越依赖你亲自托住时，要检查这是责任感，还是已经缺少合理分工",
  己: "发现自己不断替别人补细节时，先确认对方是否真的需要帮助，以及这是否属于你的责任",
  庚: "一个结论很快变得明确时，仍要检查是否还有一条重要信息尚未进入判断",
  辛: "反复修改同一个细节之前，先确认它是否真的影响结果，而不是只影响心里的完成感",
  壬: "当资料越查越多却更难决定时，问题通常不是信息不够，而是选择条件还没有被写清",
  癸: "当你已经察觉气氛变化却一直没有表态时，别人可能会把安静误解为同意或不在意"
};

const DAY_BRANCH_MODIFIER: Record<Element, DayBranchModifier> = {
  木: {
    tradeoff: "新方向出现时，你可能同时伸出几条线索，主次需要稍后才能收拢",
    pressure: "压力上来时容易继续寻找新的突破口，手上的事情反而更难结束",
    reminder: "如果新想法不断出现却没有一个进入验证，先区分真正的机会和暂时的兴奋",
    action: "新方向先用一次小实验验证，完成后再决定是否增加投入"
  },
  火: {
    tradeoff: "回应速度往往不慢，有时立场先出来，细节和余地要到后面才补上",
    pressure: "压力上来时反应和表达会一起变快，容易让别人只听见态度",
    reminder: "重要对话结束后，如果只记得彼此的态度却说不清问题本身，说明节奏可能太快",
    action: "重要回应前先复述事实和对方诉求，再说自己的结论"
  },
  土: {
    tradeoff: "你会把现实影响考虑得较周全，但也可能为了稳妥而延后明确取舍",
    pressure: "压力上来时更容易回到熟悉做法，即使新的条件已经需要不同处理",
    reminder: "同一个方案反复微调却迟迟不决定时，先检查自己是在完善，还是在回避取舍",
    action: "为当前选择设一个确认时间，到点只根据最重要的两项条件决定"
  },
  金: {
    tradeoff: "判断标准通常较清楚，但标准一旦先入为主，新的信息可能较难进入",
    pressure: "压力上来时容易收紧规则和边界，希望用确定标准减少变化",
    reminder: "当一个方案只因不符合原先标准就被排除时，先确认标准本身是否仍然适用",
    action: "做决定时保留一项可调整条件，让新信息仍有进入判断的位置"
  },
  水: {
    tradeoff: "你能根据环境转弯，但选择保留得太多时，别人可能不知道你最终站在哪里",
    pressure: "压力上来时容易继续观察和比较，把明确表态往后推",
    reminder: "当你已经看见多种可能却没有说出倾向时，沟通对象可能只能靠猜测推进",
    action: "列完不同可能后，明确标出目前最倾向的一项和改变它所需的新信息"
  }
};

export function friendlyCoreConclusion(chart: BaziChart): string {
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  const modifier = DAY_BRANCH_MODIFIER[chart.day.branchElement];
  return `遇到重要事情时，你可能会${accent.response}。${pattern.strength}；不过，${modifier.tradeoff}。`;
}

export function personalNarrativeFacts(chart: BaziChart, userContext?: string): PersonalNarrativeFacts {
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  const dayModifier = DAY_BRANCH_MODIFIER[chart.day.branchElement];
  const monthModifier = DAY_BRANCH_MODIFIER[chart.month.branchElement];
  const { strongest, weakest } = chart.elementDistribution;
  const situation = situationGuidance(userContext);
  return {
    traitKeywords: accent.traitKeywords,
    firstResponse: accent.response,
    coreStrength: pattern.strength,
    decisionPattern: pattern.decision,
    planningPreference: accent.planning,
    pressurePattern: monthModifier.pressure,
    cautionSignals: [accent.watchFor, dayModifier.reminder],
    actionSeeds: [accent.action, pattern.action, dayModifier.action],
    elementContext: {
      prominentGift: GIFT_BY_ELEMENT[strongest],
      quieterGift: GIFT_BY_ELEMENT[weakest]
    },
    userContext: userContext?.trim().slice(0, 500) || undefined
    ,timeRhythm: timeRhythm(chart),
    birthPlaceContext: chart.inputSnapshot.birthLocation?.trim()
      ? "出生地只作为生活背景线索，不能单独决定性格；可结合用户自述观察成长环境对习惯的影响。"
      : undefined,
    ...situation
  };
}

export function friendlyElementNote(chart: BaziChart): string {
  const { strongest, weakest } = chart.elementDistribution;
  return `从传统五行角度看，${strongest}的侧重让你较容易把${GIFT_BY_ELEMENT[strongest]}放在前面；${weakest}相对不显眼时，${GIFT_BY_ELEMENT[weakest]}可能较晚才进入考虑。它只解释行为的一部分，真正需要留意的仍是你在具体事情中怎样选择。`;
}

export function personalityProfile(chart: BaziChart): string {
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  const modifier = DAY_BRANCH_MODIFIER[chart.month.branchElement];
  return `从日常互动看，你可能${accent.profile}。做决定时，${pattern.decision}；准备落实时，你更适合${accent.planning}。${modifier.pressure}。这些表现只适合用来对照真实经历，不是固定结论。`;
}

export function lifeReminders(chart: BaziChart): string[] {
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  const modifier = DAY_BRANCH_MODIFIER[chart.month.branchElement];
  return [
    `${accent.watchFor}；${REMINDER_BY_DAY_MASTER[chart.dayMaster]}。`,
    `${accent.planning}，再观察：${modifier.reminder}。`
  ];
}

export function lifeSuggestions(chart: BaziChart): string[] {
  const accent = behavioralAccent(chart.inputSnapshot.birthDate);
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  const modifier = DAY_BRANCH_MODIFIER[chart.day.branchElement];
  return [
    `${accent.action}。`,
    `${pattern.action}。`,
    `可以${accent.planning}；随后${modifier.action}。`
  ];
}

export function elementSummary(chart: BaziChart): string {
  const dist = chart.elementDistribution;
  const parts: string[] = [];
  for (const e of ["木", "火", "土", "金", "水"] as Element[]) {
    parts.push(`${e}${dist.counts[e]}`);
  }
  return parts.join(" ");
}

export function dayMasterDescription(chart: BaziChart): string {
  const dm = chart.dayMaster;
  const yy = STEM_YIN_YANG[dm];
  const ele = STEM_ELEMENT[dm];
  return `日主为${yy}${ele}（${dm}），五行结构整体${describeBalance(chart)}。`;
}

function describeBalance(chart: BaziChart): string {
  const { strongest, weakest, missing } = chart.elementDistribution;
  if (missing.length >= 2) return `偏${strongest}，缺${missing.join("/")}`;
  if (missing.length === 1) return `偏${strongest}，缺${missing[0]}`;
  return `偏${strongest}，相对弱${weakest}`;
}
