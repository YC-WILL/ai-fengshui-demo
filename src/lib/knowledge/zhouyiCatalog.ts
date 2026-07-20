import rawCatalog from "../../../prisma/data/zhouyi-canon.json";

export type ZhouyiTrigramRecord = (typeof rawCatalog.trigrams)[number];
export type ZhouyiHexagramRecord = (typeof rawCatalog.hexagrams)[number];
export type ZhouyiLineRecord = ZhouyiHexagramRecord["lines"][number];

export const ZHOUYI_CATALOG_VERSION = rawCatalog.version;
export const ZHOUYI_SOURCE = rawCatalog.source;
export const ZHOUYI_TRIGRAMS = rawCatalog.trigrams;
export const ZHOUYI_HEXAGRAMS = rawCatalog.hexagrams;

export function zhouyiLineId(hexagramNumber: number, position: number): string {
  return `${String(hexagramNumber).padStart(2, "0")}-${position}`;
}
