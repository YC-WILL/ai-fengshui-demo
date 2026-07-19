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
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
