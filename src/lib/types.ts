// ============================================================
// 共享类型定义
// ============================================================

export type ReportType =
  | "daily_almanac"
  | "bazi_basic"
  | "bazi_deep"
  | "marriage_basic"
  | "marriage_deep"
  | "home_fengshui_basic"
  | "home_fengshui_deep"
  | "date_selection_basic"
  | "date_selection";

export type ReportStatus = "draft" | "generated" | "blocked" | "paid" | "failed";

export type ReportTier = "basic" | "deep";

export type Gender = "male" | "female" | "other";

// ----------------- 八字输入 -----------------
export interface BaziInput {
  gender: Gender;
  birthDate: string; // yyyy-MM-dd
  birthTime: string; // HH:mm
  birthLocation?: string;
  unknownTime?: boolean;
  /** 用户希望报告回应的当前困境、想法或具体场景。 */
  userContext?: string;
}

// ----------------- 婚姻匹配输入 -----------------
export interface MarriageInput {
  partyA: BaziInput;
  partyB: BaziInput;
  relationshipStage?: "dating" | "engaged" | "married" | "considering";
  notes?: string;
}

// ----------------- 住宅风水输入 -----------------
export interface FengShuiInput {
  orientation: string; // 朝南 / 朝北 ...
  layout: string;      // 户型描述 / 户型代号
  rooms: Array<{
    name: string;        // 卧室 / 厨房 ...
    note?: string;
  }>;
  primaryConcerns?: string;
  floorPlanText?: string; // MVP: 用户文字描述户型；后续可加图像
}

// ----------------- 择日输入 -----------------
export type DateSelectionEvent =
  | "wedding"
  | "moving"
  | "opening"
  | "signing"
  | "travel"
  | "renovation_start";

export interface DateSelectionInput {
  event: DateSelectionEvent;
  dateRangeStart: string; // yyyy-MM-dd
  dateRangeEnd: string;
  user: BaziInput;
  notes?: string;
}

// ----------------- AI 调用 -----------------
export interface AIGenerateInput {
  reportType: ReportType;
  tier: ReportTier;
  systemPrompt: string;
  userPrompt: string;
  ruleResult: unknown;
  userId: string;
  reportId?: string;
}

export interface AIGenerateOutput {
  text: string;
  provider: string;
  model: string;
  reasoningEffort?: string;
  promptTokens?: number;
  completionTokens?: number;
  finishReason?: string;
  metadata?: Record<string, unknown>;
  raw?: unknown;
  fallbackUsed?: boolean;
}

// ----------------- 安全过滤 -----------------
export type SafetyAction = "soften" | "rewrite" | "block" | "ok";

export interface SafetyMatch {
  ruleName: string;
  pattern: string;
  severity: "low" | "medium" | "high";
  action: SafetyAction;
  match: string;
}

export interface SafetyResult {
  ok: boolean;            // false = 被阻断
  matches: SafetyMatch[]; // 命中规则
  text: string;           // 处理后的文本
  blocked: boolean;
  rewritten: boolean;
}

// ----------------- 会员 -----------------
export type MembershipPlan = "monthly" | "annual";

export const MEMBERSHIP_PRICING: Record<MembershipPlan, {
  amountFen: number;
  currency: "CNY";
  label: string;
}> = {
  monthly: { amountFen: 1800, currency: "CNY", label: "月度常伴" },
  annual: { amountFen: 12800, currency: "CNY", label: "年度常伴" }
};

export const MEMBER_REPORT_TYPES: ReportType[] = [
  "bazi_deep",
  "marriage_deep",
  "home_fengshui_deep",
  "date_selection"
];

export function isMemberReportType(reportType: ReportType): boolean {
  return MEMBER_REPORT_TYPES.includes(reportType);
}

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  daily_almanac: "今日黄历",
  bazi_basic: "聊聊你的性格与步调",
  bazi_deep: "把你的生活节奏细细看一遍",
  marriage_basic: "看看你们相处的步调",
  marriage_deep: "把你们的相处慢慢聊开",
  home_fengshui_basic: "住宅基础参考",
  home_fengshui_deep: "住宅深度参考",
  date_selection_basic: "择日基础参考",
  date_selection: "择日深度参考"
};
