// ============================================================
// 品牌配置（卦安 GuaAn · 单一来源）
//
// 所有用户可见的品牌名、副标题、宣传语、disclaimer 短语一律
// 从这里读取；新增/替换品牌只需改本文件。
//
// 改名注意：
//   1. 修改 brandNameZh / brandNameEn / brandFullName 后，
//      还需要更新 `package.json` 的 description、Vercel 项目名、
//      仓库名等外部资源（这些不在本仓库内）。
//   2. metadata.title / 各 legal 页 / Prompt 中也通过本文件读取。
// ============================================================

export const brand = {
  brandNameZh: "卦安",
  brandNameEn: "GuaAn",
  brandFullName: "卦安 GuaAn",
  taglineZh: "AI 国学生活顾问",
  subtitleZh:
    "结合传统历法、空间环境建议与心理学框架，生成可执行的黄历、八字、关系与住宅空间参考报告。",
  brandDisclaimerShort:
    "内容仅供传统文化、民俗参考与生活规划启发，不构成法律、医疗、投资、婚姻等专业决策建议。",
  // 视觉层用的极短免责（导航栏附近）
  brandMicroDisclaimer: "传统文化生活参考 · 非算命非改运",
  // SEO 描述
  seoDescription:
    "卦安 GuaAn · AI 国学生活顾问。基于传统历法、空间环境建议与心理学框架，输出黄历、八字、关系与住宅空间的生活参考报告。所有内容仅供文化与生活规划参考。"
} as const;

export type Brand = typeof brand;

// ---------- 报告类型 → 页面化标题 ----------
// 不直接重命名 ReportType（要保留 DB 兼容），只重命名展示名。
import type { ReportType } from "@/lib/types";

export const PAGE_TITLE: Record<ReportType, string> = {
  daily_almanac: "今日黄历",
  bazi_basic: "八字参考报告",
  bazi_deep: "八字深度参考报告",
  marriage_basic: "关系匹配报告",
  marriage_deep: "关系匹配深度报告",
  home_fengshui_basic: "一起看看这个家",
  home_fengshui_deep: "把这个家细细走一遍",
  date_selection: "民俗择日参考"
};

// 入口卡片副标题（首页 / EntryGrid）
export const ENTRY_INTRO: Record<
  "bazi" | "marriage" | "fengshui" | "date-selection",
  { title: string; desc: string }
> = {
  "bazi": {
    title: "八字参考",
    desc: "从传统命理结构出发，分析五行分布、性格倾向、生活节奏与可执行建议。"
  },
  "marriage": {
    title: "关系匹配",
    desc: "结合传统文化结构与心理学沟通框架，分析双方关系优势、潜在摩擦与沟通建议。"
  },
  "fengshui": {
    title: "住宅空间",
    desc: "结合传统风水文化与采光、通风、动线、收纳、心理舒适度，给出空间优化建议。"
  },
  "date-selection": {
    title: "民俗择日",
    desc: "基于传统黄历与民俗规则，提供日期参考与现实准备清单。"
  }
};
