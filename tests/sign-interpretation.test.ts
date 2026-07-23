import { describe, expect, it } from "vitest";
import {
  buildSignInterpretationReply,
  type SignSnapshot
} from "@/lib/domain/signInterpretation";
import {
  continueSignInterpretationSchema,
  drawSignRequestSchema,
  startSignInterpretationSchema
} from "@/lib/signs/validation";

const snapshot: SignSnapshot = {
  number: 4,
  title: "蒙签",
  hexagramName: "蒙",
  symbol: "䷃",
  period: "morning",
  periodLabel: "早签",
  signDate: "2026-07-23",
  primaryDirectionCode: "clarify",
  coreMeaning: "事实、目标或双方意图尚不清楚，应先辨明再行动。",
  currentSituation: "起势、定意与今天的第一步。",
  stage: "准备期",
  mainDirection: "明辨",
  favorableFactors: "可以通过提问补齐事实。",
  resistanceRisk: "不得把猜测包装成事实。",
  recommended: "补齐一个关键事实，再做下一步。",
  avoid: "避免在事实不清时作不可逆决定。",
  conclusion: "此签先看“明辨”：先核对事实，再决定行动。",
  contentStatus: "foundation",
  evidence: [
    { source: "蒙卦", fact: "数据库事实一", explanation: "解释一" },
    { source: "早签", fact: "数据库事实二", explanation: "解释二" }
  ]
};

const domain = {
  id: "domain-choice",
  code: "choice_timing",
  name: "选择与时机",
  description: "比较选项",
  clarifyingQuestions: ["你正在比较哪两个具体选择？", "哪个决定更难撤回？"],
  allowedUse: "整理选择",
  forbiddenUse: "不预测结果"
};

describe("sign interpretation", () => {
  it("keeps the stored sign and returns a practical conversational structure", () => {
    const reply = buildSignInterpretationReply({
      snapshot,
      domain,
      direction: {
        name: snapshot.mainDirection,
        meaning: snapshot.coreMeaning,
        actionPrinciple: snapshot.recommended,
        caution: snapshot.avoid
      },
      userMessage: "我在考虑是否接受一个新项目",
      previousUserMessages: []
    });
    expect(reply.assessment).toContain(snapshot.mainDirection);
    expect(reply.direction).toContain(snapshot.conclusion);
    expect(reply.steps).toHaveLength(2);
    expect(reply.followUpQuestion).toBe(domain.clarifyingQuestions[0]);
    expect(JSON.stringify(reply)).not.toMatch(/命中注定|必然成功|保证发财/);
  });

  it("adds realistic safety boundaries instead of using the sign as professional advice", () => {
    const reply = buildSignInterpretationReply({
      snapshot,
      domain,
      direction: {
        name: snapshot.mainDirection,
        meaning: snapshot.coreMeaning,
        actionPrinciple: snapshot.recommended,
        caution: snapshot.avoid
      },
      userMessage: "我想靠这支签决定股票投资和贷款",
      previousUserMessages: []
    });
    expect(reply.riskNotice).toMatch(/财务决定|不提供投资结果/);
    expect(reply.boundary).toMatch(/不预测财富、疾病、婚姻、生死或法律结果/);
  });

  it("validates domains, questions, follow-ups and rejects client-controlled draw data", () => {
    expect(startSignInterpretationSchema.safeParse({
      domainCode: "career_study",
      question: "我应该怎样推进这个项目？"
    }).success).toBe(true);
    expect(startSignInterpretationSchema.safeParse({
      domainCode: "fortune",
      question: "会发财吗"
    }).success).toBe(false);
    expect(continueSignInterpretationSchema.safeParse({ message: "再说说" }).success).toBe(true);
    expect(continueSignInterpretationSchema.safeParse({ message: "" }).success).toBe(false);
    expect(drawSignRequestSchema.safeParse({ period: "morning" }).success).toBe(false);
    expect(drawSignRequestSchema.safeParse({ signNumber: 1 }).success).toBe(false);
  });
});
