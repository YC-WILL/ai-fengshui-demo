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
    "以生辰为体、今日为用，看见传统历法中的每日相应。",
  brandDisclaimerShort:
    "内容仅供传统文化、民俗参考与生活规划启发，不构成法律、医疗、投资、婚姻等专业决策建议。",
  // 视觉层用的极短免责（导航栏附近）
  brandMicroDisclaimer: "传统文化生活参考 · 非算命非改运",
  // SEO 描述
  seoDescription:
    "卦安 GuaAn · AI 国学生活顾问。以个人生辰为基础，对照每日干支、五行与节气，呈现可核验的传统文化结构。"
} as const;

export type Brand = typeof brand;

// ---------- 报告类型 → 页面化标题 ----------
// 不直接重命名 ReportType（要保留 DB 兼容），只重命名展示名。
import type { ReportType } from "@/lib/types";

export const PAGE_TITLE: Record<ReportType, string> = {
  daily_almanac: "今日黄历",
  bazi_basic: "聊聊你的性格与步调",
  bazi_deep: "把你的生活节奏细细看一遍",
  marriage_basic: "看看你们相处的步调",
  marriage_deep: "把你们的相处慢慢聊开",
  home_fengshui_basic: "一起看看这个家",
  home_fengshui_deep: "把这个家细细走一遍",
  date_selection_basic: "挑个从容的日子",
  date_selection: "把这段日子细细挑一遍"
};

// 入口卡片副标题（首页 / EntryGrid）
export const ENTRY_INTRO: Record<
  "bazi" | "marriage" | "fengshui" | "date-selection",
  { title: string; desc: string }
> = {
  "bazi": {
    title: "聊聊你的性格与步调",
    desc: "从传统文化的角度看看你的做事方式、生活节奏，以及有哪些小地方值得慢慢调整。"
  },
  "marriage": {
    title: "看看你们相处的步调",
    desc: "聊聊两个人合拍的地方、各自不同的节奏，以及怎样更好地听见彼此。"
  },
  "fengshui": {
    title: "住宅空间",
    desc: "结合传统风水文化与采光、通风、动线、收纳、心理舒适度，给出空间优化建议。"
  },
  "date-selection": {
    title: "民俗择日",
    desc: "每天可以先免费挑一挑合适的日子，再按需要细看更多备选与现实准备。"
  }
};
