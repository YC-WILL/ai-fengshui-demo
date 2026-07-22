// 八字四柱底座：年柱以立春交接时刻为界，月柱以十二节交接时刻为界。
// lunar-typescript 的节气时刻以中国标准时间表达；海外出生资料先按出生地
// 法定时区还原为同一时刻，再换算到中国标准时间比较交节边界。

import { Solar } from "lunar-typescript";
import {
  STEMS, BRANCHES, STEM_ELEMENT, BRANCH_ELEMENT,
  STEM_YIN_YANG, ZODIAC_BY_BRANCH, elementDistribution,
  type Stem, type Branch, type Element
} from "./elements";
import type { BaziInput } from "../types";
import { DEFAULT_BIRTH_TIMEZONE, isSupportedBirthTimezone } from "./birthTimezone";

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
  calculation: {
    timezone: string;
    birthLocation?: string;
    timeKnown: boolean;
    yearBoundary: "立春交接时刻";
    monthBoundary: "节气交接时刻";
    dayBoundary: "出生地民用日期 00:00 换日";
    uncertainty?: {
      yearCandidates?: Pillar[];
      monthCandidates?: Pillar[];
      reason: string;
    };
  };
  inputSnapshot: BaziInput;
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

function yearPillar(year: number): Pillar {
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  return makePillar(stemIdx, branchIdx);
}

/** 按干支纪年生成年柱；调用方需先决定以立春或其他边界切换年份。 */
export function pillarForGanzhiYear(year: number): Pillar {
  return yearPillar(year);
}

// 五虎遁：年干 → 寅月起干
const FIVE_TIGER: Record<Stem, Stem> = {
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲"
};
/** 按节气月支与年干起月柱，供已确定节气边界的时间层使用。 */
export function pillarForSolarMonth(yearStem: Stem, branch: Branch): Pillar {
  const branchIdx = BRANCHES.indexOf(branch);
  const startStemIdx = STEMS.indexOf(FIVE_TIGER[yearStem]);
  const offsetFromYin = ((branchIdx - 2) % 12 + 12) % 12;
  return makePillar((startStemIdx + offsetFromYin) % 10, branchIdx);
}

interface CivilTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function parsePillar(label: string): Pillar {
  const stem = label[0] as Stem;
  const branch = label[1] as Branch;
  const stemIdx = STEMS.indexOf(stem);
  const branchIdx = BRANCHES.indexOf(branch);
  if (stemIdx < 0 || branchIdx < 0) throw new Error(`无法识别干支：${label}`);
  return makePillar(stemIdx, branchIdx);
}

function formatterFor(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
}

function partsInTimezone(instant: Date, timezone: string): CivilTime {
  const parts = Object.fromEntries(
    formatterFor(timezone).formatToParts(instant)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second
  };
}

function timezoneOffsetMs(instant: Date, timezone: string): number {
  const parts = partsInTimezone(instant, timezone);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - instant.getTime();
}

function civilTimeToInstant(civil: CivilTime, timezone: string): Date {
  const wallClockUtc = Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute, civil.second);
  let instant = new Date(wallClockUtc - timezoneOffsetMs(new Date(wallClockUtc), timezone));
  instant = new Date(wallClockUtc - timezoneOffsetMs(instant, timezone));
  const roundTrip = partsInTimezone(instant, timezone);
  if (Object.keys(civil).some(key => civil[key as keyof CivilTime] !== roundTrip[key as keyof CivilTime])) {
    throw new Error("出生时间落在当地时区不存在的时刻，请检查夏令时切换。");
  }
  const sameCivil = (candidate: Date) => {
    const parts = partsInTimezone(candidate, timezone);
    return Object.keys(civil).every(key => civil[key as keyof CivilTime] === parts[key as keyof CivilTime]);
  };
  if (sameCivil(new Date(instant.getTime() - 60 * 60 * 1000)) || sameCivil(new Date(instant.getTime() + 60 * 60 * 1000))) {
    throw new Error("出生时间落在夏令时回拨的重复时段，同一钟表时刻对应两个真实时刻，暂不能唯一排盘。");
  }
  return instant;
}

function validDateParts(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// ---------- 主函数 ----------
export function computeBazi(input: BaziInput): BaziChart {
  const notes: string[] = [];
  const [yStr, mStr, dStr] = input.birthDate.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);

  if (!y || !m || !d || !validDateParts(y, m, d)) {
    throw new Error("出生日期格式错误，应为 YYYY-MM-DD");
  }

  const timezone = input.timezone ?? DEFAULT_BIRTH_TIMEZONE;
  if (!isSupportedBirthTimezone(timezone)) throw new Error("暂不支持该出生时区");
  let hour = 12;
  let minute = 0;
  const timeKnown = !input.unknownTime && Boolean(input.birthTime);
  if (timeKnown) {
    const match = input.birthTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) throw new Error("出生时间格式错误，应为 HH:mm");
    hour = Number(match[1]);
    minute = Number(match[2]);
  }

  const civil = { year: y, month: m, day: d, hour, minute, second: 0 };
  const instant = civilTimeToInstant(civil, timezone);
  const chinaTime = partsInTimezone(instant, DEFAULT_BIRTH_TIMEZONE);
  const boundaryLunar = Solar.fromYmdHms(
    chinaTime.year, chinaTime.month, chinaTime.day,
    chinaTime.hour, chinaTime.minute, chinaTime.second
  ).getLunar();
  const localLunar = Solar.fromYmdHms(y, m, d, hour, minute, 0).getLunar();

  const yp = parsePillar(boundaryLunar.getYearInGanZhiExact());
  const mp = parsePillar(boundaryLunar.getMonthInGanZhiExact());
  const dp = parsePillar(localLunar.getDayInGanZhiExact2());

  let uncertainty: BaziChart["calculation"]["uncertainty"];
  if (!timeKnown) {
    const boundaryAt = (candidateHour: number, candidateMinute: number) => {
      const candidateInstant = civilTimeToInstant({ year: y, month: m, day: d, hour: candidateHour, minute: candidateMinute, second: 0 }, timezone);
      const candidateChinaTime = partsInTimezone(candidateInstant, DEFAULT_BIRTH_TIMEZONE);
      const candidateLunar = Solar.fromYmdHms(
        candidateChinaTime.year, candidateChinaTime.month, candidateChinaTime.day,
        candidateChinaTime.hour, candidateChinaTime.minute, candidateChinaTime.second
      ).getLunar();
      return {
        year: parsePillar(candidateLunar.getYearInGanZhiExact()),
        month: parsePillar(candidateLunar.getMonthInGanZhiExact())
      };
    };
    const dayStart = boundaryAt(0, 0);
    const dayEnd = boundaryAt(23, 59);
    const yearCandidates = dayStart.year.pillarLabel === dayEnd.year.pillarLabel ? undefined : [dayStart.year, dayEnd.year];
    const monthCandidates = dayStart.month.pillarLabel === dayEnd.month.pillarLabel ? undefined : [dayStart.month, dayEnd.month];
    if (yearCandidates || monthCandidates) {
      uncertainty = {
        yearCandidates,
        monthCandidates,
        reason: "出生当天发生立春或交节，未提供出生时刻，年柱或月柱不能确定。"
      };
      const candidateText = [
        yearCandidates ? `年柱可能为${yearCandidates.map(item => item.pillarLabel).join("或")}` : "",
        monthCandidates ? `月柱可能为${monthCandidates.map(item => item.pillarLabel).join("或")}` : ""
      ].filter(Boolean).join("；");
      notes.push(`${candidateText}；确认大致出生时段后才能确定。`);
    }
  }

  let hp: Pillar | null = null;
  if (input.unknownTime) {
    notes.push("出生时间未知：时柱明确省略，不以中午或其他时刻代填。若出生当日恰逢交节，年柱或月柱仍可能随实际时刻变化。");
  } else if (input.birthTime) {
    hp = parsePillar(localLunar.getTimeInGanZhi());
  } else {
    notes.push("未填写出生时间，时柱已省略。");
  }

  const allElements: Element[] = [
    yp.stemElement, yp.branchElement,
    mp.stemElement, mp.branchElement,
    dp.stemElement, dp.branchElement,
    ...(hp ? [hp.stemElement, hp.branchElement] : [])
  ];

  notes.push("年柱按立春交接时刻切换；月柱按十二节的实际交接时刻切换。");
  notes.push("日柱按出生地民用日期 00:00 换日；23:00–23:59 归入子时柱，但日柱不提前换日。");
  notes.push(`${input.birthLocation ? `出生地按“${input.birthLocation}”记录，` : ""}交节边界按出生地法定时区 ${timezone} 换算；当前不做经度真太阳时校正。`);

  return {
    year: yp,
    month: mp,
    day: dp,
    hour: hp,
    dayMaster: dp.stem,
    zodiac: ZODIAC_BY_BRANCH[yp.branch],
    elementDistribution: elementDistribution(allElements),
    notes,
    calculation: {
      timezone,
      birthLocation: input.birthLocation?.trim() || undefined,
      timeKnown,
      yearBoundary: "立春交接时刻",
      monthBoundary: "节气交接时刻",
      dayBoundary: "出生地民用日期 00:00 换日",
      uncertainty
    },
    inputSnapshot: { ...input, timezone }
  };
}

// ---------- 简化"性格画像"与生活建议派生 ----------
// 只使用可展示、可追溯的盘面结构生成观察性描述，避免隐藏来源和固定人格标签。
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
      situationResponse: "连续受挫很容易让人把结果误认为能力评价，但一段时间的结果不能单独证明你是否适合当前方向。先把最近一次未达成的事情拆成需求、信任、时机、条件四类线索，再决定下一步，而不是直接给自己下结论。",
      situationActionPlan: [
        "第 1 天：挑最近一次未达成的事情，分别写下需求、信任、时机、条件各一条事实；只记录可观察内容，不把结果翻译成对自我的否定。",
        "第 2–3 天：每天只复盘一件事，记一个做得好的提问和一个下次要调整的动作；把目标改为完成一次高质量确认，而不是当场得到结果。",
        "第 4 天：把开场或确认过程改成三问小脚本，找身边的人演练 10 分钟，再用于一次真实沟通并记录对方的原话反馈。",
        "第 5–6 天：给每次跟进设置一个明确下一步（补资料、约时间或暂缓），当天完成不超过 3 个高质量动作，避免用堆数量惩罚自己。",
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
      situationResponse: "生活觉得无味、又找不到情绪出口时，问题不一定是你不够努力，也可能是每天缺少能带来反馈的具体连接。先把任务压力、关系困扰和情绪状态分开处理，不用一次解决所有事情。",
      situationActionPlan: [
        "今天：用 5 分钟把压力分成任务、关系、生活三栏，每栏只写一件最具体的事；再选一件 20 分钟内能完成的小任务。",
        "明天：向一个相对熟悉的人问一个具体问题，聊 3 分钟即可；目标是完成一次真实互动，不要求马上建立深度关系。",
        "第 3–4 天：把一项待办拆成‘打开资料、完成一小段、留下一个问题’三步，每次只做 25 分钟，结束时记录完成了哪一步。",
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
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  const modifier = DAY_BRANCH_MODIFIER[chart.day.branchElement];
  return `从日主与日支的传统意象看，${pattern.strength}；不过，${modifier.tradeoff}。这是一条生活观察，不是人格定论。`;
}

export function personalNarrativeFacts(chart: BaziChart, userContext?: string): PersonalNarrativeFacts {
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  const dayModifier = DAY_BRANCH_MODIFIER[chart.day.branchElement];
  const monthModifier = chart.calculation.uncertainty
    ? dayModifier
    : DAY_BRANCH_MODIFIER[chart.month.branchElement];
  const { strongest, weakest } = chart.elementDistribution;
  const situation = situationGuidance(userContext);
  return {
    traitKeywords: [`${chart.dayMaster}日主`, chart.calculation.uncertainty ? "月令待确认" : `${chart.month.branch}月令`, `${chart.day.branch}日支`],
    firstResponse: pattern.decision,
    coreStrength: pattern.strength,
    decisionPattern: pattern.decision,
    planningPreference: dayModifier.action,
    pressurePattern: monthModifier.pressure,
    cautionSignals: [monthModifier.reminder, dayModifier.reminder],
    actionSeeds: [pattern.action, dayModifier.action, monthModifier.action],
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
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  const modifier = DAY_BRANCH_MODIFIER[chart.month.branchElement];
  return `从传统结构看，你可能${pattern.strength}。做决定时，${pattern.decision}；落实时，可以尝试${modifier.action}。${modifier.pressure}。这些只适合对照真实经历，不是固定结论。`;
}

export function lifeReminders(chart: BaziChart): string[] {
  const modifier = DAY_BRANCH_MODIFIER[chart.month.branchElement];
  const dayModifier = DAY_BRANCH_MODIFIER[chart.day.branchElement];
  return [
    `${dayModifier.reminder}；${REMINDER_BY_DAY_MASTER[chart.dayMaster]}。`,
    `${modifier.action}，再观察：${modifier.reminder}。`
  ];
}

export function lifeSuggestions(chart: BaziChart): string[] {
  const pattern = DAY_MASTER_PATTERN[chart.dayMaster];
  const modifier = DAY_BRANCH_MODIFIER[chart.day.branchElement];
  const monthModifier = DAY_BRANCH_MODIFIER[chart.month.branchElement];
  return [
    `按${chart.dayMaster}日主的观察，可以${pattern.action}。`,
    `结合${chart.day.branch}日支，可以${modifier.action}。`,
    `结合${chart.month.branch}月令，可以${monthModifier.action}；完成后再回看现实反馈。`
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
