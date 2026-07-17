import { describe, it, expect } from "vitest";
import {
  computeBazi, personalityProfile, lifeSuggestions, lifeReminders,
  friendlyCoreConclusion, friendlyElementNote
  ,personalNarrativeFacts
} from "@/lib/domain/bazi";
import { behavioralAccent, relationshipAccent } from "@/lib/domain/behavioralAccent";

describe("computeBazi (simplified)", () => {
  it("uses twelve hidden birth-date accents without exposing their source", () => {
    const dates = ["2000-03-21", "2000-04-20", "2000-05-21", "2000-06-22", "2000-07-23", "2000-08-23", "2000-09-23", "2000-10-24", "2000-11-23", "2000-12-22", "2000-01-20", "2000-02-19"];
    const profiles = dates.map(date => behavioralAccent(date).profile);
    expect(new Set(profiles).size).toBe(12);
    expect(JSON.stringify(profiles)).not.toMatch(/星座|白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼/);

    const relation = relationshipAccent(dates[0], dates[1]);
    expect(JSON.stringify(relation)).not.toMatch(/星座|白羊|金牛/);
    expect(relation.observation).toMatch(/可能|习惯/);
    expect(relation.behaviorFacts.firstPerson.traitKeywords).toHaveLength(3);
    expect(relation.behaviorFacts.secondPerson.traitKeywords).toHaveLength(3);
  });

  it("maps every boundary day to the intended one of twelve behavior accents", () => {
    const ranges = [
      ["03-21", "04-19"], ["04-20", "05-20"], ["05-21", "06-21"],
      ["06-22", "07-22"], ["07-23", "08-22"], ["08-23", "09-22"],
      ["09-23", "10-23"], ["10-24", "11-22"], ["11-23", "12-21"],
      ["12-22", "01-19"], ["01-20", "02-18"], ["02-19", "03-20"]
    ];

    const boundaryPairs = ranges.map(([start, end]) => [
      behavioralAccent(`2004-${start}`),
      behavioralAccent(`2004-${end}`)
    ]);
    boundaryPairs.forEach(([start, end]) => {
      expect(start.traitKeywords).toEqual(end.traitKeywords);
    });
    expect(new Set(boundaryPairs.map(([accent]) => accent.traitKeywords.join("|"))).size).toBe(12);
  });

  it("uses both people's birth-date accents in relationship facts", () => {
    const relation = relationshipAccent("2006-10-03", "2000-06-30");
    expect(relation.behaviorFacts.firstPerson.traitKeywords).toEqual(["重视公平", "善于协调", "顾及立场"]);
    expect(relation.behaviorFacts.secondPerson.traitKeywords).toEqual(["重视安全", "照顾感受", "依赖熟悉"]);
    expect(relation.behaviorFacts.responsePattern).toBe("different");
    expect(relation.behaviorFacts.firstPerson.response).not.toBe(relation.behaviorFacts.secondPerson.response);
    expect(JSON.stringify(relation.behaviorFacts)).not.toMatch(/星座|白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼/);
  });
  it("returns 4 pillars when birth time is known", () => {
    const chart = computeBazi({
      gender: "male",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    expect(chart.year.pillarLabel).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(chart.month.pillarLabel).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(chart.day.pillarLabel).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(chart.hour?.pillarLabel).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    expect(chart.dayMaster).toBe(chart.day.stem);
  });

  it("omits hour pillar when unknownTime=true", () => {
    const chart = computeBazi({
      gender: "female",
      birthDate: "1985-03-22",
      birthTime: "",
      unknownTime: true
    });
    expect(chart.hour).toBeNull();
    expect(chart.notes.join(" ")).toMatch(/时柱/);
  });

  it("returns 5-element distribution that sums to 6 or 8", () => {
    const chart = computeBazi({
      gender: "male",
      birthDate: "2000-01-01",
      birthTime: "12:00",
      unknownTime: false
    });
    const counts = chart.elementDistribution.counts;
    const sum = counts.木 + counts.火 + counts.土 + counts.金 + counts.水;
    expect([6, 8]).toContain(sum); // 4 pillars * 2 chars = 8 (with hour) or 6 (without)
  });

  it("personalityProfile returns a 100-180 character behavioral description", () => {
    ["1985-03-22", "1990-06-15", "1995-11-11", "2000-01-01", "2004-08-18"].forEach(birthDate => {
      const chart = computeBazi({
        gender: "other",
        birthDate,
        birthTime: "06:00",
        unknownTime: false
      });
      const profile = personalityProfile(chart);
      expect(profile.length).toBeGreaterThanOrEqual(100);
      expect(profile.length).toBeLessThanOrEqual(180);
      expect(profile).not.toContain("这位朋友");
      expect(profile).toMatch(/互动|决定|压力/);
      expect(profile).toMatch(/可能|倾向|建议|从行为模式看/);
      expect(profile).not.toMatch(/一定|必然|注定|保证|焦虑症|抑郁症|心理有问题/);
    });
  });

  it("varies personality profiles and life suggestions by chart structure", () => {
    const first = computeBazi({
      gender: "male",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    const second = computeBazi({
      gender: "female",
      birthDate: "2000-01-01",
      birthTime: "12:00",
      unknownTime: false
    });
    expect(personalityProfile(first)).not.toBe(personalityProfile(second));
    expect(lifeSuggestions(first)).toHaveLength(3);
    expect(lifeSuggestions(second)).toHaveLength(3);
    expect(lifeSuggestions(first)).not.toEqual(lifeSuggestions(second));
  });

  it("turns a concrete work setback into a grounded seven-day response", () => {
    const chart = computeBazi({
      gender: "female",
      birthDate: "1977-06-06",
      birthTime: "",
      unknownTime: true
    });
    const facts = personalNarrativeFacts(chart, "我是保险中介人，最近连续谈单失败，情绪低落并怀疑自己");
    expect(facts.situationResponse).toMatch(/被拒绝|能力评价|适合这份工作/);
    expect(facts.situationActionPlan).toHaveLength(5);
    expect(facts.situationActionPlan?.join(" ")).toMatch(/需求、信任、时机、条件/);
    expect(facts.situationActionPlan?.join(" ")).toMatch(/七天|第 7 天/);
    expect(facts.supportReminder).toMatch(/信任的人|专业/);
    expect(JSON.stringify(facts)).not.toMatch(/诊断|抑郁症/);
  });

  it("turns a student's study and social困扰 into small next-day actions", () => {
    const chart = computeBazi({
      gender: "other",
      birthDate: "2006-10-03",
      birthTime: "09:00",
      unknownTime: false
    });
    const facts = personalNarrativeFacts(chart, "大学生活很无味，焦虑找不到出口，不擅长交朋友，学业压力很大");
    expect(facts.situationResponse).toMatch(/生活|任务压力|关系困扰/);
    expect(facts.situationActionPlan).toHaveLength(5);
    expect(facts.situationActionPlan?.join(" ")).toMatch(/明天|3 分钟|25 分钟/);
    expect(facts.supportReminder).toMatch(/学校心理中心|专业支持/);
  });

  it("builds concise, friendly and chart-specific free report copy", () => {
    const first = computeBazi({
      gender: "male",
      birthDate: "1990-06-15",
      birthTime: "10:30",
      unknownTime: false
    });
    const second = computeBazi({
      gender: "female",
      birthDate: "2000-01-01",
      birthTime: "12:00",
      unknownTime: false
    });

    expect(friendlyCoreConclusion(first)).not.toContain("这位朋友");
    expect(friendlyCoreConclusion(first)).toMatch(/遇到重要事情|通常|可能/);
    expect(friendlyCoreConclusion(first)).not.toMatch(/有自己的步调|站稳脚跟|留一点空间/);
    expect(friendlyElementNote(first)).not.toContain("这位朋友");
    expect(friendlyElementNote(first).length).toBeLessThan(100);
    expect(lifeReminders(first)).toHaveLength(2);
    expect(lifeReminders(first)).not.toEqual(lifeReminders(second));
  });

  it("keeps the reported customer pair meaningfully distinct even with the same strongest element", () => {
    const younger = computeBazi({
      gender: "male", birthDate: "2006-10-03", birthTime: "", unknownTime: true
    });
    const older = computeBazi({
      gender: "male", birthDate: "2000-06-30", birthTime: "", unknownTime: true
    });
    const youngerParts = [
      friendlyCoreConclusion(younger), personalityProfile(younger),
      ...lifeReminders(younger), ...lifeSuggestions(younger)
    ];
    const olderParts = [
      friendlyCoreConclusion(older), personalityProfile(older),
      ...lifeReminders(older), ...lifeSuggestions(older)
    ];

    expect(younger.elementDistribution.strongest).toBe("土");
    expect(older.elementDistribution.strongest).toBe("土");
    expect(friendlyCoreConclusion(younger)).toMatch(/彼此都能接受|关系中的细节/);
    expect(friendlyCoreConclusion(older)).toMatch(/身边人的感受|熟悉的生活/);
    expect(lifeReminders(younger).filter(item => lifeReminders(older).includes(item))).toHaveLength(0);
    expect(lifeSuggestions(younger).filter(item => lifeSuggestions(older).includes(item))).toHaveLength(0);
    expect(bigramSimilarity(youngerParts.join(""), olderParts.join(""))).toBeLessThan(0.35);
  });

  it("keeps a full leap-year date matrix varied, concrete and within content boundaries", () => {
    const samples = Array.from({ length: 366 }, (_, index) => {
      const birthDate = new Date(Date.UTC(2004, 0, index + 1)).toISOString().slice(0, 10);
      const chart = computeBazi({
        gender: "other", birthDate, birthTime: "12:00", unknownTime: false
      });
      const core = friendlyCoreConclusion(chart);
      const profile = personalityProfile(chart);
      const reminders = lifeReminders(chart);
      const suggestions = lifeSuggestions(chart);
      return {
        birthDate,
        dayMaster: chart.dayMaster,
        accent: behavioralAccent(birthDate).response,
        core,
        profile,
        reminders,
        suggestions,
        full: [core, friendlyElementNote(chart), profile, ...reminders, ...suggestions].join("|")
      };
    });

    for (const sample of samples) {
      expect(sample.profile.length).toBeGreaterThanOrEqual(100);
      expect(sample.profile.length).toBeLessThanOrEqual(180);
      expect(sample.reminders).toHaveLength(2);
      expect(sample.suggestions).toHaveLength(3);
      expect(new Set(sample.reminders).size).toBe(2);
      expect(new Set(sample.suggestions).size).toBe(3);
      expect(sample.core).not.toMatch(/有自己的步调|站稳脚跟|留一点空间|相信自己/);
      expect(sample.full).not.toMatch(/星座|白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼/);
      expect(sample.full).not.toMatch(/一定|必然|注定|保证|焦虑症|抑郁症|心理有问题/);
    }

    expect(new Set(samples.map(sample => sample.accent)).size).toBe(12);
    expect(new Set(samples.map(sample => sample.dayMaster)).size).toBe(10);
    expect(new Set(samples.map(sample => sample.core)).size).toBeGreaterThanOrEqual(110);
    expect(new Set(samples.map(sample => sample.profile)).size).toBeGreaterThanOrEqual(110);
    expect(new Set(samples.map(sample => JSON.stringify(sample.reminders))).size).toBeGreaterThanOrEqual(110);
    expect(new Set(samples.map(sample => JSON.stringify(sample.suggestions))).size).toBeGreaterThanOrEqual(200);
    expect(new Set(samples.map(sample => sample.full)).size).toBeGreaterThanOrEqual(270);

    const representativeDates = ["2004-02-19", "2004-04-20", "2004-06-30", "2004-08-23", "2004-10-03", "2004-12-22"];
    const representatives = representativeDates.map(date =>
      samples.find(sample => sample.birthDate === date)?.full ?? ""
    );
    const similarities = representatives.flatMap((first, firstIndex) =>
      representatives.slice(firstIndex + 1).map(second => bigramSimilarity(first, second))
    );
    expect(Math.max(...similarities)).toBeLessThan(0.6);
  });

  it("rejects malformed date", () => {
    expect(() => computeBazi({
      gender: "male",
      birthDate: "not-a-date",
      birthTime: "10:00",
      unknownTime: false
    })).toThrow();
  });
});

function bigramSimilarity(first: string, second: string): number {
  const grams = (value: string) => new Set(
    Array.from({ length: Math.max(value.length - 1, 0) }, (_, index) => value.slice(index, index + 2))
  );
  const a = grams(first);
  const b = grams(second);
  const intersection = [...a].filter(item => b.has(item)).length;
  return intersection / new Set([...a, ...b]).size;
}
