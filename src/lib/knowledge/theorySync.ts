import type { PrismaClient } from "@prisma/client";
import { THEORY_CATALOG, THEORY_CATALOG_VERSION, type TheoryCard } from "./theoryCatalog";

type TheoryCardClient = Pick<PrismaClient, "theoryCard">;

function persistenceData(card: TheoryCard) {
  return {
    version: THEORY_CATALOG_VERSION,
    module: card.module,
    // Compatibility mapping for the existing schema. These values no longer
    // contain psychology theories.
    psychology: card.source,
    fengshui: card.topic,
    mechanism: card.principle,
    whenToUse: JSON.stringify(card.whenToUse),
    allowed: card.allowed,
    forbidden: card.forbidden,
    action: card.action,
    review: card.review,
    sourceType: "传统典籍整理",
    sourceNote: `${card.source}；蟾先森依据公开古籍作原创释义，不逐字复刻原文。`,
    license: "内部原创释义",
    isActive: true
  };
}

export async function syncTheoryCards(client: TheoryCardClient): Promise<number> {
  for (const card of THEORY_CATALOG) {
    const data = persistenceData(card);
    await client.theoryCard.upsert({
      where: { id: card.id },
      create: { id: card.id, ...data },
      update: data
    });
  }

  await client.theoryCard.updateMany({
    where: { id: { notIn: THEORY_CATALOG.map(card => card.id) } },
    data: { isActive: false }
  });
  return THEORY_CATALOG.length;
}
