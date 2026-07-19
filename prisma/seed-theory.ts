import { PrismaClient } from "@prisma/client";
import { THEORY_CATALOG_VERSION } from "../src/lib/knowledge/theoryCatalog";
import { syncTheoryCards } from "../src/lib/knowledge/theorySync";

const prisma = new PrismaClient();

async function main() {
  console.log(`[theory] syncing ${THEORY_CATALOG_VERSION}...`);
  const count = await syncTheoryCards(prisma);
  console.log(`[theory] ${count} traditional knowledge cards active.`);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : "theory sync failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
