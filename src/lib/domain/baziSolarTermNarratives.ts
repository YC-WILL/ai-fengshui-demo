import type {
  BaziBirthSolarTermFactsV1,
  SolarTermName
} from "./baziBirthSolarTermFacts";

export const BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION = "bazi-solar-term-narrative-v1" as const;

export const BAZI_SOLAR_TERM_EXPRESSION_RULES = {
  voice: "second_person",
  sequence: ["confirmed_birth_term", "current_term_natural_scene"],
  requireConfirmedFacts: true,
  requireHumanReview: true,
  forbidUncertainFallback: true,
  keepTechnicalMetadataInternal: true
} as const;

export const BAZI_SOLAR_TERM_BIRTH_FLOW_ENDING = "这是大自然给予你的专属意象，同时也伴随你来到这个世界，你的生命由此开始流动。";

function withBirthFlowEnding(narrative: string) {
  return `${narrative}${BAZI_SOLAR_TERM_BIRTH_FLOW_ENDING}`;
}

export const JING_ZHE_BIRTH_NARRATIVE = withBirthFlowEnding("你降生之时恰逢惊蛰，大地刚刚惊醒蛰伏万物，寒气尚未完全褪去，生机却已经破土萌发。");

export interface BaziSolarTermNarrativeEntry {
  id: string;
  solarTerm: SolarTermName;
  nextSolarTerm: SolarTermName;
  reviewStatus: "human_reviewed_approved";
  factDependencies: readonly ["certainty", "currentTerm", "nextTerm"];
  narrative: string;
  contentVersion: typeof BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION;
  interpretationKind: "project_original_solar_term_reading";
}

export const BAZI_SOLAR_TERM_NARRATIVE_CATALOG = {
  "小寒": {
    id: "bazi-solar-term-narrative:小寒:v1",
    solarTerm: "小寒",
    nextSolarTerm: "大寒",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢小寒，寒风渐渐收紧山川的轮廓，霜雪正在加深，河流放慢脚步，草木把生机藏进根系，天地进入清冷而安静的冬日深处。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "大寒": {
    id: "bazi-solar-term-narrative:大寒:v1",
    solarTerm: "大寒",
    nextSolarTerm: "立春",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢大寒，天地进入一年寒意最深的时刻，河土凝结，万物收声，山川在冰雪中沉静下来，新的生机则藏在封冻的土地之下悄然酝酿。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "立春": {
    id: "bazi-solar-term-narrative:立春:v1",
    solarTerm: "立春",
    nextSolarTerm: "雨水",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢立春，东风开始松动沉寂已久的土地，冬日寒意仍未散尽，冰层下已有水流苏醒，草木的嫩芽也在泥土里准备伸展。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "雨水": {
    id: "bazi-solar-term-narrative:雨水:v1",
    solarTerm: "雨水",
    nextSolarTerm: "惊蛰",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢雨水，冰雪渐渐化作润泽土地的水流，寒暖仍在交替，细雨浸入泥土，沉睡一冬的草木开始吸收春天最初的滋养。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "惊蛰": {
    id: "bazi-solar-term-narrative:惊蛰:v1",
    solarTerm: "惊蛰",
    nextSolarTerm: "春分",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: JING_ZHE_BIRTH_NARRATIVE,
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "春分": {
    id: "bazi-solar-term-narrative:春分:v1",
    solarTerm: "春分",
    nextSolarTerm: "清明",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢春分，白昼与黑夜平分时光，暖意均匀铺向山野，花木舒展枝叶，燕影掠过渐暖的天空，春天呈现出明亮而充盈的模样。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "清明": {
    id: "bazi-solar-term-narrative:清明:v1",
    solarTerm: "清明",
    nextSolarTerm: "谷雨",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢清明，天地清澈，春光明净，细雨洗去草木与山川间的尘埃，新叶在湿润空气中舒展，田野呈现出鲜明而蓬勃的颜色。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "谷雨": {
    id: "bazi-solar-term-narrative:谷雨:v1",
    solarTerm: "谷雨",
    nextSolarTerm: "立夏",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢谷雨，绵密春雨落入田畴，谷物得到生长所需的水分，暮春正在完成最后的滋养，花木繁盛，万物在温润的天地间加速舒展。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "立夏": {
    id: "bazi-solar-term-narrative:立夏:v1",
    solarTerm: "立夏",
    nextSolarTerm: "小满",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢立夏，春日的花木已经铺陈成熟，暖风带来渐盛的暑意，枝叶变得浓密，水面映着明亮日光，天地呈现出初夏丰茂的模样。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "小满": {
    id: "bazi-solar-term-narrative:小满:v1",
    solarTerm: "小满",
    nextSolarTerm: "芒种",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢小满，田野里的籽粒开始灌浆，却尚未完全饱满，雨水与热意一同增长，枝叶蓬勃伸展，丰盛正在天地之间慢慢形成。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "芒种": {
    id: "bazi-solar-term-narrative:芒种:v1",
    solarTerm: "芒种",
    nextSolarTerm: "夏至",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢芒种，有芒的谷物进入收获与播种的繁忙时刻，阳光、雨水与劳作同时变得密集，田野翻动着新旧交替的气息，大地在忙碌中孕育成熟。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "夏至": {
    id: "bazi-solar-term-narrative:夏至:v1",
    solarTerm: "夏至",
    nextSolarTerm: "小暑",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢夏至，白昼伸展到一年之中最长的时刻，阳光铺满大地，树木撑开浓密绿荫，草木的生长抵达盛处，暑意也在明亮之中逐渐积聚。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "小暑": {
    id: "bazi-solar-term-narrative:小暑:v1",
    solarTerm: "小暑",
    nextSolarTerm: "大暑",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢小暑，盛夏的热意开始清晰显现，阳光变得炽烈，蝉鸣穿过浓密树荫，雷雨偶尔带来短暂清凉，草木仍在湿热交织的天地间旺盛生长。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "大暑": {
    id: "bazi-solar-term-narrative:大暑:v1",
    solarTerm: "大暑",
    nextSolarTerm: "立秋",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢大暑，暑热抵达一年中最浓烈的阶段，日光炽盛，雨水充沛，空气里积蓄着热浪与雷雨，万物释放出盛夏最强烈的生命力。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "立秋": {
    id: "bazi-solar-term-narrative:立秋:v1",
    solarTerm: "立秋",
    nextSolarTerm: "处暑",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢立秋，盛夏的热意尚未离去，清凉已经潜入清晨与夜晚，风吹过逐渐成熟的田野，果实在暑气深处悄悄积累重量。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "处暑": {
    id: "bazi-solar-term-narrative:处暑:v1",
    solarTerm: "处暑",
    nextSolarTerm: "白露",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢处暑，持续许久的炎热开始收敛锋芒，天空渐渐显得高远，晚风带来清晰凉意，山野褪去盛夏的躁动，田畴进入沉静的成熟阶段。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "白露": {
    id: "bazi-solar-term-narrative:白露:v1",
    solarTerm: "白露",
    nextSolarTerm: "秋分",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢白露，清晨的水汽凝成晶莹露珠，昼夜之间的凉意逐渐分明，草木收起盛夏的浓绿，清风掠过枝头，淡淡秋色开始显现。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "秋分": {
    id: "bazi-solar-term-narrative:秋分:v1",
    solarTerm: "秋分",
    nextSolarTerm: "寒露",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢秋分，白昼与黑夜再次均分时光，秋风带来清爽凉意，谷物与果实陆续成熟，天空澄澈高远，天地在丰收之中显得平稳而开阔。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "寒露": {
    id: "bazi-solar-term-narrative:寒露:v1",
    solarTerm: "寒露",
    nextSolarTerm: "霜降",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢寒露，清晨露水染上更深的凉意，秋风穿过渐疏的枝叶，山野由青转黄，远处雁影划过长空，万物开始收束向外伸展的力量。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "霜降": {
    id: "bazi-solar-term-narrative:霜降:v1",
    solarTerm: "霜降",
    nextSolarTerm: "立冬",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢霜降，清霜开始覆上草木与田野，深秋完成最后一次浓烈着色，枝叶在寒风中渐渐飘落，天地把曾经的丰盛缓缓收回沉静之中。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "立冬": {
    id: "bazi-solar-term-narrative:立冬:v1",
    solarTerm: "立冬",
    nextSolarTerm: "小雪",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢立冬，秋日的生长与收获已经告一段落，寒气逐渐稳定下来，水面开始凝结薄冰，土地归于安静，万物把力量收藏进漫长冬季。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "小雪": {
    id: "bazi-solar-term-narrative:小雪:v1",
    solarTerm: "小雪",
    nextSolarTerm: "大雪",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢小雪，北风带来冬天最初清晰的雪意，寒冷逐日加深，大地尚未完全封冻，细碎雪花已经开始落向屋瓦、枝头与辽阔田野。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "大雪": {
    id: "bazi-solar-term-narrative:大雪:v1",
    solarTerm: "大雪",
    nextSolarTerm: "冬至",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢大雪，天地间的寒意与雪意一同加深，山川逐渐归于洁白寂静，草木收紧枝叶，把生机牢牢守在根脉深处，等待冰雪消融后的再次萌发。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  },
  "冬至": {
    id: "bazi-solar-term-narrative:冬至:v1",
    solarTerm: "冬至",
    nextSolarTerm: "小寒",
    reviewStatus: "human_reviewed_approved",
    factDependencies: ["certainty", "currentTerm", "nextTerm"],
    narrative: withBirthFlowEnding("你降生之时恰逢冬至，白昼收缩到一年之中最短的时刻，寒意包裹山川，万物沉入安静的冬藏，阳光却已经在漫长黑夜深处悄然开始回转。"),
    contentVersion: BAZI_SOLAR_TERM_NARRATIVE_CONTENT_VERSION,
    interpretationKind: "project_original_solar_term_reading"
  }
} as const satisfies Record<SolarTermName, BaziSolarTermNarrativeEntry>;

export type BaziSolarTermNarrativeSelection =
  | {
      status: "available";
      key: keyof typeof BAZI_SOLAR_TERM_NARRATIVE_CATALOG;
      entry: BaziSolarTermNarrativeEntry;
    }
  | {
      status: "not_available";
      reason: "facts_unavailable" | "facts_uncertain" | "content_not_reviewed" | "fact_mismatch";
    };

export function selectBaziSolarTermNarrative(
  facts: BaziBirthSolarTermFactsV1 | null
): BaziSolarTermNarrativeSelection {
  if (!facts || facts.certainty === "unavailable") {
    return { status: "not_available", reason: "facts_unavailable" };
  }
  if (facts.certainty !== "confirmed") {
    return { status: "not_available", reason: "facts_uncertain" };
  }
  if (!facts.currentTerm || !facts.nextTerm) {
    return { status: "not_available", reason: "fact_mismatch" };
  }

  const key = facts.currentTerm as keyof typeof BAZI_SOLAR_TERM_NARRATIVE_CATALOG;
  const entry = BAZI_SOLAR_TERM_NARRATIVE_CATALOG[key];
  if (!entry) {
    return { status: "not_available", reason: "content_not_reviewed" };
  }
  if (
    entry.reviewStatus !== "human_reviewed_approved"
    || entry.solarTerm !== facts.currentTerm
    || entry.nextSolarTerm !== facts.nextTerm
  ) {
    return { status: "not_available", reason: "fact_mismatch" };
  }
  return { status: "available", key, entry };
}
