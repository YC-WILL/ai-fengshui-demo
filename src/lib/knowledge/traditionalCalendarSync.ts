import { Prisma, type PrismaClient } from "@prisma/client";
import {
  TRADITIONAL_CALENDAR_VERSION,
  TRADITIONAL_ENTITIES,
  TRADITIONAL_INTERPRETATIONS,
  TRADITIONAL_METHOD_RULES,
  TRADITIONAL_RELATIONS
} from "./traditionalCalendarCatalog";

type TraditionalCalendarClient = Pick<PrismaClient,
  "traditionalEntity" | "traditionalRelation" | "traditionalMethodRule" | "traditionalInterpretationCard">;

const json = (value: unknown) => value as Prisma.InputJsonValue;

export async function syncTraditionalCalendarKnowledge(client: TraditionalCalendarClient): Promise<{
  entities: number;
  relations: number;
  methodRules: number;
  interpretations: number;
}> {
  const entitySystems = [...new Set(TRADITIONAL_ENTITIES.map(item => item.system))];
  const relationSystems = [...new Set(TRADITIONAL_RELATIONS.map(item => item.system))];
  const methods = [...new Set(TRADITIONAL_METHOD_RULES.map(item => item.method))];
  const interpretationCategories = [...new Set(TRADITIONAL_INTERPRETATIONS.map(item => item.category))];
  for (const item of TRADITIONAL_ENTITIES) {
    const data = {
      version: TRADITIONAL_CALENDAR_VERSION,
      system: item.system,
      category: item.category,
      code: item.code,
      name: item.name,
      sequence: item.sequence,
      attributes: json(item.attributes),
      sourceTitle: item.sourceTitle,
      sourceUrl: item.sourceUrl,
      isActive: true
    };
    await client.traditionalEntity.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }

  for (const item of TRADITIONAL_RELATIONS) {
    const data = {
      version: TRADITIONAL_CALENDAR_VERSION,
      system: item.system,
      relationType: item.relationType,
      subjectCodes: json(item.subjectCodes),
      objectCodes: json(item.objectCodes),
      resultCode: item.resultCode,
      attributes: json(item.attributes),
      sourceTitle: item.sourceTitle,
      sourceUrl: item.sourceUrl,
      isActive: true
    };
    await client.traditionalRelation.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }

  for (const item of TRADITIONAL_METHOD_RULES) {
    const data = {
      version: TRADITIONAL_CALENDAR_VERSION,
      method: item.method,
      step: item.step,
      code: item.code,
      title: item.title,
      rule: json(item.rule),
      explanation: item.explanation,
      sourceTitle: item.sourceTitle,
      sourceUrl: item.sourceUrl,
      isActive: true
    };
    await client.traditionalMethodRule.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }

  for (const item of TRADITIONAL_INTERPRETATIONS) {
    const data = {
      version: TRADITIONAL_CALENDAR_VERSION,
      category: item.category,
      code: item.code,
      title: item.title,
      summary: item.summary,
      detail: item.detail,
      allowedUse: item.allowedUse,
      forbiddenUse: item.forbiddenUse,
      sourceTitle: item.sourceTitle,
      sourceUrl: item.sourceUrl,
      isActive: true
    };
    await client.traditionalInterpretationCard.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }

  await client.traditionalEntity.updateMany({
    where: { system: { in: entitySystems }, id: { notIn: TRADITIONAL_ENTITIES.map(item => item.id) } }, data: { isActive: false }
  });
  await client.traditionalRelation.updateMany({
    where: { system: { in: relationSystems }, id: { notIn: TRADITIONAL_RELATIONS.map(item => item.id) } }, data: { isActive: false }
  });
  await client.traditionalMethodRule.updateMany({
    where: { method: { in: methods }, id: { notIn: TRADITIONAL_METHOD_RULES.map(item => item.id) } }, data: { isActive: false }
  });
  await client.traditionalInterpretationCard.updateMany({
    where: { category: { in: interpretationCategories }, id: { notIn: TRADITIONAL_INTERPRETATIONS.map(item => item.id) } }, data: { isActive: false }
  });

  return {
    entities: TRADITIONAL_ENTITIES.length,
    relations: TRADITIONAL_RELATIONS.length,
    methodRules: TRADITIONAL_METHOD_RULES.length,
    interpretations: TRADITIONAL_INTERPRETATIONS.length
  };
}
