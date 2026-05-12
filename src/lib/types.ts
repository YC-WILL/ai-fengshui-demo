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

// ----------------- 价目 -----------------
export interface ReportPricing {
  amountFen: number;  // 分
  currency: "CNY";
  label: string;
}

export const REPORT_PRICING: Record<ReportType, ReportPricing | null> = {
  daily_almanac: null,
  bazi_basic: null,
  marriage_basic: null,
  home_fengshui_basic: null,
  bazi_deep: { amountFen: 3900, currency: "CNY", label: "八字深度报告" },
  marriage_deep: { amountFen: 4900, currency: "CNY", label: "关系匹配报告" },
  home_fengshui_deep: { amountFen: 6900, currency: "CNY", label: "住宅空间报告" },
  date_selection: { amountFen: 2900, currency: "CNY", label: "择日深度报告" }
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  daily_almanac: "今日黄历",
  bazi_basic: "八字基础参考",
  bazi_deep: "八字深度参考",
  marriage_basic: "关系基础参考",
  marriage_deep: "关系深度参考",
  home_fengshui_basic: "住宅基础参考",
  home_fengshui_deep: "住宅深度参考",
  date_selection: "择日参考"
};
