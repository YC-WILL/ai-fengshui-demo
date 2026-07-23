import type { ReportType } from "../types";

export interface NarrativeQualityResult {
  ok: boolean;
  issues: string[];
  maxRecentSimilarity: number;
  maxSectionSimilarity: number;
}

/**
 * 相似度是质量信号，不应把用户挡在报告门外：章节骨架、免责声明和
 * 常见建议天然会产生相似文本。只有内容安全/结构性问题才阻断交付。
 */
export function hasBlockingNarrativeIssues(result: NarrativeQualityResult): boolean {
  return result.issues.some(issue =>
    issue.startsWith("缺少章节") ||
    issue.startsWith("性格画像长度") ||
    issue === "行动建议不足 3 条" ||
    issue === "报告章节不完整" ||
    issue === "出现空泛通用话术" ||
    issue === "出现不应展示的内部术语或星座名称"
  );
}

const GENERIC_COPY = /有自己的步调|有自己的方向|站稳脚跟|留一点空间|慢慢调整|相信自己|做更好的自己|一切都会好起来/;
const INTERNAL_TERMS = /日主|四柱|五行分布|生克方向|星座|白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座/;

export function assessReportNarrativeQuality(
  reportType: ReportType,
  text: string,
  recentReports: string[] = []
): NarrativeQualityResult {
  const issues: string[] = [];
  const sections = secondLevelSections(text);
  const profile = sectionBody(sections, /性格画像/);
  const advice = sectionBody(sections, /建议|三件事/);
  const required = reportType === "bazi_basic"
    ? [/整体印象/, /五行/, /性格画像/, /提醒/, /建议/]
    : [];

  for (const heading of required) {
    if (!sections.some(section => heading.test(section.heading))) {
      issues.push(`缺少章节：${heading.source}`);
    }
  }
  if (reportType === "bazi_basic" && (profile.length < 100 || profile.length > 180)) {
    issues.push(`性格画像长度为 ${profile.length}，应为 100–180 字`);
  }
  if (listItemCount(advice) < 3) issues.push("行动建议不足 3 条");
  const minimumSections: Partial<Record<ReportType, number>> = {
    bazi_basic: 5,
    marriage_basic: 5,
    home_fengshui_basic: 5,
    date_selection_basic: 3
  };
  if (sections.length < (minimumSections[reportType] ?? 1)) issues.push("报告章节不完整");
  if (GENERIC_COPY.test(text)) issues.push("出现空泛通用话术");
  if (INTERNAL_TERMS.test(text)) issues.push("出现不应展示的内部术语或星座名称");

  const contentSections = sections
    .filter(section => !/免责声明/.test(section.heading))
    .map(section => canonicalBody(section.body))
    .filter(body => body.length >= 30);
  const sectionSimilarities = pairwiseSimilarities(contentSections);
  const maxSectionSimilarity = Math.max(0, ...sectionSimilarities);
  if (maxSectionSimilarity >= 0.68) issues.push("报告内部章节表达重复");

  const current = canonicalBody(text);
  const recentSimilarities = recentReports
    .map(canonicalBody)
    .filter(body => body.length >= 80)
    .map(body => bigramSimilarity(current, body));
  const maxRecentSimilarity = Math.max(0, ...recentSimilarities);
  if (maxRecentSimilarity >= 0.55) issues.push("与近期报告正文过度相似");

  return {
    ok: issues.length === 0,
    issues,
    maxRecentSimilarity,
    maxSectionSimilarity
  };
}

export function assessBaziNarrativeQuality(
  text: string,
  recentReports: string[] = []
): NarrativeQualityResult {
  return assessReportNarrativeQuality("bazi_basic", text, recentReports);
}

export function buildNarrativeRepairPrompt(
  originalUserPrompt: string,
  previousDraft: string,
  issues: string[]
): string {
  return [
    originalUserPrompt,
    "",
    "上一版没有通过蟾先森的非模板化质量检查，请重新从结构化输入独立组织全文。",
    `未通过原因：${issues.join("；") || "表达不够独立"}。`,
    "不得复制上一版句子，不得逐句照抄结构化输入；保留其中的个人事实，但更换叙述顺序、情境和表达方式。",
    "只有章节标题可以固定。正文每一节都要写成针对这个人的自然表达，并让提醒、建议能追溯到前文具体行为。",
    "【上一版草稿开始】",
    previousDraft.slice(0, 5000),
    "【上一版草稿结束】"
  ].join("\n");
}

export function bigramSimilarity(first: string, second: string): number {
  if (!first || !second) return 0;
  const a = bigrams(first);
  const b = bigrams(second);
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return [...a].filter(item => b.has(item)).length / union.size;
}

function secondLevelSections(text: string): Array<{ heading: string; body: string }> {
  return text.split(/\n(?=##\s)/).flatMap(section => {
    if (!section.startsWith("## ")) return [];
    const newline = section.indexOf("\n");
    return [{
      heading: newline < 0 ? section : section.slice(0, newline),
      body: newline < 0 ? "" : section.slice(newline + 1).trim()
    }];
  });
}

function sectionBody(
  sections: Array<{ heading: string; body: string }>,
  heading: RegExp
): string {
  return sections.find(section => heading.test(section.heading))?.body ?? "";
}

function listItemCount(text: string): number {
  return (text.match(/^(?:[-*]|\d+\.)\s/gm) ?? []).length
    + (text.match(/^\*\*\d+\./gm) ?? []).length;
}

function canonicalBody(text: string): string {
  return text
    .split(/\*\*免责声明\*\*|##\s*免责声明/)[0]
    .replace(/^#{1,3}[^\n]*$/gm, "")
    .replace(/[*_`>#\-\d.、，。；：！？（）()“”"'\s]/g, "")
    .trim();
}

function bigrams(value: string): Set<string> {
  return new Set(
    Array.from({ length: Math.max(value.length - 1, 0) }, (_, index) => value.slice(index, index + 2))
  );
}

function pairwiseSimilarities(values: string[]): number[] {
  return values.flatMap((first, index) =>
    values.slice(index + 1).map(second => bigramSimilarity(first, second))
  );
}
