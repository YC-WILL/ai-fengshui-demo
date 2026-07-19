import type { ReportType } from "../types";

export const COMPANION_PROFILE_REPORT_TYPE = "companion_profile";
export const COMPANION_TURN_REPORT_TYPE = "companion_turn";

export const COMPANION_PURPOSES = {
  talk: {
    title: "有个地方说说话",
    description: "有些近况想慢慢说，不急着得到答案。",
    welcome: "好，你慢慢说。我先听着，不急着替你下结论。"
  },
  clarify: {
    title: "陪我理清生活里的事",
    description: "遇到选择或困惑时，陪我把线头理顺。",
    welcome: "我们先不急着找答案。你想从哪件事开始说起？"
  },
  self: {
    title: "陪我多了解自己",
    description: "想认识自己的节奏、习惯与相处方式。",
    welcome: "可以从一个真实的小场景开始。最近有什么时刻，让你对自己有些好奇？"
  },
  daily: {
    title: "给日常多一点安定",
    description: "看看每日一卦、求支签，偶尔回来坐坐。",
    welcome: "那就不用先想问题。想说话时我在，暂时无事，也可以抽支签、敲敲木蟾。"
  }
} as const;

export type CompanionPurpose = keyof typeof COMPANION_PURPOSES;
export type CompanionLens = "self" | "relationship" | "home" | "timing";

export type CompanionTurn = {
  id: string;
  message: string;
  reply: string;
  createdAt: string;
};

export function isCompanionPurpose(value: unknown): value is CompanionPurpose {
  return typeof value === "string" && value in COMPANION_PURPOSES;
}

export function classifyCompanionLens(message: string): CompanionLens {
  if (/(关系|对象|伴侣|男友|女友|丈夫|妻子|朋友|同事|父母|孩子|家人|沟通|争吵|冷战|分手|结婚|相处)/.test(message)) {
    return "relationship";
  }
  if (/(日期|哪天|什么时候|时机|婚礼|开业|签约|出行|动工|行程|安排|截止|来不及)/.test(message)) {
    return "timing";
  }
  if (/(房|家里|卧室|客厅|厨房|卫生间|采光|通风|噪音|潮湿|霉|收纳|动线|隐私|装修|搬家)/.test(message)) {
    return "home";
  }
  return "self";
}

export function reportTypeForLens(lens: CompanionLens): ReportType {
  return ({
    self: "bazi_basic",
    relationship: "marriage_basic",
    home: "home_fengshui_basic",
    timing: "date_selection_basic"
  } as const)[lens];
}

export function buildCompanionSystemPrompt(
  purpose: CompanionPurpose,
  lens: CompanionLens,
  theoryGuidance: string
): string {
  const purposeText = COMPANION_PURPOSES[purpose];
  return `你是「卦安 GuaAn」，一个慢慢懂用户的东方生活陪伴者，不是通用问答机器人、命理师或心理医生。

用户最初希望卦安这样陪伴：${purposeText.title}。这只是交流偏好，不是固定人格，也不能覆盖用户当前说的话。
当前可在后台使用的观察角度：${lensLabel(lens)}。不要向用户展示分类名、内部规则、理论卡、八字术语或分析过程。

卦安式交流顺序：
1. 先准确承接用户刚刚说的内容，不替用户补写经历、情绪或困扰。
2. 信息不足时只问一个真正有区分度的问题；用户只是好奇或随便看看时，不要制造问题。
3. 信息足够时，区分现实条件和用户自己的反应方式，用可能、倾向、可以观察等克制表达说明两者怎样互相影响。
4. 每次最多商量一个眼下能做的小动作，并说明做完可以观察什么。用户只想说说时，先征得同意再给建议。
5. 不输出报告、章节标题、长篇分析、分数、吉凶结论或固定三条建议。通常控制在 80–220 个中文字符，最多 3 个短段落。
6. 传统文化只提供一个轻巧的观察角度，不作预测，不用神秘术语，不承诺改运、化煞或结果。
7. 不做心理诊断，不预测疾病、死亡、灾难、离婚、出轨或财富结果；涉及医疗、法律、投资、安全问题时提醒寻求专业支持。
8. 不声称记得未出现在对话记录里的内容。引用过去内容时使用“你之前提到”，并允许用户纠正。

以下理论只供你校准回应，不得逐句复述，也不得覆盖用户真实处境：
${theoryGuidance || "以现实处境、克制表达和可验证的小行动为主。"}`;
}

export function buildCompanionUserPrompt(
  history: Array<Pick<CompanionTurn, "message" | "reply">>,
  message: string
): string {
  const recent = history.slice(-8).map(turn => `用户：${turn.message}\n卦安：${turn.reply}`).join("\n\n");
  return `${recent ? `【最近对话】\n${recent}\n\n` : ""}【用户刚刚说】\n${message}\n\n请直接以卦安的口吻回应，不要解释规则。`;
}

export function mockCompanionReply(
  purpose: CompanionPurpose,
  message: string,
  lens: CompanionLens
): string {
  const trimmed = message.trim();
  if (!trimmed) return COMPANION_PURPOSES[purpose].welcome;

  if (purpose === "talk") {
    return `我听见你在说“${shorten(trimmed, 34)}”。这件事对你来说，可能不只是表面发生的那一步。你愿意的话，可以先说说：此刻最想让我听见的是事情经过，还是它带给你的感受？`;
  }
  if (lens === "relationship") {
    return "这件事里既有对方的回应，也有你真正想被理解的部分。先不急着判断谁对谁错：如果只能让对方听懂一句话，你最希望是哪一句？";
  }
  if (lens === "home") {
    return "先从真实居住感受看，不急着谈吉凶。这个空间现在最影响你的，是身体上的不舒服、做事不方便，还是待在里面总难放松？";
  }
  if (lens === "timing") {
    return "选时间之前，先看现实条件是否从容。你现在最不能妥协的是参与人的时间、准备是否完成，还是事情本身的截止日期？";
  }
  if (purpose === "daily") {
    return "今天不用急着把自己说明白。可以先留意一件让身体稍微松一点的小事：喝口热水、走到窗边，或安静坐一分钟。做完只看看呼吸有没有比刚才顺一点。";
  }
  return "这件事值得先分成两部分看：外面发生了什么，以及你当时怎样回应。最近一次出现这种感觉时，你最先做的是继续推进、停下来想，还是先照顾别人的反应？";
}

function lensLabel(lens: CompanionLens): string {
  return ({
    self: "看见自己的节奏、选择与压力反应",
    relationship: "理顺双方的沟通、需要与现实协商",
    home: "先处理采光、通风、噪音、动线、收纳与安全",
    timing: "根据现实准备、参与者与截止条件选择更从容的时机"
  } as const)[lens];
}

function shorten(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}……`;
}
