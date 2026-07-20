import { PrismaClient } from "@prisma/client";
import { QIMEN_CATALOG_VERSION } from "../src/lib/knowledge/qimenCatalog";
import { syncQimenKnowledge } from "../src/lib/knowledge/qimenSync";

const prisma = new PrismaClient();
syncQimenKnowledge(prisma)
  .then(counts => console.log(`[seed:qimen] ${QIMEN_CATALOG_VERSION}`, counts))
  .finally(() => prisma.$disconnect());
