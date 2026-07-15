// ============================================================
// 内容安全规则（卦安 GuaAn）
//
// 三档严重度 + 三种动作：
//   low    → soften  ：替换为克制表达
//   medium → rewrite ：触发段落重写（在 filter 层实现）
//   high   → block   ：阻断报告，提示安全
//
// 这是默认 inline 规则集；运行时可叠加 ContentSafetyRule 表中规则。
// ============================================================

export type Severity = "low" | "medium" | "high";
export type Action = "soften" | "rewrite" | "block";

export interface InlineRule {
  name: string;
  /** 正则表达式（不带斜杠和 flag，匹配时统一加 g + i） */
  pattern: string;
  severity: Severity;
  action: Action;
  /** soften 类规则：命中后替换文本 */
  replacement?: string;
}

// ---------- 高风险：直接阻断 ----------
const HIGH_RISK_RULES: InlineRule[] = [
  // 生死/疾病/灾祸预测
  { name: "death_prediction",      pattern: "(死亡|绝症|寿命剩|寿命预测|大限|命不久矣)", severity: "high", action: "block" },
  { name: "disaster_prediction",   pattern: "(血光之灾|大凶|必有灾|灭门|横祸难逃)",       severity: "high", action: "block" },

  // 金融/彩票/股票
  { name: "stock_lottery",         pattern: "(必涨|涨停|彩票号码|彩票必中|这只股票必|今晚开奖号|股票推荐|推荐股票|内幕股|内部消息股)", severity: "high", action: "block" },
  { name: "guarantee_wealth",      pattern: "(必发财|必破财|保证发财|包你发财|稳赚不赔|投资必赚|投资必盈|理财必赚)",                 severity: "high", action: "block" },

  // 婚姻强判断
  { name: "guarantee_breakup",     pattern: "(必离婚|必分手|必出轨|必背叛|必复合|必结婚|必克夫|必克妻|克夫克妻)",                 severity: "high", action: "block" },
  { name: "fate_marriage_label",   pattern: "(绝对正缘|孽缘|烂桃花|烂桃花注定|前世孽债)",                                          severity: "high", action: "block" },

  // 改命 / 消灾 / 化煞营销
  { name: "change_fate",           pattern: "(改命|消灾|开光保证|化太岁保证|化煞保证|续命|渡劫保证)",                                severity: "high", action: "block" },

  // 医疗替代
  { name: "medical_replace",       pattern: "(不需要看医生|不用看医生|不需要吃药|不用吃药|风水治病|可以治愈癌症|拒绝就医)",         severity: "high", action: "block" }
];

// ---------- 中风险：段落重写 ----------
const MEDIUM_RISK_RULES: InlineRule[] = [
  { name: "absolute_judgement_marriage", pattern: "(他一定出轨|她一定出轨|你们注定分手|不适合结婚|你们一定离婚)",   severity: "medium", action: "rewrite" },
  { name: "absolute_judgement_money",    pattern: "(一定破财|这个月必破财|今年破财|大破财|马上破财)",                severity: "medium", action: "rewrite" },
  { name: "fengshui_guarantee",          pattern: "(这个布局一定发财|此宅必旺|此宅必衰|百分百旺财|风水一定发财)",   severity: "medium", action: "rewrite" },
  { name: "diagnose_disease",            pattern: "(你会得.{0,6}(癌|病|症)|你患有.{0,8}(癌|病|症)|今年生大病)",      severity: "medium", action: "rewrite" }
];

// ---------- 低风险：软化措辞 ----------
const LOW_RISK_RULES: InlineRule[] = [
  { name: "absolute_word_biran",      pattern: "必然",                    severity: "low", action: "soften", replacement: "更倾向于" },
  { name: "absolute_word_yiding",     pattern: "(?<!不)一定(?!程度)",     severity: "low", action: "soften", replacement: "更可能" },
  { name: "absolute_word_baozheng",   pattern: "保证(?!金)",              severity: "low", action: "soften", replacement: "更有助于" },
  { name: "absolute_word_baifenbai",  pattern: "(百分百|100%)",           severity: "low", action: "soften", replacement: "较大概率" },
  { name: "absolute_word_zhuding",    pattern: "(注定|命中注定|逃不过)",  severity: "low", action: "soften", replacement: "传统文化中倾向认为" },
  { name: "absolute_word_dakai",      pattern: "开光(?!保证)",            severity: "low", action: "soften", replacement: "传统仪式" },
  { name: "absolute_word_baoping",    pattern: "保平安",                  severity: "low", action: "soften", replacement: "求心安" }
];

export const INLINE_RULES: InlineRule[] = [
  ...HIGH_RISK_RULES,
  ...MEDIUM_RISK_RULES,
  ...LOW_RISK_RULES
];

// ---------- 报告底部固定免责声明 ----------
// 卦安 GuaAn 品牌口径——所有 AI 报告底部统一追加
export const DISCLAIMER_BLOCK = `
---

**免责声明**

本报告由「卦安 GuaAn · AI 国学生活顾问」基于传统历法、民俗文化与心理学框架自动生成，**仅供文化参考、生活规划启发与娱乐参考**，不构成医疗、法律、投资、婚姻、职业等任何专业决策建议。报告可能存在偏差，请以现实判断为准。请勿将本报告作为重大决策的唯一依据；涉及健康、法律、财务等重要事项时，请咨询相应专业人士。
`.trim();
