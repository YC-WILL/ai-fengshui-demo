import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BaziMainlinePanel from "@/components/BaziMainlinePanel";
import { computeBazi, type BaziChart } from "@/lib/domain/bazi";
import { buildBaziBirthMoonPhaseFacts } from "@/lib/domain/baziBirthMoonPhaseFacts";
import { buildBaziBirthSolarTermFacts } from "@/lib/domain/baziBirthSolarTermFacts";
import {
  XIU_NAMES,
  buildBaziBirthXiuFacts,
  type BaziBirthXiuFactsV1,
  type XiuName
} from "@/lib/domain/baziBirthXiuFacts";
import { buildBaziMainlineNarrative } from "@/lib/domain/baziMainlineNarrative";
import {
  BAZI_XIU_NARRATIVE_CATALOG,
  hasCompleteBaziXiuNarrativeCatalog,
  selectBaziXiuNarrative
} from "@/lib/domain/baziXiuNarratives";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

// 本文件所有生辰均为虚构测试资料，不对应任何真实人物。
function chartForDate(birthDate: string, unknownTime = false) {
  return computeBazi({
    gender: "other",
    birthDate,
    birthTime: unknownTime ? "" : "08:30",
    birthLocation: "虚构星宿正文测试城市",
    timezone: "Asia/Shanghai",
    unknownTime
  });
}

const baseChart = chartForDate("1986-05-29");
const professionalFacts = buildProfessionalBaziFactsOnServer(
  baseChart,
  new Date("2026-08-03T04:00:00.000Z")
).professionalFacts;

const expectedBindings = {
  角: ["木", "蛟", "东", "青龙"], 亢: ["金", "龙", "东", "青龙"], 氐: ["土", "貉", "东", "青龙"],
  房: ["日", "兔", "东", "青龙"], 心: ["月", "狐", "东", "青龙"], 尾: ["火", "虎", "东", "青龙"], 箕: ["水", "豹", "东", "青龙"],
  斗: ["木", "獬", "北", "玄武"], 牛: ["金", "牛", "北", "玄武"], 女: ["土", "蝠", "北", "玄武"],
  虚: ["日", "鼠", "北", "玄武"], 危: ["月", "燕", "北", "玄武"], 室: ["火", "猪", "北", "玄武"], 壁: ["水", "獝", "北", "玄武"],
  奎: ["木", "狼", "西", "白虎"], 娄: ["金", "狗", "西", "白虎"], 胃: ["土", "彘", "西", "白虎"],
  昴: ["日", "鸡", "西", "白虎"], 毕: ["月", "乌", "西", "白虎"], 觜: ["火", "猴", "西", "白虎"], 参: ["水", "猿", "西", "白虎"],
  井: ["木", "犴", "南", "朱雀"], 鬼: ["金", "羊", "南", "朱雀"], 柳: ["土", "獐", "南", "朱雀"],
  星: ["日", "马", "南", "朱雀"], 张: ["月", "鹿", "南", "朱雀"], 翼: ["火", "蛇", "南", "朱雀"], 轸: ["水", "蚓", "南", "朱雀"]
} as const;

const approvedHashes: Record<XiuName, string> = {
  角: "87272d5ce0e0b55cfe832cc7f65eb77caccaefa02c3af0d276950db2422a092f",
  亢: "9887d1f4f273231e54f64059aaadacc62cb9279d51e4cf5df73d8297d014eb89",
  氐: "ee1565380c64f8ec94a534ea92cb590af31ef53c97e9ede431d44f102c5e7f5a",
  房: "7e927a31996381beaab1d06c65c2802aa71a4ac833d2a94ae36a50b2033c8e92",
  心: "a75853f01a4f8069180ae4df8af1480177bd6c64ccf5b74f35eda5d25670293b",
  尾: "709a52a573d7f2555516340620a53c456168ad1fc2ac56db024dea44e76465fc",
  箕: "05f4eadd8bc5d65025f739a9ab58ce6da6acc576610a85c7146dc99473e8ad46",
  斗: "e7556354fd347c5beb8fc217fcbbb27a41c496017457f8e49b00feb506b028e1",
  牛: "0d95ffccb92cabd07fe18ba3e8a678a059e3367a1c8ce81755206e231b88db6f",
  女: "affe00f56510c12307629c4fdd7a0a0f36e7f79ee0c250e4eed5226607de0268",
  虚: "500dadedb5493c34c36ac19638fdc610c263ef8276157c6166fd55f4f52eaf9c",
  危: "2a149fdbb7dd79425b647e1154e167216fa9f75832d0854815ca9ae9570f9452",
  室: "4bcf716dde13c1182cfb0d1eed6be6c0faf9613bd9b21c89ce2915467ef5c333",
  壁: "b21fbe6a49058d342b4c20bd40e6998e9bc93b1c15a8bfb7606117247dafb75f",
  奎: "0f98387f30669077e4df677e40deb20e753fa3ba03c2a28b4001344e4677d12c",
  娄: "6ed033f60b44544a7c7a416886b941d453240d6ba4eb12ba2cd4b35c3d2e87f9",
  胃: "77f15fa7147e17f0042a84bdf223e3ca174a75c84c9afda789b711bb0b89c34f",
  昴: "586b0a41051a8d1279f87cda935e35db36b83274cb48fd097d22f42a5dd389a9",
  毕: "5fd203915624fc17443f8a85fe92d238ebf9adff5897cd9bd1847271c3fef79f",
  觜: "d18c4656c40beaddb568c9f3923deb3ab3cba0157ba88a56535ee4ed63a13486",
  参: "85d753bb4b487975fc1622a44c05dbbe7e4a20f5a65960a093e47c28ce600191",
  井: "8d71a0d3f691aece3c8a07d731e67798dcf495340f4bb53de791c3bb04038df4",
  鬼: "a08c585f3c8672e2d54a86575ab10c6c393c3933b4edeae268693e47ed9ffd24",
  柳: "1753828878817cd72dbc93539122be431ba482092256da1412f4b5018357a8df",
  星: "87b89d3d7ba1f93d73c98fd6e070a90af68c5cf896460c4affbb43e106de5edb",
  张: "82f84053393c006bb3b8eeb1720047b48eff9eb25783b6c1135c31c9ecf3af67",
  翼: "4617e9c0706bc6500b7b68feb81cbe9f3b8982b0e5f38efdd23f1767ca3be8eb",
  轸: "8f008dea8809a0cd6b4d7a70aee010487a8d35bb19524c4f5e13dbcb59eae2f4"
};

function factsByXiu() {
  const result = new Map<XiuName, BaziBirthXiuFactsV1>();
  for (let offset = 0; offset < 84; offset += 1) {
    const date = new Date(Date.UTC(2024, 0, 1 + offset)).toISOString().slice(0, 10);
    const facts = buildBaziBirthXiuFacts(chartForDate(date));
    if (facts.certainty === "confirmed" && facts.xiu) result.set(facts.xiu, facts);
  }
  return result;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

describe("Bazi reviewed birth daily xiu narratives", () => {
  it("covers all 28 mansions with exact reviewed text and canonical bindings", () => {
    expect(hasCompleteBaziXiuNarrativeCatalog()).toBe(true);
    expect(Object.keys(BAZI_XIU_NARRATIVE_CATALOG)).toEqual([...XIU_NAMES]);
    expect(Object.keys(BAZI_XIU_NARRATIVE_CATALOG)).toHaveLength(28);
    XIU_NAMES.forEach(xiu => {
      const [zheng, animal, gong, shou] = expectedBindings[xiu];
      const entry = BAZI_XIU_NARRATIVE_CATALOG[xiu];
      expect(entry).toMatchObject({ xiu, zheng, animal, gong, shou, reviewStatus: "human_reviewed_approved" });
      expect(sha256(entry.narrative)).toBe(approvedHashes[xiu]);
      expect(entry.narrative).toContain(`${xiu}宿以${zheng}为七政`);
      const [factBinding, traditionalImagery] = entry.narrative.split("\n\n");
      expect(factBinding).toBe(`你出生这天的日值为${xiu}${zheng}${animal}。${xiu}宿以${zheng}为七政，物象为${animal}，归${gong}方${shou}星宫。`);
      expect(traditionalImagery).toMatch(/^在传统四象意象中，/);
    });
    expect(new Set(Object.values(BAZI_XIU_NARRATIVE_CATALOG).map(entry => entry.narrative)).size).toBe(28);
  });

  it("selects and renders every confirmed matching daily xiu", () => {
    const allFacts = factsByXiu();
    expect(allFacts.size).toBe(28);
    XIU_NAMES.forEach(xiu => {
      const facts = allFacts.get(xiu)!;
      expect(selectBaziXiuNarrative(facts)).toEqual({
        status: "available",
        entry: BAZI_XIU_NARRATIVE_CATALOG[xiu]
      });
      const narrative = buildBaziMainlineNarrative(professionalFacts, null, null, facts)!;
      const markup = renderToStaticMarkup(createElement(BaziMainlinePanel, { narrative }));
      expect(markup).toContain('id="bazi-direct-xiu-title">出生日值二十八宿</h3>');
      BAZI_XIU_NARRATIVE_CATALOG[xiu].narrative.split("\n\n").forEach(paragraph => expect(markup).toContain(paragraph));
    });
  });

  it("hides unavailable, incomplete and mismatched facts without fallback", () => {
    const confirmed = buildBaziBirthXiuFacts(baseChart);
    const invalid = structuredClone(baseChart) as BaziChart;
    invalid.inputSnapshot.birthDate = "invalid";
    const unavailable = buildBaziBirthXiuFacts(invalid);
    const incomplete = { ...confirmed, animal: null } as BaziBirthXiuFactsV1;
    const mismatch = { ...confirmed, animal: "龙" } as BaziBirthXiuFactsV1;

    expect(selectBaziXiuNarrative(unavailable)).toEqual({ status: "not_available", reason: "facts_unavailable" });
    expect(selectBaziXiuNarrative(incomplete)).toEqual({ status: "not_available", reason: "facts_incomplete" });
    expect(selectBaziXiuNarrative(mismatch)).toEqual({ status: "not_available", reason: "facts_mismatch" });
    [unavailable, incomplete, mismatch].forEach(facts => {
      const narrative = buildBaziMainlineNarrative(professionalFacts, null, null, facts)!;
      const markup = renderToStaticMarkup(createElement(BaziMainlinePanel, { narrative }));
      expect(markup).not.toMatch(/bazi-direct-xiu|出生日值二十八宿正文|资料不足|无法计算|暂不展示/);
    });
  });

  it("renders an unknown-time confirmed daily xiu without technical uncertainty copy", () => {
    const facts = buildBaziBirthXiuFacts(chartForDate("1986-05-29", true));
    expect(facts.certainty).toBe("confirmed");
    const narrative = buildBaziMainlineNarrative(professionalFacts, null, null, facts)!;
    const markup = renderToStaticMarkup(createElement(BaziMainlinePanel, { narrative }));
    expect(markup).toContain("出生日值二十八宿");
    expect(markup).toContain("你出生这天的日值为斗木獬");
    expect(markup).not.toMatch(/出生时间未提供|未知时间|不确定|候选|算法|来源/);
  });

  it("places the daily xiu after moon phase and before five elements", () => {
    const xiuFacts = buildBaziBirthXiuFacts(baseChart);
    const narrative = buildBaziMainlineNarrative(
      professionalFacts,
      buildBaziBirthSolarTermFacts(baseChart),
      buildBaziBirthMoonPhaseFacts(baseChart),
      xiuFacts
    )!;
    const markup = renderToStaticMarkup(createElement(BaziMainlinePanel, { narrative }));
    const moon = markup.indexOf(">月相<");
    const xiu = markup.indexOf(">出生日值二十八宿<");
    const elements = markup.indexOf(">五行<");
    expect(moon).toBeGreaterThan(-1);
    expect(moon).toBeLessThan(xiu);
    expect(xiu).toBeLessThan(elements);
  });

  it("contains no prohibited interpretation, default text or runtime AI", () => {
    const catalogSource = readFileSync("src/lib/domain/baziXiuNarratives.ts", "utf8");
    const componentSource = readFileSync("src/components/BaziMainlinePanel.tsx", "utf8");
    const narratives = Object.values(BAZI_XIU_NARRATIVE_CATALOG).map(entry => entry.narrative).join("\n");

    expect(narratives).not.toMatch(/吉凶|宿歌|性格|命运|本命星宿|出生时月亮所在星宿|天文月宿位置|月球实际经过某宿|星象印记|星图图景|生辰星象/);
    expect(narratives).not.toMatch(/角宿属木|亢宿属金|氐宿属土|房宿属日|心宿属月/);
    expect(catalogSource).not.toMatch(/@\/lib\/ai|openai|anthropic|generateText|chatCompletion|fallback|defaultNarrative/);
    expect(componentSource).not.toMatch(/birthXiuFacts\.sourceRuleId|birthXiuFacts\.algorithmVersion/);
  });
});
