import type { ReportType } from "../types";

type UnknownRecord = Record<string, unknown>;

const BASIC_SECTION_LIMITS: Partial<Record<ReportType, number>> = {
  bazi_basic: 180,
  marriage_basic: 200,
  home_fengshui_basic: 240,
  date_selection_basic: 180
};

const BASIC_TOTAL_LIMITS: Partial<Record<ReportType, number>> = {
  bazi_basic: 900,
  marriage_basic: 1000,
  home_fengshui_basic: 1300,
  date_selection_basic: 800
};

/**
 * Only expose fields that a basic report is allowed to discuss. This keeps
 * internal calculations and member-only comparisons out of the model input.
 */
export function prepareRuleResultForReport(
  reportType: ReportType,
  ruleResult: unknown
): unknown {
  const result = ruleResult as UnknownRecord;

  if (reportType === "bazi_basic") {
    return {
      coreConclusion: result.friendlyCoreConclusion,
      elementGuidance: result.friendlyElementNote,
      personalityProfile: normalizePersonalityProfile(result.personalityProfile),
      lifeReminders: takeStrings(result.lifeReminders, 2),
      lifeSuggestions: takeStrings(result.lifeSuggestions, 3),
      notes: takeStrings(result.notes, 2)
    };
  }

  if (reportType === "marriage_basic" || reportType === "marriage_deep") {
    const relation = (result.dayMasterRelation ?? {}) as UnknownRecord;
    return {
      interactionRhythm: relationKindToRhythm(relation.kind),
      communicationStyle: cleanRelationshipText(result.communicationStyle),
      sharedStrengths: takeStrings(result.strengths, 3).map(cleanRelationshipText),
      differencesToNotice: takeStrings(result.frictionPoints, 3).map(cleanRelationshipText),
      suggestions: takeStrings(result.suggestions, reportType === "marriage_basic" ? 3 : 6)
        .map(cleanRelationshipText),
      notes: ["传统结构仅作为弱参考，最终内容应落到双方真实的沟通与协商。"]
    };
  }

  if (reportType === "date_selection_basic") {
    const { notRecommended: _memberOnly, ...basic } = result;
    const recommended = Array.isArray(result.recommended)
      ? result.recommended.slice(0, 2).map(candidate => {
        const item = candidate as UnknownRecord;
        return { date: item.date, reasons: item.reasons };
      })
      : [];
    const planningHint = typeof result.personalPlanningHint === "string"
      ? result.personalPlanningHint
      : "";
    const preparationChecklist = takeStrings(result.preparationChecklist, 6)
      .filter(item => item !== planningHint)
      .slice(0, 3);
    return {
      ...basic,
      recommended,
      preparationChecklist
    };
  }

  return ruleResult;
}

/**
 * Apply deterministic mobile-reading and legal-copy boundaries after the AI
 * responds. The safety filter remains responsible for appending the one legal
 * disclaimer used by every report.
 */
export function normalizeGeneratedReport(
  reportType: ReportType,
  text: string,
  ruleResult: unknown
): string {
  let normalized = removeModelDisclaimerSections(normalizeMarkdownBreaks(text));

  if (reportType === "bazi_basic") {
    const profile = normalizePersonalityProfile(
      (ruleResult as UnknownRecord).personalityProfile
    );
    normalized = replaceSectionBody(normalized, /性格画像/, profile);
    normalized = normalized
      .replace(/完全缺席|完全缺少/g, "相对不显眼")
      .replace(/日主(?:为|是)?[甲乙丙丁戊己庚辛壬癸]?[木火土金水]?/g, "自身节奏");
  }

  if (reportType === "marriage_basic" || reportType === "marriage_deep") {
    normalized = scrubRelationshipTerms(normalized);
  }

  if (reportType === "home_fengshui_basic" || reportType === "home_fengshui_deep") {
    normalized = removeUnsupportedHomeAssertions(normalized);
  }

  if (reportType === "date_selection_basic" || reportType === "date_selection") {
    normalized = removeUnsupportedScheduleAssertions(normalized);
  }

  normalized = ensureThreeBasicActions(reportType, normalized, ruleResult);

  const sectionLimit = BASIC_SECTION_LIMITS[reportType];
  if (sectionLimit) normalized = limitSecondLevelSections(normalized, sectionLimit);
  const totalLimit = BASIC_TOTAL_LIMITS[reportType];
  if (totalLimit && normalized.length > totalLimit) {
    normalized = limitWholeReport(normalized, totalLimit);
  }

  return normalized.replace(/(?:\n\s*---\s*)+$/g, "").trim();
}

export function normalizePersonalityProfile(value: unknown): string {
  const fallback = "你有自己的做事方向，也愿意在行动中慢慢校准。从行为节奏看，你可能更习惯先抓住重点，再根据现实反馈调整；遇到重要决定时，也会希望事情既能推进，又不失去分寸。熟悉的方法能给你稳定感，变化来临时则可以多留一点观察和转身的空间。这不是固定标签，不妨结合真实经历，看看哪些地方更像现在的你。";
  const plain = typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : fallback;
  const source = plain.length >= 100 ? plain : fallback;
  return truncateAtNaturalBoundary(source, 180, 100);
}

function relationKindToRhythm(value: unknown): string {
  if (value === "same") return "双方步调较接近，容易快速理解彼此，也要留意共同惯性。";
  if (value === "sheng") return "一方较常主动支持，另一方较常承接回应，需要让付出保持双向。";
  if (value === "ke") return "双方回应和决策节奏不同，分歧时先确认各自在意的重点会更有效。";
  return "双方的相处方式需要结合真实生活继续观察。";
}

function cleanRelationshipText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/日主(?:组合|上)?[^：。]*[：:]?/g, "")
    .replace(/[ABＡＢ]\s*[（(][^）)]*[）)]\s*/g, "")
    .replace(/[ABＡＢ]\s*[→-]\s*[ABＡＢ]/g, "")
    .replace(/合并五行[^。]*。?/g, "")
    .replace(/生肖(?:关系)?传统认为/g, "从传统文化角度看")
    .replace(/\s+/g, " ")
    .trim();
}

function scrubRelationshipTerms(text: string): string {
  return text
    .replace(/[ABＡＢ]\s*[→-]\s*[ABＡＢ]/g, "")
    .replace(/\bA\s*[/／]\s*B\b/gi, "双方")
    .replace(/[甲乙丙丁戊己庚辛壬癸][木火土金水]\s*与\s*[甲乙丙丁戊己庚辛壬癸][木火土金水]/g, "双方")
    .replace(/甲方/g, "一方")
    .replace(/乙方/g, "另一方")
    .replace(/日主/g, "回应节奏")
    .replace(/[木火土金水]克[木火土金水]/g, "双方节奏有别")
    .replace(/生克(?:方向|关系)?/g, "互动方式")
    .replace(/(?:合并的?|双方的?)?五行分布/g, "共同的生活节奏")
    .replace(/[ \t]{2,}/g, " ");
}

function removeUnsupportedHomeAssertions(text: string): string {
  const unsupported = /(?:格局|骨架|户型本身|空间本身|通风(?:和|与)?采光|采光(?:和|与)?通风|通风条件|采光条件)[^。！？]*(?:踏实|舒展|够用|宽敞|不错|不差|良好|很好)/;
  return removeSentences(text, sentence => unsupported.test(sentence));
}

function removeUnsupportedScheduleAssertions(text: string): string {
  const unsupported = /(?:对方|参与方|相关人员)[^。！？]*(?:忙乱|有空|方便|容易约|在岗)/;
  const conditional = /(?:如果|若|建议|请|需要|先)[^。！？]{0,20}(?:对方|参与方|相关人员)[^。！？]*(?:确认|是否|在岗)/;
  return removeSentences(text, sentence => unsupported.test(sentence) && !conditional.test(sentence));
}

function ensureThreeBasicActions(
  reportType: ReportType,
  text: string,
  ruleResult: unknown
): string {
  const result = ruleResult as UnknownRecord;
  const config: Partial<Record<ReportType, { heading: RegExp; items: unknown }>> = {
    bazi_basic: { heading: /三句小建议/, items: result.lifeSuggestions },
    marriage_basic: { heading: /三句相处建议/, items: result.suggestions },
    home_fengshui_basic: { heading: /三件事/, items: result.improvementsZeroBudget },
    date_selection_basic: { heading: /三件事/, items: result.preparationChecklist }
  };
  const selected = config[reportType];
  const items = takeStrings(selected?.items, 3);
  if (!selected || items.length < 3) return text;

  const sections = text.split(/\n(?=##\s)/);
  return sections.map(section => {
    const newline = section.indexOf("\n");
    if (newline < 0 || !selected.heading.test(section.slice(0, newline))) return section;
    const body = section.slice(newline + 1);
    const actionCount = (body.match(/^(?:[-*]|\d+\.)\s/gm) ?? []).length
      + (body.match(/^\*\*\d+\./gm) ?? []).length;
    if (actionCount >= 3) return section;
    return `${section.slice(0, newline)}\n${items.map(item => `- ${item}`).join("\n")}`;
  }).join("\n");
}

function removeSentences(text: string, shouldRemove: (sentence: string) => boolean): string {
  return text
    .split(/(?<=[。！？])/)
    .filter(sentence => !shouldRemove(sentence))
    .join("")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizeMarkdownBreaks(text: string): string {
  let normalized = text
    .replace(/[ \t]+---[ \t]+(?=#{1,3}\s)/g, "\n\n---\n\n")
    .replace(/[ \t]+(?=#{1,3}\s)/g, "\n\n")
    .replace(/[ \t]+(?=(?:[-*]|\d+\.)\s+\*\*)/g, "\n")
    .replace(/[ \t]+(?=\*\*(?:第一|第二|第三)(?:句|条)[：:]\*\*)/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n");
  const knownHeadings = [
    "先说说整体印象", "看看五行的小提示", "来看看你的性格画像", "有两件事想提醒你", "给你三句小建议",
    "先说说你们相处的感觉", "看看你们各自的步调", "你们合拍的地方", "有些不同也值得听见", "给你们三句相处建议",
    "先说说这个家的整体感觉", "我们从门口慢慢走一圈", "逐个看看你在意的空间", "有几处想轻轻提醒你", "不花钱也可以先做这三件事",
    "先说说这段日子", "这是为你挑出的日子", "日子之外，先准备好这三件事", "留一句话", "留一句温和收尾"
  ];
  for (const heading of knownHeadings) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(
      new RegExp(`(##\\s+(?:\\d+\\.\\s*)?${escaped})[ \\t]+`, "g"),
      "$1\n"
    );
  }
  return normalized;
}

function takeStrings(value: unknown, limit: number): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, limit)
    : [];
}

function removeModelDisclaimerSections(text: string): string {
  const sections = text.split(/\n(?=##\s)/);
  return sections
    .filter(section => !/^##\s+.*(?:免责声明|最后说一句|最后再叮嘱一句)/m.test(section))
    .join("\n");
}

function replaceSectionBody(text: string, heading: RegExp, body: string): string {
  const sections = text.split(/\n(?=##\s)/);
  return sections.map(section => {
    const newline = section.indexOf("\n");
    if (newline < 0 || !heading.test(section.slice(0, newline))) return section;
    return `${section.slice(0, newline)}\n${body}`;
  }).join("\n");
}

function limitSecondLevelSections(text: string, maxBodyLength: number): string {
  const sections = text.split(/\n(?=##\s)/);
  return sections.map(section => {
    const newline = section.indexOf("\n");
    if (newline < 0) return section;
    const heading = section.slice(0, newline);
    const body = section.slice(newline + 1).trim();
    return `${heading}\n${truncateMarkdownBody(body, maxBodyLength, 80)}`;
  }).join("\n");
}

function limitWholeReport(text: string, maxLength: number): string {
  const sections = text.split(/\n(?=##\s)/);
  const reportTitle = sections.shift() ?? "";
  const headingLength = sections.reduce((sum, section) => {
    const newline = section.indexOf("\n");
    return sum + (newline < 0 ? section.length : newline) + 2;
  }, reportTitle.length);
  const bodyBudget = Math.max(70, Math.floor((maxLength - headingLength) / Math.max(sections.length, 1)));
  return [reportTitle, ...sections.map(section => {
    const newline = section.indexOf("\n");
    if (newline < 0) return section;
    return `${section.slice(0, newline)}\n${truncateMarkdownBody(section.slice(newline + 1).trim(), bodyBudget, 50)}`;
  })].join("\n").trim();
}

function truncateMarkdownBody(text: string, max: number, min: number): string {
  if (text.length <= max) return text;
  const listStart = text.search(/^(?:[-*]|\d+\.)\s/m);
  if (listStart >= 0) {
    const intro = text.slice(0, listStart).trim();
    const items = text.slice(listStart)
      .split(/(?=^(?:[-*]|\d+\.)\s)/gm)
      .map(item => item.trim())
      .filter(Boolean);
    if (items.length >= 3) {
      const available = Math.max(max - intro.length - 4, 150);
      const perItem = Math.max(50, Math.floor(available / items.length));
      const shortened = items.map(item => truncateAtNaturalBoundary(item, perItem, 35));
      return [intro, shortened.join("\n")].filter(Boolean).join("\n");
    }
  }
  return truncateAtNaturalBoundary(text, max, min);
}

function truncateAtNaturalBoundary(text: string, max: number, min: number): string {
  if (text.length <= max) return text;
  const candidate = text.slice(0, max);
  for (const boundaries of [["。", "！", "？", "；"], ["，", "\n"]]) {
    const cut = Math.max(...boundaries.map(mark => candidate.lastIndexOf(mark)));
    if (cut + 1 >= min) return candidate.slice(0, cut + 1).trim();
  }
  return candidate.trim();
}
