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
    return {
      ...basic,
      recommended,
      preparationChecklist: takeStrings(result.preparationChecklist, 3)
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
  let normalized = removeModelDisclaimerSections(text);

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

  const sectionLimit = BASIC_SECTION_LIMITS[reportType];
  if (sectionLimit) normalized = limitSecondLevelSections(normalized, sectionLimit);
  const totalLimit = BASIC_TOTAL_LIMITS[reportType];
  if (totalLimit && normalized.length > totalLimit) {
    normalized = limitWholeReport(normalized, totalLimit);
  }

  return normalized.trim();
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
    .replace(/\s{2,}/g, " ");
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
    return `${heading}\n${truncateAtNaturalBoundary(body, maxBodyLength, 80)}`;
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
    return `${section.slice(0, newline)}\n${truncateAtNaturalBoundary(section.slice(newline + 1).trim(), bodyBudget, 50)}`;
  })].join("\n").trim();
}

function truncateAtNaturalBoundary(text: string, max: number, min: number): string {
  if (text.length <= max) return text;
  const candidate = text.slice(0, max);
  const boundaries = ["。", "！", "？", "；", "\n"];
  let cut = -1;
  for (const mark of boundaries) cut = Math.max(cut, candidate.lastIndexOf(mark));
  if (cut + 1 >= min) return candidate.slice(0, cut + 1).trim();
  return candidate.trim();
}
