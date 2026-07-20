import { describe, expect, it } from "vitest";
import {
  ZHOUYI_CATALOG_VERSION,
  ZHOUYI_HEXAGRAMS,
  ZHOUYI_SOURCE,
  ZHOUYI_TRIGRAMS,
  zhouyiLineId
} from "../src/lib/knowledge/zhouyiCatalog";

describe("Zhouyi canonical catalog", () => {
  it("contains the complete eight trigrams, 64 hexagrams and 384 lines", () => {
    expect(ZHOUYI_TRIGRAMS).toHaveLength(8);
    expect(ZHOUYI_HEXAGRAMS).toHaveLength(64);
    expect(ZHOUYI_HEXAGRAMS.flatMap(item => item.lines)).toHaveLength(384);
    expect(new Set(ZHOUYI_TRIGRAMS.map(item => item.binary)).size).toBe(8);
    expect(new Set(ZHOUYI_HEXAGRAMS.map(item => item.binary)).size).toBe(64);
    expect(new Set(ZHOUYI_HEXAGRAMS.map(item => item.symbol)).size).toBe(64);
  });

  it("keeps every canonical text layer and source revision", () => {
    expect(ZHOUYI_CATALOG_VERSION).toMatch(/^2026-07-20\./);
    expect(ZHOUYI_SOURCE.indexUrl).toBe("https://zh.wikisource.org/wiki/周易");
    for (const hexagram of ZHOUYI_HEXAGRAMS) {
      expect(hexagram.judgment.length).toBeGreaterThan(0);
      expect(hexagram.tuan.length).toBeGreaterThan(0);
      expect(hexagram.image.length).toBeGreaterThan(0);
      expect(hexagram.sourceRevision).toMatch(/^\d+$/);
      expect(hexagram.lines).toHaveLength(6);
      expect(JSON.stringify(hexagram)).not.toMatch(/<span|\{\{|\[\[|心理学|星座/);
      for (const line of hexagram.lines) {
        expect(line.text.length).toBeGreaterThan(0);
        expect(line.imageText.length).toBeGreaterThan(0);
      }
    }
  });

  it("maps each moving line to the hexagram formed by one polarity change", () => {
    const byNumber = new Map(ZHOUYI_HEXAGRAMS.map(item => [item.number, item]));
    for (const hexagram of ZHOUYI_HEXAGRAMS) {
      for (const line of hexagram.lines) {
        const target = byNumber.get(line.changesToHexagramNumber);
        expect(target).toBeDefined();
        const changedBits = hexagram.binary.split("");
        changedBits[line.position - 1] = changedBits[line.position - 1] === "1" ? "0" : "1";
        expect(target?.binary).toBe(changedBits.join(""));
        expect(target?.lines[line.position - 1].changesToHexagramNumber).toBe(hexagram.number);
      }
    }
    expect(ZHOUYI_HEXAGRAMS[0].lines[0].changesToHexagramNumber).toBe(44);
    expect(ZHOUYI_HEXAGRAMS[1].lines[0].changesToHexagramNumber).toBe(24);
  });

  it("stores line positions, centrality, proper position and correspondence consistently", () => {
    for (const hexagram of ZHOUYI_HEXAGRAMS) {
      for (const line of hexagram.lines) {
        expect(zhouyiLineId(hexagram.number, line.position)).toMatch(/^\d{2}-[1-6]$/);
        expect(line.isCentral).toBe(line.position === 2 || line.position === 5);
        expect(line.isCorrect).toBe(
          (line.lineType === "yang" && line.position % 2 === 1)
            || (line.lineType === "yin" && line.position % 2 === 0)
        );
        const pairedPosition = line.position <= 3 ? line.position + 3 : line.position - 3;
        expect(line.correspondingPosition).toBe(pairedPosition);
        expect(line.hasCorrespondence).toBe(
          hexagram.binary[line.position - 1] !== hexagram.binary[pairedPosition - 1]
        );
      }
    }
  });

  it("keeps the Qian and Kun special lines without inventing extras", () => {
    const withExtraLines = ZHOUYI_HEXAGRAMS.filter(item => item.extraLineText);
    expect(withExtraLines.map(item => item.name)).toEqual(["乾", "坤"]);
    expect(withExtraLines.map(item => item.extraLineLabel)).toEqual(["用九", "用六"]);
  });
});
