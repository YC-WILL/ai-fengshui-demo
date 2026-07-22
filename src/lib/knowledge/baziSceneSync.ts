import { Prisma, type PrismaClient } from "@prisma/client";
import {
  BAZI_SCENE_CATALOG_VERSION,
  BAZI_SCENE_METHOD_RULES,
  BAZI_SCENE_SOURCE_TITLE,
  BAZI_SCENE_SOURCE_URL
} from "./baziSceneCatalog";

type BaziSceneClient = Pick<PrismaClient, "traditionalMethodRule">;
const METHOD = "bazi_life_scene";

/** 把四场景的版本化事实规则与行为素材同步到现有传统方法规则表。 */
export async function syncBaziSceneKnowledge(client: BaziSceneClient) {
  for (const item of BAZI_SCENE_METHOD_RULES) {
    const data = {
      version: BAZI_SCENE_CATALOG_VERSION,
      method: METHOD,
      step: item.step,
      code: item.code,
      title: item.title,
      rule: item.rule as Prisma.InputJsonValue,
      explanation: item.explanation,
      sourceTitle: BAZI_SCENE_SOURCE_TITLE,
      sourceUrl: BAZI_SCENE_SOURCE_URL,
      isActive: true
    };
    await client.traditionalMethodRule.upsert({
      where: { id: item.id },
      create: { id: item.id, ...data },
      update: data
    });
  }

  await client.traditionalMethodRule.updateMany({
    where: {
      method: METHOD,
      id: { notIn: BAZI_SCENE_METHOD_RULES.map(item => item.id) }
    },
    data: { isActive: false }
  });
  return BAZI_SCENE_METHOD_RULES.length;
}
