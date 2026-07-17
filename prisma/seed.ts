// ============================================================
// Seed: 把 src/lib/safety/rules.ts 中的 inline 规则同步到 DB
//
// 目的：为后续"管理后台可编辑"留好数据通道。运行时仍以 inline 为主，
// DB 中的规则可被叠加生效（在 src/lib/safety/filter.ts 中扩展即可）。
// ============================================================

import { PrismaClient } from "@prisma/client";
import { INLINE_RULES } from "../src/lib/safety/rules";
import { THEORY_CATALOG, THEORY_CATALOG_VERSION } from "../src/lib/knowledge/theoryCatalog";

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
  for (const card of THEORY_CATALOG) {
    await prisma.theoryCard.upsert({
      where: { id: card.id },
      create: {
        id: card.id,
        version: THEORY_CATALOG_VERSION,
        module: card.module,
        psychology: card.psychology,
        fengshui: card.fengshui,
        mechanism: card.mechanism,
        whenToUse: JSON.stringify(card.whenToUse),
        allowed: card.allowed,
        forbidden: card.forbidden,
        action: card.action,
        review: card.review,
        sourceType: "自主整理",
        sourceNote: "卦安内部整理；心理学与风水概念分别作为行为参考和传统文化视角。",
        license: "内部原创整理",
        isActive: true
      },
      update: {
        version: THEORY_CATALOG_VERSION,
        module: card.module,
        psychology: card.psychology,
        fengshui: card.fengshui,
        mechanism: card.mechanism,
        whenToUse: JSON.stringify(card.whenToUse),
        allowed: card.allowed,
        forbidden: card.forbidden,
        action: card.action,
        review: card.review,
        sourceType: "自主整理",
        sourceNote: "卦安内部整理；心理学与风水概念分别作为行为参考和传统文化视角。",
        license: "内部原创整理",
        isActive: true
      }
    });
  }
  console.log(`[seed] ${THEORY_CATALOG.length} theory cards written.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
