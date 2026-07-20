import type { PrismaClient } from "@prisma/client";
import {
  ZHOUYI_CATALOG_VERSION,
  ZHOUYI_HEXAGRAMS,
  ZHOUYI_TRIGRAMS,
  zhouyiLineId
} from "./zhouyiCatalog";

type ZhouyiClient = Pick<PrismaClient, "zhouyiTrigram" | "zhouyiHexagram" | "zhouyiLine">;

export async function syncZhouyiCanon(client: ZhouyiClient): Promise<{
  trigrams: number;
  hexagrams: number;
  lines: number;
}> {
  for (const trigram of ZHOUYI_TRIGRAMS) {
    const data = {
      name: trigram.name,
      symbol: trigram.symbol,
      binary: trigram.binary,
      canonicalImage: trigram.canonicalImage,
      canonicalVirtue: trigram.canonicalVirtue,
      familyRole: trigram.familyRole,
      laterHeavenDirection: trigram.laterHeavenDirection,
      laterFivePhase: trigram.laterFivePhase,
      version: ZHOUYI_CATALOG_VERSION,
      sourceUrl: trigram.sourceUrl,
      isActive: true
    };
    await client.zhouyiTrigram.upsert({
      where: { id: trigram.id },
      create: { id: trigram.id, ...data },
      update: data
    });
  }

  for (const hexagram of ZHOUYI_HEXAGRAMS) {
    const data = {
      name: hexagram.name,
      symbol: hexagram.symbol,
      binary: hexagram.binary,
      lowerTrigramId: hexagram.lowerTrigramId,
      upperTrigramId: hexagram.upperTrigramId,
      judgment: hexagram.judgment,
      tuan: hexagram.tuan,
      image: hexagram.image,
      wenyan: hexagram.wenyan,
      extraLineLabel: hexagram.extraLineLabel,
      extraLineText: hexagram.extraLineText,
      extraLineImage: hexagram.extraLineImage,
      sourceUrl: hexagram.sourceUrl,
      sourceRevision: hexagram.sourceRevision,
      sourceLicense: hexagram.sourceLicense,
      version: ZHOUYI_CATALOG_VERSION,
      isActive: true
    };
    await client.zhouyiHexagram.upsert({
      where: { number: hexagram.number },
      create: { number: hexagram.number, ...data },
      update: data
    });
  }

  const lineIds: string[] = [];
  for (const hexagram of ZHOUYI_HEXAGRAMS) {
    for (const line of hexagram.lines) {
      const id = zhouyiLineId(hexagram.number, line.position);
      lineIds.push(id);
      const data = {
        hexagramNumber: hexagram.number,
        position: line.position,
        label: line.label,
        lineType: line.lineType,
        text: line.text,
        imageText: line.imageText,
        isCentral: line.isCentral,
        isInProperPosition: line.isCorrect,
        correspondingPosition: line.correspondingPosition,
        hasCorrespondence: line.hasCorrespondence,
        changesToHexagramNumber: line.changesToHexagramNumber,
        version: ZHOUYI_CATALOG_VERSION,
        sourceUrl: hexagram.sourceUrl,
        sourceRevision: hexagram.sourceRevision,
        isActive: true
      };
      await client.zhouyiLine.upsert({
        where: { id },
        create: { id, ...data },
        update: data
      });
    }
  }

  await client.zhouyiLine.updateMany({
    where: { id: { notIn: lineIds } },
    data: { isActive: false }
  });
  await client.zhouyiHexagram.updateMany({
    where: { number: { notIn: ZHOUYI_HEXAGRAMS.map(item => item.number) } },
    data: { isActive: false }
  });
  await client.zhouyiTrigram.updateMany({
    where: { id: { notIn: ZHOUYI_TRIGRAMS.map(item => item.id) } },
    data: { isActive: false }
  });

  return {
    trigrams: ZHOUYI_TRIGRAMS.length,
    hexagrams: ZHOUYI_HEXAGRAMS.length,
    lines: lineIds.length
  };
}
