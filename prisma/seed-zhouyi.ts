import { PrismaClient } from "@prisma/client";
import { ZHOUYI_CATALOG_VERSION } from "../src/lib/knowledge/zhouyiCatalog";
import { syncZhouyiCanon } from "../src/lib/knowledge/zhouyiSync";

const prisma = new PrismaClient();

async function main() {
  console.log(`[zhouyi] syncing ${ZHOUYI_CATALOG_VERSION}...`);
  const count = await syncZhouyiCanon(prisma);
  console.log(`[zhouyi] ${count.trigrams} trigrams, ${count.hexagrams} hexagrams, ${count.lines} lines active.`);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : "zhouyi sync failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
