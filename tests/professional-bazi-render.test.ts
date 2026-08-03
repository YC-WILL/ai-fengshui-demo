import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProfessionalBaziPanel, { MOON_PHASE_LABELS } from "@/components/ProfessionalBaziPanel";
import BaziMainlinePanel from "@/components/BaziMainlinePanel";
import { computeBazi } from "@/lib/domain/bazi";
import { buildBaziBirthMoonPhaseFacts } from "@/lib/domain/baziBirthMoonPhaseFacts";
import { buildBaziBirthSolarTermFacts } from "@/lib/domain/baziBirthSolarTermFacts";
import { buildBaziBirthXiuFacts } from "@/lib/domain/baziBirthXiuFacts";
import { buildBaziMainlineNarrative } from "@/lib/domain/baziMainlineNarrative";
import { buildProfessionalBaziFactsOnServer } from "@/lib/professionalBaziServer";

describe("Professional Bazi mobile matrix render", () => {
  it("renders a compact semantic table and all confirmed hidden-stem facts directly", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1988-03-12",
      birthTime: "09:35",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(
      chart,
      new Date("2026-07-29T07:18:42.321Z")
    );

    const markup = renderToStaticMarkup(
      createElement(ProfessionalBaziPanel, {
        facts: professionalFacts,
        birthSolarTermFacts: buildBaziBirthSolarTermFacts(chart),
        birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(chart),
        birthXiuFacts: buildBaziBirthXiuFacts(chart)
      })
    );

    expect(markup).toContain('role="table"');
    expect(markup.match(/role="row"/g)).toHaveLength(5);
    expect(markup.match(/class="professional-hidden-cell"/g)).toHaveLength(4);
    expect(markup).toContain('id="professional-hidden-facts-title">藏干事实</h4>');
    expect(markup).toContain("气序");
    expect(markup).toContain("十神");
    expect(markup).toContain("关系");
    expect(markup).toContain("阴阳");
    expect(markup).not.toMatch(/<details|<summary|aria-expanded|aria-controls|>展开<|>收起</);
    expect(markup).not.toMatch(/仅供参考|只负责|只呈现|系统判断|吉凶判断|可能是|大致处于|建议结合实际/);
    expect(markup).not.toContain("7px");
    expect(markup).not.toContain("8px");
  });

  it("renders confirmed solar-term facts with exact seconds, timezone and trace data", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-03-05",
      birthTime: "10:23",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, new Date("2026-07-29T07:18:42.321Z"));
    const markup = renderToStaticMarkup(createElement(ProfessionalBaziPanel, {
      facts: professionalFacts,
      birthSolarTermFacts: buildBaziBirthSolarTermFacts(chart),
      birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(chart),
      birthXiuFacts: buildBaziBirthXiuFacts(chart)
    }));

    expect(markup).toContain("出生节气事实");
    expect(markup).toContain("惊蛰");
    expect(markup).toContain("春分");
    expect(markup).toContain("2024年03月05日 10:22:45（UTC+08:00）");
    expect(markup).toContain("2024年03月20日 11:06:25（UTC+08:00）");
    expect(markup).toContain("Asia/Shanghai");
    expect(markup).toContain("lunar-typescript@1.8.6");
    expect(markup).toContain("dependency:lunar-typescript:getPrevJieQi:getNextJieQi");
    const order = ["四柱事实矩阵", "藏干事实", "参照点与结构关系", "出生节气事实", "出生月相事实", "出生日值二十八宿", "当前时间事实", "计算口径与来源", "技术追溯"]
      .map(title => markup.indexOf(`>${title}<`));
    expect(order.every(position => position > -1)).toBe(true);
    expect(order).toEqual([...order].sort((first, second) => first - second));
  });

  it("renders uncertain candidates directly and no hidden-stem controls", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-03-05",
      birthTime: "",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(
      chart,
      new Date("2026-07-29T07:18:42.321Z")
    );

    const markup = renderToStaticMarkup(
      createElement(ProfessionalBaziPanel, {
        facts: professionalFacts,
        birthSolarTermFacts: buildBaziBirthSolarTermFacts(chart),
        birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(chart),
        birthXiuFacts: buildBaziBirthXiuFacts(chart)
      })
    );

    expect(markup).toContain("交节候选");
    expect(markup).toContain("交节前节气");
    expect(markup).toContain("雨水");
    expect(markup).toContain("交节后节气");
    expect(markup).toContain("惊蛰");
    expect(markup).not.toMatch(/<details|<summary|aria-expanded|aria-controls|>展开<|>收起</);
  });

  it("renders unavailable solar-term facts with a direct reason", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-03-05",
      birthTime: "10:23",
      birthLocation: "虚构测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const invalidChart = structuredClone(chart);
    invalidChart.inputSnapshot.birthDate = "invalid";
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, new Date("2026-07-29T07:18:42.321Z"));
    const markup = renderToStaticMarkup(createElement(ProfessionalBaziPanel, {
      facts: professionalFacts,
      birthSolarTermFacts: buildBaziBirthSolarTermFacts(invalidChart),
      birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(chart),
      birthXiuFacts: buildBaziBirthXiuFacts(chart)
    }));

    expect(markup).toContain("确定性");
    expect(markup).toContain("无法计算");
    expect(markup).toContain("原因");
    expect(markup).toContain("计算失败");
  });

  it("renders confirmed moon-phase facts and the explicit Chinese phase label", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-03-17",
      birthTime: "12:11",
      birthLocation: "虚构月相测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, new Date("2026-07-29T07:18:42.321Z"));
    const markup = renderToStaticMarkup(createElement(ProfessionalBaziPanel, {
      facts: professionalFacts,
      birthSolarTermFacts: buildBaziBirthSolarTermFacts(chart),
      birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(chart),
      birthXiuFacts: buildBaziBirthXiuFacts(chart)
    }));

    expect(MOON_PHASE_LABELS).toEqual({
      new_moon: "朔",
      waxing_crescent: "蛾眉月（盈）",
      first_quarter: "上弦",
      waxing_gibbous: "盈凸月",
      full_moon: "望",
      waning_gibbous: "亏凸月",
      last_quarter: "下弦",
      waning_crescent: "残月"
    });
    for (const value of [
      "出生月相事实", "月相分类", "上弦", "first_quarter", "日月黄经差", "90.002°",
      "月龄", "6.7990 日", "上一次朔时", "下一次朔时", "本次朔望月长度",
      "29.3892 日", "Asia/Shanghai", "lunar-typescript@1.8.6",
      "dependency:lunar-typescript:ShouXingUtil:msaLon:msaLonT:dtT",
      "project:eight-phase-elongation-sectors-v1"
    ]) expect(markup).toContain(value);
  });

  it("renders two unknown-time candidates without asserting one moon phase", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-03-12",
      birthTime: "",
      birthLocation: "虚构月相测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: true
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, new Date("2026-07-29T07:18:42.321Z"));
    const markup = renderToStaticMarkup(createElement(ProfessionalBaziPanel, {
      facts: professionalFacts,
      birthSolarTermFacts: buildBaziBirthSolarTermFacts(chart),
      birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(chart),
      birthXiuFacts: buildBaziBirthXiuFacts(chart)
    }));

    expect(markup).toContain("出生月相事实");
    expect(markup).toContain("不确定");
    expect(markup).toContain("当地民用日期起点候选");
    expect(markup).toContain("当地民用日期终点候选");
    expect(markup.match(/采样时刻 ·/g)).toHaveLength(2);
    expect(markup.match(/日月黄经差 ·/g)).toHaveLength(2);
    expect(markup.match(/月龄 ·/g)).toHaveLength(2);
    expect(markup).toContain("月相 · 朔（new_moon）");
    expect(markup).toContain("月相 · 蛾眉月（盈）（waxing_crescent）");
    expect(markup).not.toContain("<dt>月相分类</dt>");
  });

  it("renders unavailable moon-phase status with no candidates or inferred phase", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-03-17",
      birthTime: "12:11",
      birthLocation: "虚构月相测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const invalidChart = structuredClone(chart);
    invalidChart.inputSnapshot.birthDate = "invalid";
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, new Date("2026-07-29T07:18:42.321Z"));
    const markup = renderToStaticMarkup(createElement(ProfessionalBaziPanel, {
      facts: professionalFacts,
      birthSolarTermFacts: buildBaziBirthSolarTermFacts(chart),
      birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(invalidChart),
      birthXiuFacts: buildBaziBirthXiuFacts(chart)
    }));

    expect(markup).toContain("出生月相事实");
    expect(markup).toContain("无法计算");
    expect(markup).toContain("计算失败原因");
    expect(markup).toContain("计算失败");
    expect(markup).not.toContain("当地民用日期起点候选");
    expect(markup).not.toContain("<dt>月相分类</dt>");
  });

  it("renders confirmed birth daily xiu facts with their calendar basis and trace", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1986-05-29",
      birthTime: "08:30",
      birthLocation: "虚构星宿测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, new Date("2026-07-29T07:18:42.321Z"));
    const markup = renderToStaticMarkup(createElement(ProfessionalBaziPanel, {
      facts: professionalFacts,
      birthSolarTermFacts: buildBaziBirthSolarTermFacts(chart),
      birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(chart),
      birthXiuFacts: buildBaziBirthXiuFacts(chart)
    }));

    for (const value of [
      "出生日值二十八宿", "1986-05-29", "斗木獬", "七政", "木", "动物", "獬",
      "四宫", "北方", "四神兽", "玄武", "出生日支", "酉", "星期序号", "4（0 为星期日）",
      "出生地民用日期 00:00 换日", "lunar-typescript@1.8.6",
      "dependency:lunar-typescript:Lunar:getXiu:getZheng:getAnimal:getGong:getShou"
    ]) expect(markup).toContain(value);
    expect(markup).not.toMatch(/星宿吉凶|宿歌|本命星宿|出生时月亮所在星宿|天文月宿位置|月球实际经过某宿/);
  });

  it("renders unavailable birth daily xiu status without an inferred mansion", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "1986-05-29",
      birthTime: "08:30",
      birthLocation: "虚构星宿测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const invalidChart = structuredClone(chart);
    invalidChart.inputSnapshot.birthDate = "invalid";
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, new Date("2026-07-29T07:18:42.321Z"));
    const markup = renderToStaticMarkup(createElement(ProfessionalBaziPanel, {
      facts: professionalFacts,
      birthSolarTermFacts: buildBaziBirthSolarTermFacts(chart),
      birthMoonPhaseFacts: buildBaziBirthMoonPhaseFacts(chart),
      birthXiuFacts: buildBaziBirthXiuFacts(invalidChart)
    }));

    expect(markup).toContain("出生日值二十八宿");
    expect(markup).toContain("无法计算");
    expect(markup).toContain("计算失败原因");
    expect(markup).not.toContain("<dt>完整组合</dt>");
  });

  it("keeps professional moon-phase trace fields out of the ordinary analysis markup", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2024-03-17",
      birthTime: "12:11",
      birthLocation: "虚构月相测试城市",
      timezone: "Asia/Shanghai",
      unknownTime: false
    });
    const { professionalFacts } = buildProfessionalBaziFactsOnServer(chart, new Date("2026-07-29T07:18:42.321Z"));
    const narrative = buildBaziMainlineNarrative(
      professionalFacts,
      buildBaziBirthSolarTermFacts(chart),
      buildBaziBirthMoonPhaseFacts(chart)
    );
    expect(narrative).not.toBeNull();
    const markup = renderToStaticMarkup(createElement(BaziMainlinePanel, { narrative: narrative! }));

    expect(markup).toContain(">月相<");
    expect(markup).toContain("日月黄经差");
    expect(markup).toContain("月龄");
    expect(markup).not.toMatch(/出生月相事实|月相分类|上一次朔时|下一次朔时|朔望月|出生日值二十八宿|七政|四神兽|算法版本|天文来源规则|八相分类规则|技术追溯/);
  });
});
