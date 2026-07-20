import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const VERSION = "2026-07-20.wikisource-v1";
const API_URL = "https://zh.wikisource.org/w/api.php";
const OUTPUT = resolve("prisma/data/zhouyi-canon.json");

const HEXAGRAM_NAMES = [
  "乾", "坤", "屯", "蒙", "需", "訟", "師", "比", "小畜", "履", "泰", "否", "同人", "大有", "謙", "豫",
  "隨", "蠱", "臨", "觀", "噬嗑", "賁", "剝", "復", "无妄", "大畜", "頤", "大過", "坎", "離", "咸", "恒",
  "遯", "大壯", "晉", "明夷", "家人", "睽", "蹇", "解", "損", "益", "夬", "姤", "萃", "升", "困", "井",
  "革", "鼎", "震", "艮", "漸", "歸妹", "豐", "旅", "巽", "兌", "渙", "節", "中孚", "小過", "既濟", "未濟"
];

const TRIGRAMS = [
  { id: "qian", name: "乾", symbol: "☰", binary: "111", canonicalImage: "天", canonicalVirtue: "健", familyRole: "父", laterHeavenDirection: "西北", laterFivePhase: "金" },
  { id: "dui", name: "兌", symbol: "☱", binary: "110", canonicalImage: "澤", canonicalVirtue: "說", familyRole: "少女", laterHeavenDirection: "西", laterFivePhase: "金" },
  { id: "li", name: "離", symbol: "☲", binary: "101", canonicalImage: "火", canonicalVirtue: "麗", familyRole: "中女", laterHeavenDirection: "南", laterFivePhase: "火" },
  { id: "zhen", name: "震", symbol: "☳", binary: "100", canonicalImage: "雷", canonicalVirtue: "動", familyRole: "長男", laterHeavenDirection: "東", laterFivePhase: "木" },
  { id: "xun", name: "巽", symbol: "☴", binary: "011", canonicalImage: "風、木", canonicalVirtue: "入", familyRole: "長女", laterHeavenDirection: "東南", laterFivePhase: "木" },
  { id: "kan", name: "坎", symbol: "☵", binary: "010", canonicalImage: "水", canonicalVirtue: "陷", familyRole: "中男", laterHeavenDirection: "北", laterFivePhase: "水" },
  { id: "gen", name: "艮", symbol: "☶", binary: "001", canonicalImage: "山", canonicalVirtue: "止", familyRole: "少男", laterHeavenDirection: "東北", laterFivePhase: "土" },
  { id: "kun", name: "坤", symbol: "☷", binary: "000", canonicalImage: "地", canonicalVirtue: "順", familyRole: "母", laterHeavenDirection: "西南", laterFivePhase: "土" }
];

const trigramByName = new Map(TRIGRAMS.map(trigram => [trigram.name, trigram]));
const wait = milliseconds => new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));

const rawByTitle = new Map();
for (let start = 0; start < HEXAGRAM_NAMES.length; start += 32) {
  const names = HEXAGRAM_NAMES.slice(start, start + 32);
  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    rvprop: "ids|content",
    rvslots: "main",
    titles: names.map(name => `周易/${name}`).join("|"),
    format: "json",
    formatversion: "2"
  });
  const payload = await fetchPage(`batch ${start / 32 + 1}`, params);
  for (const page of payload.query?.pages ?? []) rawByTitle.set(page.title, page);
  await wait(500);
}

const rawPages = [];
for (let index = 0; index < HEXAGRAM_NAMES.length; index += 1) {
  const name = HEXAGRAM_NAMES[index];
  const title = `周易/${name}`;
  const page = rawByTitle.get(title);
  const revision = page?.revisions?.[0];
  const wikitext = revision?.slots?.main?.content;
  if (!wikitext) throw new Error(`${title} has no wikitext`);
  rawPages.push({
    number: index + 1,
    name,
    revision: revision.revid,
    wikitext
  });
}

const parsedBase = rawPages.map(parseHexagram);
const numberByBinary = new Map(parsedBase.map(item => [item.binary, item.number]));
const hexagrams = parsedBase.map(hexagram => ({
  ...hexagram,
  lines: hexagram.lines.map(line => {
    const bits = hexagram.binary.split("");
    bits[line.position - 1] = bits[line.position - 1] === "1" ? "0" : "1";
    const correspondingPosition = line.position <= 3 ? line.position + 3 : line.position - 3;
    return {
      ...line,
      isCentral: line.position === 2 || line.position === 5,
      isCorrect: (line.lineType === "yang" && line.position % 2 === 1)
        || (line.lineType === "yin" && line.position % 2 === 0),
      correspondingPosition,
      hasCorrespondence: hexagram.binary[line.position - 1] !== hexagram.binary[correspondingPosition - 1],
      changesToHexagramNumber: numberByBinary.get(bits.join(""))
    };
  })
}));

validate(TRIGRAMS, hexagrams);

const output = {
  version: VERSION,
  source: {
    title: "《周易》",
    provider: "維基文庫",
    indexUrl: "https://zh.wikisource.org/wiki/周易",
    license: "原典属公有领域；维基文库页面按 CC BY-SA 4.0 提供",
    fetchedDate: "2026-07-20"
  },
  trigrams: TRIGRAMS.map(trigram => ({
    ...trigram,
    version: VERSION,
    sourceUrl: "https://ctext.org/book-of-changes/shuo-gua"
  })),
  hexagrams
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`[zhouyi] wrote ${hexagrams.length} hexagrams and ${hexagrams.reduce((sum, item) => sum + item.lines.length, 0)} lines to ${OUTPUT}`);

async function fetchPage(page, params) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`${API_URL}?${params}`, {
      headers: { "user-agent": "GuaAn/1.0 (structured Zhouyi preservation; source attribution included)" }
    });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`${page} fetch failed: ${response.status}`);
    }
    await wait(1_000 * (2 ** attempt));
  }
  throw new Error(`${page} fetch failed after retries`);
}

function parseHexagram({ number, name, revision, wikitext }) {
  const normalized = normalizeWikitext(wikitext);
  const structure = normalized.match(/([乾兌離震巽坎艮坤])下([乾兌離震巽坎艮坤])上/);
  const symbol = normalized.match(/(?:alt|alr)=([䷀-䷿])/)?.[1]
    ?? String.fromCodePoint(0x4dc0 + number - 1);
  if (!structure) throw new Error(`${name} structure missing`);
  const lower = trigramByName.get(structure[1]);
  const upper = trigramByName.get(structure[2]);
  if (!lower || !upper) throw new Error(`${name} trigram missing`);

  const classicIndex = normalized.indexOf("易經：");
  const tuanIndex = normalized.indexOf("彖曰：");
  const imageIndex = normalized.indexOf("象曰：");
  const wenyanIndex = normalized.indexOf("文言曰：");
  if (classicIndex < 0 || tuanIndex < 0 || imageIndex < 0) throw new Error(`${name} canonical sections missing`);

  const classicLines = normalized.slice(classicIndex, tuanIndex).split("\n").map(cleanLine).filter(Boolean);
  const lineEntries = classicLines.filter(line => /^(初[六九]|[六九][二三四五]|上[六九]|用[六九])[：，]/.test(line));
  const judgmentLine = classicLines.find(line => line !== "易經：" && !lineEntries.includes(line));
  if (!judgmentLine) throw new Error(`${name} judgment missing`);

  const tuanEnd = imageIndex;
  const tuan = sectionContent(normalized.slice(tuanIndex + "彖曰：".length, tuanEnd));
  const imageEnd = wenyanIndex >= 0 ? wenyanIndex : normalized.length;
  const imageLines = normalized.slice(imageIndex + "象曰：".length, imageEnd).split("\n").map(cleanLine).filter(Boolean);
  const bigImage = imageLines.find(line => !/^(初|[六九]|上|用)/.test(line));
  const smallImages = imageLines.filter(line => line !== bigImage);

  const canonicalSix = lineEntries.slice(0, 6);
  const extraEntry = lineEntries[6];
  const canonicalSmallImages = smallImages.slice(0, 6);
  const extraImage = smallImages[6];
  const binary = `${lower.binary}${upper.binary}`;
  const lines = canonicalSix.map((entry, index) => {
    const separatorIndex = entry.search(/[：，]/);
    const label = entry.slice(0, separatorIndex);
    const text = entry.slice(separatorIndex + 1);
    const lineType = binary[index] === "1" ? "yang" : "yin";
    if ((lineType === "yang" && !label.includes("九")) || (lineType === "yin" && !label.includes("六"))) {
      throw new Error(`${name} line ${index + 1} label does not match binary`);
    }
    return {
      position: index + 1,
      label,
      lineType,
      text,
      imageText: canonicalSmallImages[index] ?? ""
    };
  });

  return {
    number,
    name,
    symbol,
    binary,
    lowerTrigramId: lower.id,
    upperTrigramId: upper.id,
    judgment: judgmentLine.replace(new RegExp(`^${name}：?`), ""),
    tuan,
    image: bigImage ?? "",
    wenyan: wenyanIndex >= 0 ? sectionContent(normalized.slice(wenyanIndex + "文言曰：".length)) : null,
    extraLineLabel: extraEntry?.split(/[：，]/)[0] ?? null,
    extraLineText: extraEntry?.split(/[：，]/).slice(1).join("：") ?? null,
    extraLineImage: extraImage ?? null,
    sourceUrl: `https://zh.wikisource.org/wiki/周易/${name}`,
    sourceRevision: String(revision),
    sourceLicense: "Public Domain / CC BY-SA 4.0 transcription",
    version: VERSION,
    isActive: true,
    lines
  };
}

function normalizeWikitext(value) {
  let current = value;
  for (let pass = 0; pass < 4; pass += 1) {
    current = current.replace(/-\{([^{}]+)\}-/g, "$1");
  }
  return current
    .replace(/\{\{\*\|([^{}]+)\}\}/g, "（$1）")
    .replace(/<[^>]+>/g, "")
    .replace(/'''/g, "")
    .replace(/&nbsp;/g, " ");
}

function cleanLine(value) {
  return value
    .replace(/^\*+#?\s*/, "")
    .replace(/^[:;]+\s*/, "")
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
    .trim();
}

function sectionContent(value) {
  return value.split("\n").map(cleanLine).filter(Boolean).join("\n");
}

function validate(trigrams, hexagrams) {
  if (trigrams.length !== 8) throw new Error(`expected 8 trigrams, got ${trigrams.length}`);
  if (new Set(trigrams.map(item => item.binary)).size !== 8) throw new Error("trigram binaries are not unique");
  if (hexagrams.length !== 64) throw new Error(`expected 64 hexagrams, got ${hexagrams.length}`);
  if (new Set(hexagrams.map(item => item.binary)).size !== 64) throw new Error("hexagram binaries are not unique");
  if (new Set(hexagrams.map(item => item.symbol)).size !== 64) throw new Error("hexagram symbols are not unique");
  for (const hexagram of hexagrams) {
    if (hexagram.lines.length !== 6) throw new Error(`${hexagram.name} does not have six canonical lines`);
    if (!hexagram.judgment || !hexagram.tuan || !hexagram.image) throw new Error(`${hexagram.name} text layer incomplete`);
    for (const line of hexagram.lines) {
      if (!line.text || !line.imageText || !line.changesToHexagramNumber) {
        throw new Error(`${hexagram.name} line ${line.position} incomplete`);
      }
    }
  }
  if (!hexagrams[0].extraLineText || !hexagrams[1].extraLineText) throw new Error("Qian/Kun special line text missing");
}
