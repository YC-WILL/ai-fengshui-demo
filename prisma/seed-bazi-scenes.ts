import { PrismaClient } from "@prisma/client";
import { BAZI_SCENE_CATALOG_VERSION } from "../src/lib/knowledge/baziSceneCatalog";
import { syncBaziSceneKnowledge } from "../src/lib/knowledge/baziSceneSync";

const prisma = new PrismaClient();

async function main() {
  console.log(`[bazi-scenes] syncing ${BAZI_SCENE_CATALOG_VERSION}...`);
  const count = await syncBaziSceneKnowledge(prisma);
  console.log(`[bazi-scenes] ${count} method rules active.`);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : "bazi scene sync failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
