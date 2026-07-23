import zhouyiCatalog from "../../../prisma/data/zhouyi-canon.json";

export const SIGN_THEORY_VERSION = "2026-07-23.guaan-yi-sign-v1";
export const SIGN_SYSTEM_ID = "guaan-yi-sign-64";

export const SIGN_SYSTEM = {
  id: SIGN_SYSTEM_ID,
  code: "guaan_yi_sign_64",
  name: "蟾先森易签六十四签",
  version: SIGN_THEORY_VERSION,
  description: "面向早签、午签、下午签与晚签的日常方向签系；抽签后可围绕同一签象继续交互解签。",
  theoryBasis: "以《周易》六十四卦的卦辞、彖传与大象传为经典依据；四时落点、方向与行动框架为蟾先森原创整理。",
  drawCount: 64,
  drawPolicy: {
    probability: "uniform",
    randomSource: "server_crypto",
    oneNewDrawPerPeriod: true,
    repeatVisitReturnsSameDraw: true,
    interpretationKeepsOriginalDraw: true,
    redrawToChangeAnswerForbidden: true,
    dateAnchorHour: 6
  },
  contentStatus: "foundation",
  isActive: true
} as const;

export const SIGN_DIRECTIONS = [
  {
    id: "sign-direction-advance", code: "advance", name: "推进",
    meaning: "条件基本具备，可以通过小步行动验证方向。",
    criteria: { requiresEvidence: true, preferSmallStep: true, preserveExit: true },
    actionPrinciple: "先完成一个可验证、可回退的步骤，再根据反馈扩大投入。",
    caution: "不得解释为结果必成，也不能忽略现实成本与他人意愿。"
  },
  {
    id: "sign-direction-hold", code: "hold", name: "守持",
    meaning: "当前更适合稳住已有成果、边界或节奏。",
    criteria: { protectExistingValue: true, avoidUnnecessaryExpansion: true },
    actionPrinciple: "先保证核心事项不失序，再决定是否增加新的目标。",
    caution: "守持不等于消极拖延，需要明确观察期限。"
  },
  {
    id: "sign-direction-wait", code: "wait", name: "等待",
    meaning: "关键条件尚未出现，贸然推进的信息价值较低。",
    criteria: { missingKeyCondition: true, reviewDateRequired: true },
    actionPrinciple: "明确等待什么、等到何时，以及等待期间能够准备什么。",
    caution: "不得用等待回避必须面对的沟通或责任。"
  },
  {
    id: "sign-direction-clarify", code: "clarify", name: "明辨",
    meaning: "事实、目标或双方意图尚不清楚，应先辨明再行动。",
    criteria: { separateFactAndAssumption: true, verifyIntent: true },
    actionPrinciple: "补齐一个关键事实，或进行一次具体而不逼迫的确认。",
    caution: "不得把猜测包装成签象已经证明的事实。"
  },
  {
    id: "sign-direction-adjust", code: "adjust", name: "调整",
    meaning: "目标未必需要放弃，但方法、节奏或资源配置需要改变。",
    criteria: { preserveGoalIfValid: true, changeMethod: true },
    actionPrinciple: "找出当前最耗损的一环，只调整一个变量并观察反馈。",
    caution: "避免在没有复盘原因时反复换方向。"
  },
  {
    id: "sign-direction-cooperate", code: "cooperate", name: "协同",
    meaning: "事情需要通过分工、回应或建立共识才能继续。",
    criteria: { requiresOtherPeople: true, consentRequired: true, rolesMustBeClear: true },
    actionPrinciple: "明确双方能够提供什么、不能承担什么，以及下一次确认点。",
    caution: "不得用签象替第三方表达意愿。"
  },
  {
    id: "sign-direction-withdraw", code: "withdraw", name: "收减",
    meaning: "应降低投入、缩小范围或暂时退出高消耗位置。",
    criteria: { excessiveCost: true, boundaryAtRisk: true, preserveCore: true },
    actionPrinciple: "先停止新增投入，保留必要资源和可恢复的连接。",
    caution: "不得把收减直接解释为永远结束或关系必然破裂。"
  },
  {
    id: "sign-direction-close", code: "close", name: "收束",
    meaning: "事情进入完成、交付、告别或复盘阶段。",
    criteria: { unfinishedLoopsPresent: true, defineDone: true },
    actionPrinciple: "完成一个明确的收尾动作，并记录仍需后续处理的事项。",
    caution: "不要为了追求形式上的圆满继续无效消耗。"
  }
].map(item => ({ ...item, version: SIGN_THEORY_VERSION, isActive: true }));

export const SIGN_DOMAINS = [
  {
    code: "self_state", name: "自己的状态", description: "观察当前精力、节奏、困惑和下一步。",
    questions: ["最近最让你反复想着的是什么？", "你现在更需要推进、停一下，还是先想清楚？"]
  },
  {
    code: "career_study", name: "工作与学习", description: "处理任务、发展、学习、机会与能力建设。",
    questions: ["你是在决定是否改变，还是在想怎样推进？", "当前最大的阻力来自信息、能力、资源还是配合？"]
  },
  {
    code: "relationship", name: "感情与相处", description: "帮助用户理解互动、边界和沟通，不替第三方断言。",
    questions: ["你更想改善相处，还是判断是否继续投入？", "对方最近有哪些可以确认的实际行为？"]
  },
  {
    code: "family", name: "家庭与亲人", description: "处理家庭责任、沟通、照顾和边界。",
    questions: ["这件事主要影响谁？", "你能承担的部分和不适合独自承担的部分分别是什么？"]
  },
  {
    code: "cooperation", name: "合作与人际", description: "处理分工、承诺、冲突和共同目标。",
    questions: ["双方目前已经确认了哪些责任？", "最需要再次确认的是目标、时间还是资源？"]
  },
  {
    code: "choice_timing", name: "选择与时机", description: "比较选项、可逆性、窗口和准备条件。",
    questions: ["你正在比较哪两个具体选择？", "哪个决定可以先小范围尝试，哪个一旦做出较难撤回？"]
  },
  {
    code: "custom", name: "自定义问题", description: "从用户实际描述出发，先分清事实、担心与可控部分。",
    questions: ["这件事里已经确定的事实是什么？", "你现在最需要判断的是方向、时机，还是下一步行动？"]
  }
].map(item => ({
  id: `sign-domain-${item.code}`,
  code: item.code,
  name: item.name,
  description: item.description,
  clarifyingQuestions: item.questions,
  allowedUse: "用于澄清用户自身处境、可控条件与下一步行动。",
  forbiddenUse: "不得预测确定结果，不得替第三方表达意愿，不得代替医疗、法律或投资判断。",
  version: SIGN_THEORY_VERSION,
  isActive: true
}));

export const SIGN_PERIOD_PROFILES = [
  {
    id: "sign-period-morning", code: "morning", name: "早签", sequence: 1,
    startMinute: 360, endMinute: 659, crossesMidnight: false,
    focus: "起势、定意与今天的第一步",
    guidingQuestion: "今天最值得先开始的是什么？",
    directionEmphasis: ["advance", "clarify", "adjust"],
    actionHorizon: "今天上午"
  },
  {
    id: "sign-period-noon", code: "noon", name: "午签", sequence: 2,
    startMinute: 660, endMinute: 779, crossesMidnight: false,
    focus: "补充、校准与恢复可用精力",
    guidingQuestion: "上午过后，哪里最需要校准？",
    directionEmphasis: ["hold", "clarify", "adjust"],
    actionHorizon: "今天中午至下午"
  },
  {
    id: "sign-period-afternoon", code: "afternoon", name: "下午签", sequence: 3,
    startMinute: 780, endMinute: 1019, crossesMidnight: false,
    focus: "推进、协同与完成关键事项",
    guidingQuestion: "接下来怎样把最重要的事向前推动？",
    directionEmphasis: ["advance", "cooperate", "close"],
    actionHorizon: "今天下午"
  },
  {
    id: "sign-period-evening", code: "evening", name: "晚签", sequence: 4,
    startMinute: 1020, endMinute: 359, crossesMidnight: true,
    focus: "收束、复盘与安顿未决事项",
    guidingQuestion: "今天需要完成什么收尾，又可以放下什么？",
    directionEmphasis: ["hold", "withdraw", "close"],
    actionHorizon: "今晚至次日清晨"
  }
].map(item => ({
  ...item,
  systemId: SIGN_SYSTEM_ID,
  dateAnchorHour: 6,
  version: SIGN_THEORY_VERSION,
  isActive: true
}));

type DirectionCode = "advance" | "hold" | "wait" | "clarify" | "adjust" | "cooperate" | "withdraw" | "close";
type StageCode = "initiate" | "prepare" | "advance" | "transition" | "obstruction" | "consolidate" | "renewal" | "closure";

const ENTRY_SPECS: readonly [DirectionCode, DirectionCode | null, StageCode][] = [
  ["advance", "hold", "initiate"], ["cooperate", "hold", "prepare"], ["wait", "clarify", "initiate"], ["clarify", "wait", "prepare"],
  ["wait", "hold", "prepare"], ["clarify", "withdraw", "obstruction"], ["cooperate", "hold", "advance"], ["cooperate", "hold", "consolidate"],
  ["hold", "wait", "prepare"], ["clarify", "hold", "advance"], ["advance", "cooperate", "advance"], ["hold", "withdraw", "obstruction"],
  ["cooperate", "advance", "advance"], ["hold", "advance", "consolidate"], ["hold", "clarify", "consolidate"], ["advance", "clarify", "initiate"],
  ["adjust", "cooperate", "transition"], ["adjust", "clarify", "transition"], ["advance", "cooperate", "advance"], ["wait", "clarify", "prepare"],
  ["clarify", "advance", "transition"], ["hold", "clarify", "consolidate"], ["withdraw", "hold", "obstruction"], ["advance", "adjust", "renewal"],
  ["hold", "clarify", "consolidate"], ["hold", "wait", "prepare"], ["adjust", "hold", "consolidate"], ["adjust", "advance", "transition"],
  ["wait", "hold", "obstruction"], ["clarify", "advance", "transition"], ["cooperate", "clarify", "transition"], ["hold", "advance", "consolidate"],
  ["withdraw", "hold", "transition"], ["advance", "hold", "advance"], ["advance", "cooperate", "advance"], ["hold", "withdraw", "obstruction"],
  ["cooperate", "hold", "consolidate"], ["clarify", "adjust", "obstruction"], ["adjust", "wait", "obstruction"], ["close", "advance", "renewal"],
  ["withdraw", "adjust", "transition"], ["advance", "cooperate", "advance"], ["close", "clarify", "closure"], ["hold", "clarify", "transition"],
  ["cooperate", "advance", "advance"], ["advance", "hold", "advance"], ["hold", "cooperate", "obstruction"], ["adjust", "hold", "consolidate"],
  ["adjust", "advance", "transition"], ["adjust", "advance", "renewal"], ["adjust", "clarify", "transition"], ["hold", "wait", "consolidate"],
  ["advance", "hold", "advance"], ["wait", "clarify", "transition"], ["advance", "hold", "advance"], ["withdraw", "clarify", "transition"],
  ["adjust", "cooperate", "transition"], ["cooperate", "clarify", "consolidate"], ["adjust", "clarify", "transition"], ["hold", "clarify", "consolidate"],
  ["clarify", "cooperate", "consolidate"], ["hold", "advance", "prepare"], ["close", "hold", "closure"], ["wait", "hold", "renewal"]
];

const SIGN_TYPE_BY_DIRECTION: Record<DirectionCode, string> = {
  advance: "进取之象",
  hold: "守成之象",
  wait: "待时之象",
  clarify: "明辨之象",
  adjust: "变通之象",
  cooperate: "协同之象",
  withdraw: "收减之象",
  close: "收束之象"
};

export const SIGN_ENTRIES = zhouyiCatalog.hexagrams.map((hexagram, index) => {
  const [primaryDirectionCode, secondaryDirectionCode, stage] = ENTRY_SPECS[index];
  return {
    id: `guaan-sign-${String(hexagram.number).padStart(2, "0")}`,
    systemId: SIGN_SYSTEM_ID,
    number: hexagram.number,
    hexagramNumber: hexagram.number,
    title: `${hexagram.name}签`,
    signType: SIGN_TYPE_BY_DIRECTION[primaryDirectionCode],
    stage,
    primaryDirectionCode,
    secondaryDirectionCode,
    contentStatus: "foundation",
    sourceNote: "经典正文引用对应《周易》卦辞、彖传与大象传；方向与阶段映射为蟾先森第一版结构化整理，正式展示前需逐签审校。",
    version: SIGN_THEORY_VERSION,
    isActive: true
  };
});

const SIGN_METHOD_RULE_SPECS: readonly [string, string, Record<string, unknown>, string][] = [
  ["period_resolution", "识别当前时段", { timezone: "user_profile_or_Asia/Shanghai", periods: ["morning", "noon", "afternoon", "evening"] }, "依据用户时区识别早签、午签、下午签或晚签。"],
  ["date_anchor", "晚签日期归属", { beforeHour: 6, belongsToPreviousDate: true }, "凌晨零点至五点五十九分仍属于前一日的晚签。"],
  ["one_draw_per_period", "每时段一支新签", { uniqueBy: ["userId", "signDate", "period"], repeatReturnsExisting: true }, "同一用户在同一签日与时段再次进入时展示原签，不重新抽取。"],
  ["uniform_draw", "六十四签等概率", { candidateCount: 64, weightedByPeriod: false }, "时段只影响签象落点，不暗中改变各签抽中概率。"],
  ["secure_random", "服务端安全随机", { algorithm: "crypto.randomInt", clientRandomForbidden: true }, "抽取必须在服务端完成，不使用 Math.random 或客户端传入的签号。"],
  ["immutable_draw", "解签不改变原签", { interpretationUsesStoredSign: true, redrawDuringConversation: false }, "点击解签、补充问题和继续对话始终围绕原签。"],
  ["interpretation_layers", "分层组合解签", { order: ["canonical_hexagram", "sign_entry", "period_profile", "question_domain", "user_context", "action"] }, "经典依据、时段落点和用户处境分层组合，并保留来源。"],
  ["no_fatalism", "禁止宿命化输出", { forbidden: ["必成", "必败", "命中注定", "灾祸保证", "第三方内心断言"] }, "签象只提供观察角度、成立条件和可执行方向。"],
  ["review_instead_of_redraw", "优先复盘而非重抽", { sameQuestionUsesFollowUp: true, materialChangeAllowsNewSession: true }, "同一问题优先回看行动与新事实，现实条件明显变化后再开启新会话。"]
];

export const SIGN_METHOD_RULES = SIGN_METHOD_RULE_SPECS.map(([code, title, rule, explanation], index) => ({
  id: `sign-method-${code}`,
  systemId: SIGN_SYSTEM_ID,
  step: index + 1,
  code,
  title,
  rule,
  explanation,
  version: SIGN_THEORY_VERSION,
  isActive: true
}));

if (ENTRY_SPECS.length !== 64 || SIGN_ENTRIES.length !== 64) {
  throw new Error("蟾先森易签必须完整映射六十四卦");
}
