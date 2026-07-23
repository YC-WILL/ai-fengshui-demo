import { randomInt } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  resolveSignMoment,
  SIGN_TIMEZONE,
  type SignPeriod
} from "@/lib/domain/dailySign";
import {
  buildSignInterpretationReply,
  stageLabel,
  type SignDomainKnowledge,
  type SignInterpretationReply,
  type SignSnapshot
} from "@/lib/domain/signInterpretation";

export const SIGN_DRAW_ALGORITHM_VERSION = "crypto-random-int-v1";

export class SignKnowledgeUnavailableError extends Error {}
export class SignNotFoundError extends Error {}
export class SignAccessDeniedError extends Error {}
export class SignConversationLimitError extends Error {}

type SignClient = PrismaClient | Prisma.TransactionClient;

export interface SignDrawView {
  id: string;
  repeated: boolean;
  signDate: string;
  period: SignPeriod;
  periodLabel: string;
  timezone: string;
  drawnAt: string;
  snapshot: SignSnapshot;
}

export async function getCurrentSignForUser(
  userId: string,
  now = new Date(),
  client: SignClient = prisma
): Promise<{ moment: ReturnType<typeof resolveSignMoment>; draw: SignDrawView | null }> {
  const moment = resolveSignMoment(now, SIGN_TIMEZONE);
  const draw = await client.signDraw.findUnique({
    where: {
      userId_signDate_period: {
        userId,
        signDate: moment.signDate,
        period: moment.period
      }
    }
  });
  return {
    moment,
    draw: draw ? drawView(draw, true) : null
  };
}

export async function drawSignForUser(
  userId: string,
  now = new Date(),
  client: SignClient = prisma,
  secureRandomInt: (max: number) => number = max => randomInt(max)
): Promise<SignDrawView> {
  const current = await getCurrentSignForUser(userId, now, client);
  if (current.draw) return current.draw;

  const entries = await client.signEntry.findMany({
    where: {
      isActive: true,
      system: { is: { isActive: true } }
    },
    orderBy: { number: "asc" },
    include: {
      system: true,
      hexagram: true
    }
  });
  if (entries.length === 0) {
    throw new SignKnowledgeUnavailableError("签象知识目录尚未准备完成");
  }

  const randomIndex = secureRandomInt(entries.length);
  if (!Number.isInteger(randomIndex) || randomIndex < 0 || randomIndex >= entries.length) {
    throw new Error("安全随机结果超出签象范围");
  }
  const entry = entries[randomIndex];
  const [primaryDirection, secondaryDirection, periodProfile] = await Promise.all([
    client.signDirection.findFirst({
      where: { code: entry.primaryDirectionCode, isActive: true }
    }),
    entry.secondaryDirectionCode
      ? client.signDirection.findFirst({ where: { code: entry.secondaryDirectionCode, isActive: true } })
      : Promise.resolve(null),
    client.signPeriodProfile.findFirst({
      where: {
        systemId: entry.systemId,
        code: current.moment.period,
        isActive: true
      }
    })
  ]);
  if (!primaryDirection || !periodProfile) {
    throw new SignKnowledgeUnavailableError("签象方向或时段知识尚未准备完成");
  }

  const snapshot: SignSnapshot = {
    number: entry.number,
    title: entry.title,
    hexagramName: entry.hexagram.name,
    symbol: entry.hexagram.symbol,
    period: current.moment.period,
    periodLabel: periodProfile.name,
    signDate: current.moment.signDate,
    primaryDirectionCode: entry.primaryDirectionCode,
    coreMeaning: primaryDirection.meaning,
    currentSituation: `${periodProfile.focus}。${periodProfile.guidingQuestion}`,
    stage: stageLabel(entry.stage),
    mainDirection: primaryDirection.name,
    favorableFactors: secondaryDirection?.meaning ?? periodProfile.focus,
    resistanceRisk: primaryDirection.caution,
    recommended: primaryDirection.actionPrinciple,
    avoid: primaryDirection.caution,
    conclusion: `此签先看“${primaryDirection.name}”：${primaryDirection.meaning}`,
    contentStatus: entry.contentStatus,
    contentNotice: entry.contentStatus === "foundation"
      ? "当前为结构占位内容，方向与阶段仍待逐签审校；经典依据单独标注，不把整理内容冒充传统原文。"
      : undefined,
    evidence: [
      {
        source: `《周易》${entry.hexagram.name}卦`,
        fact: entry.hexagram.judgment,
        explanation: "卦辞来自数据库中的周易规范表。"
      },
      {
        source: `${periodProfile.name}时段资料`,
        fact: periodProfile.focus,
        explanation: `服务端按${current.moment.timezone}时间确认时段和签日归属。`
      },
      {
        source: `${entry.title}结构条目`,
        fact: `${primaryDirection.name} · ${stageLabel(entry.stage)}`,
        explanation: entry.sourceNote
      }
    ]
  };

  try {
    const created = await client.signDraw.create({
      data: {
        userId,
        signEntryId: entry.id,
        signDate: current.moment.signDate,
        period: current.moment.period,
        timezone: current.moment.timezone,
        randomIndex,
        algorithmVersion: SIGN_DRAW_ALGORITHM_VERSION,
        catalogVersion: entry.version,
        signSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        drawnAt: now
      }
    });
    return drawView(created, false);
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const existing = await client.signDraw.findUnique({
      where: {
        userId_signDate_period: {
          userId,
          signDate: current.moment.signDate,
          period: current.moment.period
        }
      }
    });
    if (!existing) throw error;
    return drawView(existing, true);
  }
}

export async function getSignByIdForUser(
  userId: string,
  drawId: string,
  client: SignClient = prisma
): Promise<SignDrawView> {
  const draw = await client.signDraw.findUnique({ where: { id: drawId } });
  if (!draw) throw new SignNotFoundError("没有找到这支签");
  if (draw.userId !== userId) throw new SignAccessDeniedError("无权查看这支签");
  return drawView(draw, true);
}

export async function startSignInterpretation(input: {
  userId: string;
  drawId: string;
  domainCode: string;
  question: string;
}, client: PrismaClient = prisma) {
  const [draw, domain] = await Promise.all([
    client.signDraw.findUnique({ where: { id: input.drawId } }),
    client.signDomain.findFirst({ where: { code: input.domainCode, isActive: true } })
  ]);
  if (!draw) throw new SignNotFoundError("没有找到这支签");
  if (draw.userId !== input.userId) throw new SignAccessDeniedError("无权解读这支签");
  if (!domain) throw new SignKnowledgeUnavailableError("所选解签领域尚未准备完成");

  const snapshot = parseSnapshot(draw.signSnapshot);
  const domainKnowledge = domainView(domain);
  const reply = buildSignInterpretationReply({
    snapshot,
    domain: domainKnowledge,
    direction: {
      name: snapshot.mainDirection,
      meaning: snapshot.coreMeaning,
      actionPrinciple: snapshot.recommended,
      caution: snapshot.avoid
    },
    userMessage: input.question,
    previousUserMessages: []
  });

  const session = await client.$transaction(async transaction => {
    const created = await transaction.signInterpretationSession.create({
      data: {
        drawId: draw.id,
        userId: input.userId,
        domainId: domain.id,
        initialQuestion: input.question
      }
    });
    await transaction.signInterpretationTurn.createMany({
      data: [
        { sessionId: created.id, role: "user", content: input.question },
        {
          sessionId: created.id,
          role: "assistant",
          content: replyToText(reply),
          responseData: reply as unknown as Prisma.InputJsonValue
        }
      ]
    });
    return created;
  });

  return {
    sessionId: session.id,
    drawId: draw.id,
    domain: domainKnowledge,
    reply
  };
}

export async function continueSignInterpretation(input: {
  userId: string;
  drawId: string;
  sessionId: string;
  message: string;
}, client: PrismaClient = prisma) {
  const session = await client.signInterpretationSession.findUnique({
    where: { id: input.sessionId },
    include: {
      draw: true,
      domain: true,
      turns: { orderBy: { createdAt: "asc" } }
    }
  });
  if (!session || session.drawId !== input.drawId) throw new SignNotFoundError("没有找到这次解签会话");
  if (session.userId !== input.userId || session.draw.userId !== input.userId) {
    throw new SignAccessDeniedError("无权继续这次解签");
  }
  const assistantTurns = session.turns.filter(turn => turn.role === "assistant").length;
  if (assistantTurns >= 20) throw new SignConversationLimitError("本次解签已达到20轮，请先整理已有行动");

  const snapshot = parseSnapshot(session.draw.signSnapshot);
  const domainKnowledge = domainView(session.domain);
  const previousUserMessages = session.turns
    .filter(turn => turn.role === "user")
    .map(turn => turn.content);
  const reply = buildSignInterpretationReply({
    snapshot,
    domain: domainKnowledge,
    direction: {
      name: snapshot.mainDirection,
      meaning: snapshot.coreMeaning,
      actionPrinciple: snapshot.recommended,
      caution: snapshot.avoid
    },
    userMessage: input.message,
    previousUserMessages
  });

  await client.$transaction([
    client.signInterpretationTurn.create({
      data: { sessionId: session.id, role: "user", content: input.message }
    }),
    client.signInterpretationTurn.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: replyToText(reply),
        responseData: reply as unknown as Prisma.InputJsonValue
      }
    })
  ]);

  return {
    sessionId: session.id,
    drawId: session.drawId,
    domain: domainKnowledge,
    reply
  };
}

export async function getSignInterpretationForUser(
  userId: string,
  drawId: string,
  sessionId: string,
  client: SignClient = prisma
) {
  const session = await client.signInterpretationSession.findUnique({
    where: { id: sessionId },
    include: {
      domain: true,
      turns: { orderBy: { createdAt: "asc" } }
    }
  });
  if (!session || session.drawId !== drawId) throw new SignNotFoundError("没有找到这次解签会话");
  if (session.userId !== userId) throw new SignAccessDeniedError("无权查看这次解签");
  return {
    sessionId: session.id,
    drawId: session.drawId,
    domain: domainView(session.domain),
    turns: session.turns.map(turn => ({
      id: turn.id,
      role: turn.role,
      content: turn.content,
      responseData: turn.responseData,
      createdAt: turn.createdAt.toISOString()
    }))
  };
}

function drawView(draw: {
  id: string;
  signDate: string;
  period: string;
  timezone: string;
  drawnAt: Date;
  signSnapshot: Prisma.JsonValue;
}, repeated: boolean): SignDrawView {
  const snapshot = parseSnapshot(draw.signSnapshot);
  return {
    id: draw.id,
    repeated,
    signDate: draw.signDate,
    period: draw.period as SignPeriod,
    periodLabel: snapshot.periodLabel,
    timezone: draw.timezone,
    drawnAt: draw.drawnAt.toISOString(),
    snapshot
  };
}

function parseSnapshot(value: Prisma.JsonValue): SignSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SignKnowledgeUnavailableError("签象快照不完整");
  }
  const snapshot = value as unknown as SignSnapshot;
  if (!snapshot.title || !snapshot.coreMeaning || !snapshot.periodLabel || !Array.isArray(snapshot.evidence)) {
    throw new SignKnowledgeUnavailableError("签象快照不完整");
  }
  return snapshot;
}

function domainView(domain: {
  id: string;
  code: string;
  name: string;
  description: string;
  clarifyingQuestions: Prisma.JsonValue;
  allowedUse: string;
  forbiddenUse: string;
}): SignDomainKnowledge {
  return {
    id: domain.id,
    code: domain.code,
    name: domain.name,
    description: domain.description,
    clarifyingQuestions: Array.isArray(domain.clarifyingQuestions)
      ? domain.clarifyingQuestions.filter((item): item is string => typeof item === "string")
      : [],
    allowedUse: domain.allowedUse,
    forbiddenUse: domain.forbiddenUse
  };
}

function replyToText(reply: SignInterpretationReply) {
  return [
    reply.assessment,
    reply.tension,
    reply.direction,
    ...reply.steps,
    reply.avoid,
    reply.followUpQuestion,
    reply.riskNotice,
    reply.boundary
  ].filter(Boolean).join("\n\n");
}

function isUniqueConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    (typeof error === "object" && error !== null && "code" in error)
  ) && (error as { code?: unknown }).code === "P2002";
}
