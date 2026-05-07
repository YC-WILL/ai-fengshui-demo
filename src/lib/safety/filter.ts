// ============================================================
// safetyFilter
//
// 输入：AI 输出的文本
// 输出：SafetyResult { ok, blocked, rewritten, text, matches }
//
// 处理顺序：
//   1. 先扫描高风险词 → 任意命中直接 block
//   2. 再扫描中风险 → 标记需要 rewrite 的段落（MVP 用克制提示替换原句）
//   3. 最后扫描低风险 → 全文 replace 软化措辞
//   4. 拼接 disclaimer
// ============================================================

import { INLINE_RULES, DISCLAIMER_BLOCK, type InlineRule } from "./rules";
import type { SafetyMatch, SafetyResult } from "../types";

const REWRITE_NOTICE =
  "（本段含绝对化判断，已替换为克制表达：我们建议从沟通、行动与现实条件出发审视该问题，避免单一结论。）";

export function safetyFilter(input: string): SafetyResult {
  let text = input ?? "";
  const matches: SafetyMatch[] = [];

  // ---- 高风险扫描 ----
  for (const rule of INLINE_RULES.filter(r => r.severity === "high")) {
    const re = new RegExp(rule.pattern, "gi");
    const m = text.match(re);
    if (m && m.length > 0) {
      matches.push(...m.map(s => ruleToMatch(rule, s)));
    }
  }
  if (matches.some(m => m.severity === "high")) {
    return {
      ok: false,
      blocked: true,
      rewritten: false,
      matches,
      text:
        "出于内容安全考虑，本次报告未通过我们的合规检查，已停止输出。\n\n" +
        "我们不会就生死、灾祸、医疗诊断、彩票股票、绝对婚姻判断等做出预测或承诺。\n" +
        "请尝试调整问题描述，或更换报告类型。\n\n" +
        DISCLAIMER_BLOCK
    };
  }

  // ---- 中风险：段落级重写 ----
  let rewritten = false;
  const mediumRules = INLINE_RULES.filter(r => r.severity === "medium");
  if (mediumRules.length > 0) {
    const paragraphs = text.split(/\n{2,}/);
    const newParagraphs = paragraphs.map(p => {
      const hits: InlineRule[] = [];
      for (const rule of mediumRules) {
        const re = new RegExp(rule.pattern, "gi");
        const m = p.match(re);
        if (m && m.length > 0) {
          hits.push(rule);
          matches.push(...m.map(s => ruleToMatch(rule, s)));
        }
      }
      if (hits.length === 0) return p;
      rewritten = true;
      // 重写策略：保留原段落但删除高风险句、追加克制提示
      const cleaned = p
        .split(/(?<=[。！？!?])/)
        .filter(sentence => {
          for (const rule of hits) {
            if (new RegExp(rule.pattern, "gi").test(sentence)) return false;
          }
          return true;
        })
        .join("");
      return (cleaned.trim() ? cleaned.trim() + " " : "") + REWRITE_NOTICE;
    });
    text = newParagraphs.join("\n\n");
  }

  // ---- 低风险：软化措辞（全文 replace） ----
  for (const rule of INLINE_RULES.filter(r => r.severity === "low")) {
    const re = new RegExp(rule.pattern, "gi");
    const m = text.match(re);
    if (m && m.length > 0) {
      matches.push(...m.map(s => ruleToMatch(rule, s)));
      text = text.replace(re, rule.replacement ?? "");
      rewritten = true;
    }
  }

  // ---- 追加固定免责声明（避免重复） ----
  if (!text.includes("免责声明")) {
    text = text.trimEnd() + "\n\n" + DISCLAIMER_BLOCK;
  }

  return {
    ok: true,
    blocked: false,
    rewritten,
    matches,
    text
  };
}

function ruleToMatch(rule: InlineRule, match: string): SafetyMatch {
  return {
    ruleName: rule.name,
    pattern: rule.pattern,
    severity: rule.severity,
    action: rule.action,
    match
  };
}
