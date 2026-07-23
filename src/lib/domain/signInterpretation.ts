import { safetyFilter } from "@/lib/safety/filter";
import type { SignPeriod } from "./dailySign";

export interface SignSnapshot {
  number: number;
  title: string;
  hexagramName: string;
  symbol: string;
  period: SignPeriod;
  periodLabel: string;
  signDate: string;
  coreMeaning: string;
  currentSituation: string;
  stage: string;
  primaryDirectionCode: string;
  mainDirection: string;
  favorableFactors: string;
  resistanceRisk: string;
  recommended: string;
  avoid: string;
  conclusion: string;
  contentStatus: string;
  contentNotice?: string;
  evidence: Array<{
    source: string;
    fact: string;
    explanation: string;
  }>;
}

export interface SignDomainKnowledge {
  id: string;
  code: string;
  name: string;
  description: string;
  clarifyingQuestions: string[];
  allowedUse: string;
  forbiddenUse: string;
}

export interface SignDirectionKnowledge {
  name: string;
  meaning: string;
  actionPrinciple: string;
  caution: string;
}

export interface SignInterpretationReply {
  assessment: string;
  tension: string;
  direction: string;
  steps: string[];
  avoid: string;
  followUpQuestion: string;
  boundary: string;
  riskNotice?: string;
}

export function buildSignInterpretationReply(input: {
  snapshot: SignSnapshot;
  domain: SignDomainKnowledge;
  direction: SignDirectionKnowledge;
  userMessage: string;
  previousUserMessages: string[];
}): SignInterpretationReply {
  const message = normalizeUserMessage(input.userMessage);
  const turnIndex = input.previousUserMessages.length;
  const clarifyingQuestions = input.domain.clarifyingQuestions.length
    ? input.domain.clarifyingQuestions
    : ["这件事里，哪一项事实最需要先确认？"];
  const followUpQuestion = clarifyingQuestions[turnIndex % clarifyingQuestions.length];
  const riskNotice = realityRiskNotice(message);
  const contextSummary = message.length > 96 ? `${message.slice(0, 96)}……` : message;
  const previousContext = input.previousUserMessages.length > 0
    ? `结合你前面补充的${input.previousUserMessages.length}项情况，`
    : "";
  const steps = [
    input.direction.actionPrinciple,
    `用10分钟回答：“${followUpQuestion}”，只写能够确认的事实和下一次确认时间。`
  ];
  if (input.previousUserMessages.length > 0) {
    steps.push("把这次补充的新事实与上一轮判断对照，只调整一个行动，不通过重新抽签更换答案。");
  }

  const reply: SignInterpretationReply = {
    assessment: `你提到“${contextSummary}”。从${input.domain.name}这个角度看，${previousContext}可以先用“${input.snapshot.mainDirection}”整理当前处境。`,
    tension: `这支原签提示的主要矛盾是：${input.direction.meaning}；它需要与你已经确认的事实和可控条件一起核对。`,
    direction: `${input.snapshot.conclusion} 这次更适合把签意落实为一个可验证、可回退的动作。`,
    steps: steps.slice(0, 3),
    avoid: input.direction.caution,
    followUpQuestion,
    boundary: "解签始终围绕本次原签，只帮助整理局势、选择与行动；不预测财富、疾病、婚姻、生死或法律结果。",
    riskNotice
  };

  const checked = safetyFilter([
    reply.assessment,
    reply.tension,
    reply.direction,
    ...reply.steps,
    reply.avoid,
    reply.followUpQuestion,
    reply.boundary,
    reply.riskNotice ?? ""
  ].join("\n\n"), { appendDisclaimer: false, context: "conversation" });

  if (checked.blocked) {
    return {
      assessment: checked.text,
      tension: "这类问题不能由签象代替现实判断。",
      direction: "先确认现实风险，并寻找可信任的人或相应专业支持。",
      steps: ["暂停依据签象作决定，先记录已经发生的事实和当前风险。"],
      avoid: "避免把签象当成诊断、判决或结果承诺。",
      followUpQuestion: "现在最需要优先处理的现实风险是什么？",
      boundary: reply.boundary,
      riskNotice
    };
  }

  return reply;
}

export function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    initiate: "起步期",
    prepare: "准备期",
    advance: "推进期",
    transition: "转折期",
    obstruction: "受阻期",
    consolidate: "巩固期",
    renewal: "更新期",
    closure: "收束期"
  };
  return labels[stage] ?? "观察期";
}

function normalizeUserMessage(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 800);
}

function realityRiskNotice(message: string): string | undefined {
  if (/(人身安全|被打|暴力|威胁|自伤|自杀|伤害自己|伤害他人)/.test(message)) {
    return "如果存在正在发生的人身危险，请优先离开危险环境，并联系当地紧急服务或可信任的人；不要等待签象判断。";
  }
  if (/(疾病|症状|药物|手术|治疗|医生|诊断)/.test(message)) {
    return "健康问题请优先咨询合格医疗专业人员，签象不能用于诊断、停药或替代治疗。";
  }
  if (/(合同|诉讼|违法|法律|律师|仲裁)/.test(message)) {
    return "法律与合同问题请让合格法律专业人员核对，签象不能替代法律意见。";
  }
  if (/(投资|股票|基金|借贷|贷款|理财|加密货币)/.test(message)) {
    return "财务决定需要核对风险承受能力和正式资料，签象不提供投资结果或收益判断。";
  }
  return undefined;
}
