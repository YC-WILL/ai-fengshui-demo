import { PrismaClient } from "@prisma/client";
import { TRADITIONAL_CALENDAR_VERSION } from "../src/lib/knowledge/traditionalCalendarCatalog";
import { syncTraditionalCalendarKnowledge } from "../src/lib/knowledge/traditionalCalendarSync";

const prisma = new PrismaClient();

async function main() {
  console.log(`[traditional-calendar] syncing ${TRADITIONAL_CALENDAR_VERSION}...`);
  const count = await syncTraditionalCalendarKnowledge(prisma);
  console.log(`[traditional-calendar] ${count.entities} entities, ${count.relations} relations, ${count.methodRules} method rules, ${count.interpretations} interpretations active.`);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : "traditional calendar sync failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
