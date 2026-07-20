import { Prisma, type PrismaClient } from "@prisma/client";
import {
  QIMEN_CATALOG_VERSION,
  QIMEN_ENTITIES,
  QIMEN_INTERPRETATIONS,
  QIMEN_METHOD_RULES,
  QIMEN_RELATIONS
} from "./qimenCatalog";

type QimenClient = Pick<PrismaClient,
  "traditionalEntity" | "traditionalRelation" | "traditionalMethodRule" | "traditionalInterpretationCard">;
const json = (value: unknown) => value as Prisma.InputJsonValue;

export async function syncQimenKnowledge(client: QimenClient): Promise<{
  entities: number; relations: number; methodRules: number; interpretations: number;
}> {
  for (const item of QIMEN_ENTITIES) {
    const data = { version: QIMEN_CATALOG_VERSION, system: item.system, category: item.category, code: item.code,
      name: item.name, sequence: item.sequence, attributes: json(item.attributes), sourceTitle: item.sourceTitle,
      sourceUrl: item.sourceUrl, isActive: true };
    await client.traditionalEntity.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }
  for (const item of QIMEN_RELATIONS) {
    const data = { version: QIMEN_CATALOG_VERSION, system: item.system, relationType: item.relationType,
      subjectCodes: json(item.subjectCodes), objectCodes: json(item.objectCodes), resultCode: item.resultCode,
      attributes: json(item.attributes), sourceTitle: item.sourceTitle, sourceUrl: item.sourceUrl, isActive: true };
    await client.traditionalRelation.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }
  for (const item of QIMEN_METHOD_RULES) {
    const data = { version: QIMEN_CATALOG_VERSION, method: item.method, step: item.step, code: item.code,
      title: item.title, rule: json(item.rule), explanation: item.explanation, sourceTitle: item.sourceTitle,
      sourceUrl: item.sourceUrl, isActive: true };
    await client.traditionalMethodRule.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }
  for (const item of QIMEN_INTERPRETATIONS) {
    const data = { version: QIMEN_CATALOG_VERSION, category: item.category, code: item.code, title: item.title,
      summary: item.summary, detail: item.detail, allowedUse: item.allowedUse, forbiddenUse: item.forbiddenUse,
      sourceTitle: item.sourceTitle, sourceUrl: item.sourceUrl, isActive: true };
    await client.traditionalInterpretationCard.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }

  await client.traditionalEntity.updateMany({ where: { system: "qimen", id: { notIn: QIMEN_ENTITIES.map(item => item.id) } }, data: { isActive: false } });
  await client.traditionalRelation.updateMany({ where: { system: "qimen", id: { notIn: QIMEN_RELATIONS.map(item => item.id) } }, data: { isActive: false } });
  await client.traditionalMethodRule.updateMany({ where: { method: "qimen_hourly_rotating", id: { notIn: QIMEN_METHOD_RULES.map(item => item.id) } }, data: { isActive: false } });
  await client.traditionalInterpretationCard.updateMany({ where: { category: { startsWith: "qimen_" }, id: { notIn: QIMEN_INTERPRETATIONS.map(item => item.id) } }, data: { isActive: false } });

  return { entities: QIMEN_ENTITIES.length, relations: QIMEN_RELATIONS.length,
    methodRules: QIMEN_METHOD_RULES.length, interpretations: QIMEN_INTERPRETATIONS.length };
}
