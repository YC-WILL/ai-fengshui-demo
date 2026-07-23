import { PrismaClient } from "@prisma/client";
import { SIGN_THEORY_VERSION } from "../src/lib/knowledge/signTheoryCatalog";
import { syncSignTheory } from "../src/lib/knowledge/signTheorySync";

const prisma = new PrismaClient();

syncSignTheory(prisma)
  .then(counts => console.log(`[seed:sign-theory] ${SIGN_THEORY_VERSION}`, counts))
  .finally(() => prisma.$disconnect());
