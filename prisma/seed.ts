// ============================================================
// Seed: 把 src/lib/safety/rules.ts 中的 inline 规则同步到 DB
//
// 目的：为后续"管理后台可编辑"留好数据通道。运行时仍以 inline 为主，
// DB 中的规则可被叠加生效（在 src/lib/safety/filter.ts 中扩展即可）。
// ============================================================

import { PrismaClient } from "@prisma/client";
import { INLINE_RULES } from "../src/lib/safety/rules";
import { THEORY_CATALOG_VERSION } from "../src/lib/knowledge/theoryCatalog";
import { syncTheoryCards } from "../src/lib/knowledge/theorySync";
import { ZHOUYI_CATALOG_VERSION } from "../src/lib/knowledge/zhouyiCatalog";
import { syncZhouyiCanon } from "../src/lib/knowledge/zhouyiSync";
import { TRADITIONAL_CALENDAR_VERSION } from "../src/lib/knowledge/traditionalCalendarCatalog";
import { syncTraditionalCalendarKnowledge } from "../src/lib/knowledge/traditionalCalendarSync";
import { QIMEN_CATALOG_VERSION } from "../src/lib/knowledge/qimenCatalog";
import { syncQimenKnowledge } from "../src/lib/knowledge/qimenSync";
import { BAZI_SCENE_CATALOG_VERSION } from "../src/lib/knowledge/baziSceneCatalog";
import { syncBaziSceneKnowledge } from "../src/lib/knowledge/baziSceneSync";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] syncing inline safety rules to DB...");
  // 简单做法：清空再写入。生产环境请改成 upsert + audit。
  await prisma.contentSafetyRule.deleteMany();
  for (const rule of INLINE_RULES) {
    await prisma.contentSafetyRule.create({
      data: {
        ruleName: rule.name,
        pattern: rule.pattern,
        severity: rule.severity,
        action: rule.action
      }
    });
  }
  console.log(`[seed] ${INLINE_RULES.length} rules written.`);

  console.log(`[seed] syncing theory cards ${THEORY_CATALOG_VERSION}...`);
  const theoryCardCount = await syncTheoryCards(prisma);
  console.log(`[seed] ${theoryCardCount} theory cards written.`);

  console.log(`[seed] syncing Zhouyi canon ${ZHOUYI_CATALOG_VERSION}...`);
  const zhouyiCount = await syncZhouyiCanon(prisma);
  console.log(`[seed] ${zhouyiCount.trigrams} trigrams, ${zhouyiCount.hexagrams} hexagrams, ${zhouyiCount.lines} lines written.`);

  console.log(`[seed] syncing traditional calendar ${TRADITIONAL_CALENDAR_VERSION}...`);
  const traditionalCount = await syncTraditionalCalendarKnowledge(prisma);
  console.log(`[seed] ${traditionalCount.entities} entities, ${traditionalCount.relations} relations, ${traditionalCount.methodRules} method rules, ${traditionalCount.interpretations} interpretations written.`);

  console.log(`[seed] syncing Bazi scene knowledge ${BAZI_SCENE_CATALOG_VERSION}...`);
  const baziSceneCount = await syncBaziSceneKnowledge(prisma);
  console.log(`[seed] ${baziSceneCount} Bazi scene method rules written.`);

  console.log(`[seed] syncing Qimen foundation ${QIMEN_CATALOG_VERSION}...`);
  const qimenCount = await syncQimenKnowledge(prisma);
  console.log(`[seed] ${qimenCount.entities} Qimen entities, ${qimenCount.relations} relations, ${qimenCount.methodRules} method rules, ${qimenCount.interpretations} interpretations written.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
