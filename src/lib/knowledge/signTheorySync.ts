import { Prisma, type PrismaClient } from "@prisma/client";
import {
  SIGN_DIRECTIONS,
  SIGN_DOMAINS,
  SIGN_ENTRIES,
  SIGN_METHOD_RULES,
  SIGN_PERIOD_PROFILES,
  SIGN_SYSTEM,
  SIGN_THEORY_VERSION
} from "./signTheoryCatalog";

type SignTheoryClient = Pick<PrismaClient,
  "signSystem" | "signDirection" | "signDomain" | "signPeriodProfile" | "signEntry" | "signMethodRule">;

const json = (value: unknown) => value as Prisma.InputJsonValue;

export async function syncSignTheory(client: SignTheoryClient): Promise<{
  systems: number;
  directions: number;
  domains: number;
  periods: number;
  entries: number;
  methodRules: number;
}> {
  await client.signSystem.upsert({
    where: { id: SIGN_SYSTEM.id },
    create: { ...SIGN_SYSTEM, drawPolicy: json(SIGN_SYSTEM.drawPolicy) },
    update: {
      code: SIGN_SYSTEM.code,
      name: SIGN_SYSTEM.name,
      version: SIGN_SYSTEM.version,
      description: SIGN_SYSTEM.description,
      theoryBasis: SIGN_SYSTEM.theoryBasis,
      drawCount: SIGN_SYSTEM.drawCount,
      drawPolicy: json(SIGN_SYSTEM.drawPolicy),
      contentStatus: SIGN_SYSTEM.contentStatus,
      isActive: true
    }
  });

  for (const item of SIGN_DIRECTIONS) {
    await client.signDirection.upsert({
      where: { id: item.id },
      create: { ...item, criteria: json(item.criteria) },
      update: {
        code: item.code,
        name: item.name,
        meaning: item.meaning,
        criteria: json(item.criteria),
        actionPrinciple: item.actionPrinciple,
        caution: item.caution,
        version: item.version,
        isActive: true
      }
    });
  }

  for (const item of SIGN_DOMAINS) {
    await client.signDomain.upsert({
      where: { id: item.id },
      create: { ...item, clarifyingQuestions: json(item.clarifyingQuestions) },
      update: {
        code: item.code,
        name: item.name,
        description: item.description,
        clarifyingQuestions: json(item.clarifyingQuestions),
        allowedUse: item.allowedUse,
        forbiddenUse: item.forbiddenUse,
        version: item.version,
        isActive: true
      }
    });
  }

  for (const item of SIGN_PERIOD_PROFILES) {
    await client.signPeriodProfile.upsert({
      where: { id: item.id },
      create: { ...item, directionEmphasis: json(item.directionEmphasis) },
      update: {
        systemId: item.systemId,
        code: item.code,
        name: item.name,
        sequence: item.sequence,
        startMinute: item.startMinute,
        endMinute: item.endMinute,
        crossesMidnight: item.crossesMidnight,
        dateAnchorHour: item.dateAnchorHour,
        focus: item.focus,
        guidingQuestion: item.guidingQuestion,
        directionEmphasis: json(item.directionEmphasis),
        actionHorizon: item.actionHorizon,
        version: item.version,
        isActive: true
      }
    });
  }

  for (const item of SIGN_ENTRIES) {
    await client.signEntry.upsert({
      where: { id: item.id },
      create: item,
      update: {
        systemId: item.systemId,
        number: item.number,
        hexagramNumber: item.hexagramNumber,
        title: item.title,
        signType: item.signType,
        stage: item.stage,
        primaryDirectionCode: item.primaryDirectionCode,
        secondaryDirectionCode: item.secondaryDirectionCode,
        contentStatus: item.contentStatus,
        sourceNote: item.sourceNote,
        version: item.version,
        isActive: true
      }
    });
  }

  for (const item of SIGN_METHOD_RULES) {
    await client.signMethodRule.upsert({
      where: { id: item.id },
      create: { ...item, rule: json(item.rule) },
      update: {
        systemId: item.systemId,
        step: item.step,
        code: String(item.code),
        title: String(item.title),
        rule: json(item.rule),
        explanation: String(item.explanation),
        version: item.version,
        isActive: true
      }
    });
  }

  await Promise.all([
    client.signDirection.updateMany({
      where: { version: SIGN_THEORY_VERSION, id: { notIn: SIGN_DIRECTIONS.map(item => item.id) } },
      data: { isActive: false }
    }),
    client.signDomain.updateMany({
      where: { version: SIGN_THEORY_VERSION, id: { notIn: SIGN_DOMAINS.map(item => item.id) } },
      data: { isActive: false }
    }),
    client.signPeriodProfile.updateMany({
      where: { systemId: SIGN_SYSTEM.id, id: { notIn: SIGN_PERIOD_PROFILES.map(item => item.id) } },
      data: { isActive: false }
    }),
    client.signEntry.updateMany({
      where: { systemId: SIGN_SYSTEM.id, id: { notIn: SIGN_ENTRIES.map(item => item.id) } },
      data: { isActive: false }
    }),
    client.signMethodRule.updateMany({
      where: { systemId: SIGN_SYSTEM.id, id: { notIn: SIGN_METHOD_RULES.map(item => item.id) } },
      data: { isActive: false }
    })
  ]);

  return {
    systems: 1,
    directions: SIGN_DIRECTIONS.length,
    domains: SIGN_DOMAINS.length,
    periods: SIGN_PERIOD_PROFILES.length,
    entries: SIGN_ENTRIES.length,
    methodRules: SIGN_METHOD_RULES.length
  };
}
