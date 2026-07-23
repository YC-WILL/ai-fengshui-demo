import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const VERSION = "2026-07-20.birth-daily-v1";
const OUTPUT = resolve("prisma/data/traditional-calendar-catalog.json");

const SOURCES = {
  sanming: {
    title: "《三命通会》卷一",
    url: "https://zh.wikisource.org/wiki/三命通會_(四庫全書本)/卷01"
  },
  yuanhai: {
    title: "《渊海子平》",
    url: "https://zh.wikisource.org/wiki/淵海子平"
  },
  huainanzi: {
    title: "《淮南子·天文训》",
    url: "https://ctext.org/huai-nan-zi/tian-wen-xun/zhs"
  },
  meihua: {
    title: "《梅花易数》卷一",
    url: "https://zh.wikisource.org/wiki/梅花易數/卷一"
  }
};

const phaseSpecs = [
  ["wood", "木", "东", "春"],
  ["fire", "火", "南", "夏"],
  ["earth", "土", "中", "四季月"],
  ["metal", "金", "西", "秋"],
  ["water", "水", "北", "冬"]
];

const stemSpecs = [
  ["jia", "甲", "wood", "yang", "东"], ["yi", "乙", "wood", "yin", "东"],
  ["bing", "丙", "fire", "yang", "南"], ["ding", "丁", "fire", "yin", "南"],
  ["wu", "戊", "earth", "yang", "中"], ["ji", "己", "earth", "yin", "中"],
  ["geng", "庚", "metal", "yang", "西"], ["xin", "辛", "metal", "yin", "西"],
  ["ren", "壬", "water", "yang", "北"], ["gui", "癸", "water", "yin", "北"]
];

const branchSpecs = [
  ["zi", "子", "water", "yang", "北", 11, "23:00–00:59"],
  ["chou", "丑", "earth", "yin", "东北", 12, "01:00–02:59"],
  ["yin", "寅", "wood", "yang", "东北", 1, "03:00–04:59"],
  ["mao", "卯", "wood", "yin", "东", 2, "05:00–06:59"],
  ["chen", "辰", "earth", "yang", "东南", 3, "07:00–08:59"],
  ["si", "巳", "fire", "yin", "东南", 4, "09:00–10:59"],
  ["wu", "午", "fire", "yang", "南", 5, "11:00–12:59"],
  ["wei", "未", "earth", "yin", "西南", 6, "13:00–14:59"],
  ["shen", "申", "metal", "yang", "西南", 7, "15:00–16:59"],
  ["you", "酉", "metal", "yin", "西", 8, "17:00–18:59"],
  ["xu", "戌", "earth", "yang", "西北", 9, "19:00–20:59"],
  ["hai", "亥", "water", "yin", "西北", 10, "21:00–22:59"]
];

const hiddenStems = {
  zi: [["gui", "main"]],
  chou: [["ji", "main"], ["gui", "middle"], ["xin", "residual"]],
  yin: [["jia", "main"], ["bing", "middle"], ["wu", "residual"]],
  mao: [["yi", "main"]],
  chen: [["wu", "main"], ["yi", "middle"], ["gui", "residual"]],
  si: [["bing", "main"], ["wu", "middle"], ["geng", "residual"]],
  wu: [["ding", "main"], ["ji", "middle"]],
  wei: [["ji", "main"], ["ding", "middle"], ["yi", "residual"]],
  shen: [["geng", "main"], ["ren", "middle"], ["wu", "residual"]],
  you: [["xin", "main"]],
  xu: [["wu", "main"], ["xin", "middle"], ["ding", "residual"]],
  hai: [["ren", "main"], ["jia", "middle"]]
};

const solarTerms = [
  ["lichun", "立春", 315, "jie", "yin"], ["yushui", "雨水", 330, "qi", "yin"],
  ["jingzhe", "惊蛰", 345, "jie", "mao"], ["chunfen", "春分", 0, "qi", "mao"],
  ["qingming", "清明", 15, "jie", "chen"], ["guyu", "谷雨", 30, "qi", "chen"],
  ["lixia", "立夏", 45, "jie", "si"], ["xiaoman", "小满", 60, "qi", "si"],
  ["mangzhong", "芒种", 75, "jie", "wu"], ["xiazhi", "夏至", 90, "qi", "wu"],
  ["xiaoshu", "小暑", 105, "jie", "wei"], ["dashu", "大暑", 120, "qi", "wei"],
  ["liqiu", "立秋", 135, "jie", "shen"], ["chushu", "处暑", 150, "qi", "shen"],
  ["bailu", "白露", 165, "jie", "you"], ["qiufen", "秋分", 180, "qi", "you"],
  ["hanlu", "寒露", 195, "jie", "xu"], ["shuangjiang", "霜降", 210, "qi", "xu"],
  ["lidong", "立冬", 225, "jie", "hai"], ["xiaoxue", "小雪", 240, "qi", "hai"],
  ["daxue", "大雪", 255, "jie", "zi"], ["dongzhi", "冬至", 270, "qi", "zi"],
  ["xiaohan", "小寒", 285, "jie", "chou"], ["dahan", "大寒", 300, "qi", "chou"]
];

const tenGodNames = {
  peer_same: ["bijian", "比肩"], peer_opposite: ["jiecai", "劫财"],
  generates_same: ["shishen", "食神"], generates_opposite: ["shangguan", "伤官"],
  controls_same: ["piancai", "偏财"], controls_opposite: ["zhengcai", "正财"],
  controlled_by_same: ["qisha", "七杀"], controlled_by_opposite: ["zhengguan", "正官"],
  generated_by_same: ["pianyin", "偏印"], generated_by_opposite: ["zhengyin", "正印"]
};

const entities = [];
const relations = [];
const methodRules = [];
const interpretations = [];

for (const [index, [code, name, direction, season]] of phaseSpecs.entries()) {
  entities.push(entity(`phase-${code}`, "five_phase", code, name, index + 1,
    { direction, season }, SOURCES.sanming));
}

for (const [index, [code, name, phase, polarity, direction]] of stemSpecs.entries()) {
  entities.push(entity(`stem-${code}`, "heavenly_stem", code, name, index + 1,
    { phase, polarity, direction }, SOURCES.sanming));
}

for (const [index, [code, name, phase, polarity, direction, lunarMonth, hourRange]] of branchSpecs.entries()) {
  entities.push(entity(`branch-${code}`, "earthly_branch", code, name, index + 1,
    { phase, polarity, direction, lunarMonth, hourRange, ordinal: index + 1 }, SOURCES.sanming));
}

for (let index = 0; index < 60; index += 1) {
  const stem = stemSpecs[index % 10];
  const branch = branchSpecs[index % 12];
  entities.push(entity(`sexagenary-${String(index + 1).padStart(2, "0")}`, "sexagenary_cycle",
    `${stem[0]}-${branch[0]}`, `${stem[1]}${branch[1]}`, index + 1,
    { stemCode: stem[0], branchCode: branch[0] }, SOURCES.sanming));
}

for (const [index, [code, name, longitude, termType, monthBranch]] of solarTerms.entries()) {
  entities.push(entity(`solar-term-${code}`, "solar_term", code, name, index + 1,
    { solarLongitude: longitude, termType, monthBranch, isMonthBoundary: termType === "jie" }, SOURCES.huainanzi));
}

for (const [code, name] of Object.values(tenGodNames)) {
  entities.push(entity(`ten-god-${code}`, "ten_god", code, name, null,
    { scope: "day-stem-relative-relationship" }, SOURCES.yuanhai));
}

const phaseByCode = new Map(phaseSpecs.map(([code]) => [code, code]));
const generates = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const controls = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
for (const [subject] of phaseSpecs) {
  for (const [object] of phaseSpecs) {
    let relationType = "same";
    if (generates[subject] === object) relationType = "generates";
    else if (generates[object] === subject) relationType = "generated_by";
    else if (controls[subject] === object) relationType = "controls";
    else if (controls[object] === subject) relationType = "controlled_by";
    relations.push(relation(`phase-${subject}-${object}`, "five_phase", relationType,
      [`phase:${subject}`], [`phase:${object}`], null, {}, SOURCES.sanming));
  }
}

for (const [branchCode, stems] of Object.entries(hiddenStems)) {
  for (const [stemCode, layer] of stems) {
    relations.push(relation(`hidden-${branchCode}-${stemCode}`, "bazi", "hidden_stem",
      [`branch:${branchCode}`], [`stem:${stemCode}`], null, { layer }, SOURCES.yuanhai));
  }
}

const stemByCode = new Map(stemSpecs.map(item => [item[0], { phase: item[2], polarity: item[3] }]));
for (const [dayCode] of stemSpecs) {
  for (const [otherCode] of stemSpecs) {
    const day = stemByCode.get(dayCode);
    const other = stemByCode.get(otherCode);
    const samePolarity = day.polarity === other.polarity;
    let phaseRelation = "peer";
    if (generates[day.phase] === other.phase) phaseRelation = "generates";
    else if (controls[day.phase] === other.phase) phaseRelation = "controls";
    else if (generates[other.phase] === day.phase) phaseRelation = "generated_by";
    else if (controls[other.phase] === day.phase) phaseRelation = "controlled_by";
    const [tenGodCode, tenGodName] = tenGodNames[`${phaseRelation}_${samePolarity ? "same" : "opposite"}`];
    relations.push(relation(`ten-god-${dayCode}-${otherCode}`, "bazi", "ten_god_mapping",
      [`dayStem:${dayCode}`], [`otherStem:${otherCode}`], `tenGod:${tenGodCode}`,
      { tenGodName, phaseRelation, samePolarity }, SOURCES.yuanhai));
  }
}

for (const [left, right, result] of [
  ["jia", "ji", "earth"], ["yi", "geng", "metal"], ["bing", "xin", "water"],
  ["ding", "ren", "wood"], ["wu", "gui", "fire"]
]) relations.push(relation(`stem-combine-${left}-${right}`, "bazi", "stem_combination",
  [`stem:${left}`, `stem:${right}`], [], `phase:${result}`, {}, SOURCES.sanming));

addBranchPairs("branch_six_harmony", [["zi", "chou"], ["yin", "hai"], ["mao", "xu"], ["chen", "you"], ["si", "shen"], ["wu", "wei"]]);
addBranchPairs("branch_clash", [["zi", "wu"], ["chou", "wei"], ["yin", "shen"], ["mao", "you"], ["chen", "xu"], ["si", "hai"]]);
addBranchPairs("branch_harm", [["zi", "wei"], ["chou", "wu"], ["yin", "si"], ["mao", "chen"], ["shen", "hai"], ["you", "xu"]]);
addBranchPairs("branch_break", [["zi", "you"], ["chou", "chen"], ["yin", "hai"], ["mao", "wu"], ["si", "shen"], ["wei", "xu"]]);

for (const [members, result] of [
  [["shen", "zi", "chen"], "water"], [["hai", "mao", "wei"], "wood"],
  [["yin", "wu", "xu"], "fire"], [["si", "you", "chou"], "metal"]
]) relations.push(relation(`branch-three-harmony-${members.join("-")}`, "bazi", "branch_three_harmony",
  members.map(code => `branch:${code}`), [], `phase:${result}`, {}, SOURCES.sanming));

for (const [members, result] of [
  [["hai", "zi", "chou"], "water"], [["yin", "mao", "chen"], "wood"],
  [["si", "wu", "wei"], "fire"], [["shen", "you", "xu"], "metal"]
]) relations.push(relation(`branch-season-meeting-${members.join("-")}`, "bazi", "branch_season_meeting",
  members.map(code => `branch:${code}`), [], `phase:${result}`, {}, SOURCES.sanming));

for (const [code, members, label] of [
  ["ungrateful", ["yin", "si", "shen"], "无恩之刑"],
  ["power", ["chou", "xu", "wei"], "恃势之刑"],
  ["discourteous", ["zi", "mao"], "无礼之刑"],
  ["self", ["chen", "wu", "you", "hai"], "自刑"]
]) relations.push(relation(`branch-punishment-${code}`, "bazi", "branch_punishment",
  members.map(member => `branch:${member}`), [], null, { label }, SOURCES.sanming));

const seasonalPatterns = {
  spring: { branches: ["yin", "mao"], strengths: { wood: "prosperous", fire: "supporting", water: "resting", metal: "confined", earth: "dormant" } },
  summer: { branches: ["si", "wu"], strengths: { fire: "prosperous", earth: "supporting", wood: "resting", water: "confined", metal: "dormant" } },
  autumn: { branches: ["shen", "you"], strengths: { metal: "prosperous", water: "supporting", earth: "resting", fire: "confined", wood: "dormant" } },
  winter: { branches: ["hai", "zi"], strengths: { water: "prosperous", wood: "supporting", metal: "resting", earth: "confined", fire: "dormant" } },
  seasonal_earth: { branches: ["chen", "xu", "chou", "wei"], strengths: { earth: "prosperous", metal: "supporting", fire: "resting", wood: "confined", water: "dormant" } }
};
for (const [seasonCode, pattern] of Object.entries(seasonalPatterns)) {
  for (const branchCode of pattern.branches) {
    for (const [phaseCode, strength] of Object.entries(pattern.strengths)) {
      relations.push(relation(`seasonal-${branchCode}-${phaseCode}`, "bazi", "seasonal_phase_strength",
        [`monthBranch:${branchCode}`], [`phase:${phaseCode}`], `strength:${strength}`,
        { seasonCode }, SOURCES.sanming));
    }
  }
}

addBaziMethodRules();
addMeihuaMethodRules();
addInterpretations();

validate();
const output = {
  version: VERSION,
  scope: "birth profile and daily traditional calendar foundation",
  sources: Object.values(SOURCES),
  entities,
  relations,
  methodRules,
  interpretations
};
await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  entities: entities.length,
  relations: relations.length,
  methodRules: methodRules.length,
  interpretations: interpretations.length,
  output: OUTPUT
}));

function entity(id, category, code, name, sequence, attributes, source) {
  return { id, version: VERSION, system: systemFor(category), category, code, name, sequence, attributes, sourceTitle: source.title, sourceUrl: source.url, isActive: true };
}

function relation(id, system, relationType, subjectCodes, objectCodes, resultCode, attributes, source) {
  return { id, version: VERSION, system, relationType, subjectCodes, objectCodes, resultCode, attributes, sourceTitle: source.title, sourceUrl: source.url, isActive: true };
}

function method(id, methodName, step, code, title, rule, explanation, source) {
  methodRules.push({ id, version: VERSION, method: methodName, step, code, title, rule, explanation, sourceTitle: source.title, sourceUrl: source.url, isActive: true });
}

function interpretation(id, category, code, title, summary, detail) {
  interpretations.push({
    id, version: VERSION, category, code, title, summary, detail,
    allowedUse: "仅解释可计算的传统结构与关系，不推断具体事件结果。",
    forbiddenUse: "不得用于疾病、灾难、寿命、财富或关系结果预测，不得制造恐惧。",
    sourceTitle: "蟾先森依据传统结构原创整理",
    sourceUrl: SOURCES.sanming.url,
    isActive: true
  });
}

function systemFor(category) {
  if (category === "solar_term") return "traditional_calendar";
  if (category === "five_phase") return "five_phase";
  return "bazi";
}

function addBranchPairs(relationType, pairs) {
  for (const [left, right] of pairs) relations.push(relation(`${relationType}-${left}-${right}`, "bazi", relationType,
    [`branch:${left}`, `branch:${right}`], [], null, {}, SOURCES.sanming));
}

function addBaziMethodRules() {
  method("bazi-year-boundary", "four_pillars", 1, "year_boundary", "年柱以立春为界",
    { boundarySolarTerm: "lichun", beforeBoundaryUsesPreviousYear: true },
    "公历年份不能直接等同干支年份，交立春前仍按上一干支年处理。", SOURCES.sanming);
  method("bazi-month-boundary", "four_pillars", 2, "month_boundary", "月柱以十二节为界",
    { boundaries: solarTerms.filter(item => item[3] === "jie").map(item => item[0]), useLunarMonthStart: false },
    "月支依节令切换，不以农历初一作为月柱边界。", SOURCES.sanming);
  method("bazi-day-master", "four_pillars", 3, "day_master", "以日干为日主",
    { sourceField: "dayPillar.stem" }, "十神和五行关系均从日干出发计算。", SOURCES.yuanhai);
  method("bazi-five-tigers", "four_pillars", 4, "month_stem", "五虎遁定寅月月干",
    { jia_ji: "bing", yi_geng: "wu", bing_xin: "geng", ding_ren: "ren", wu_gui: "jia" },
    "先由年干确定寅月月干，再随月份顺推。", SOURCES.sanming);
  method("bazi-hour-branch", "four_pillars", 5, "hour_branch", "按十二时辰定时支",
    { ranges: Object.fromEntries(branchSpecs.map(item => [item[0], item[6]])) },
    "当地钟表时间先完成时区处理，再落入十二时辰。", SOURCES.sanming);
  method("bazi-five-rats", "four_pillars", 6, "hour_stem", "五鼠遁定子时天干",
    { jia_ji: "jia", yi_geng: "bing", bing_xin: "wu", ding_ren: "geng", wu_gui: "ren" },
    "先由日干确定子时天干，再随时支顺推。", SOURCES.sanming);
  method("bazi-timezone", "four_pillars", 7, "timezone", "出生时间先归属地点时区",
    { defaultTimezone: "Asia/Shanghai", preserveOriginalInput: true },
    "保存原始时间、地点和时区，计算值与原始输入分开。", SOURCES.sanming);
  method("bazi-true-solar-time", "four_pillars", 8, "true_solar_time", "真太阳时默认不自动启用",
    { defaultEnabled: false, requireLongitude: true, discloseAdjustment: true },
    "若未来启用，必须显示经度、调整分钟数与算法版本。", SOURCES.sanming);
  method("bazi-zi-day-boundary", "four_pillars", 9, "zi_day_boundary", "子时换日采用可版本化口径",
    { default: "civil_midnight", alternatives: ["late_zi"] },
    "不同传承存在换日口径差异，产品必须固定默认值并保留方法版本。", SOURCES.sanming);
  method("bazi-solar-term-time", "four_pillars", 10, "solar_term_timestamp", "交节使用逐年精确时刻",
    { storage: "computed", fixedCalendarDateForbidden: true },
    "节气定义可入库，具体年份的交节时刻必须由历算结果提供。", SOURCES.huainanzi);
  method("daily-fact-layer", "daily_relation", 1, "daily_facts", "先生成当日客观时序",
    { fields: ["solarTerm", "yearPillar", "monthPillar", "dayPillar", "monthBranch", "seasonalPhaseStrength"] },
    "每日关系必须建立在可复算的干支和节气事实之上。", SOURCES.sanming);
  method("daily-relation-layer", "daily_relation", 2, "birth_daily_relations", "再计算生辰与当日关系",
    { relations: ["ten_god_mapping", "branch_six_harmony", "branch_clash", "branch_harm", "branch_break", "seasonal_phase_strength"] },
    "只呈现命盘与当日之间实际成立的结构关系。", SOURCES.yuanhai);
  method("daily-conflict-resolution", "daily_relation", 3, "relation_priority", "关系冲突按事实层级合并",
    { priority: ["solar_term_boundary", "month_branch", "day_stem", "day_branch"], neverCollapseToScore: true },
    "不把多种关系压缩成单一吉凶分数。", SOURCES.yuanhai);
}

function addMeihuaMethodRules() {
  method("meihua-trigram-numbers", "meihua_birth_time", 1, "trigram_numbers", "先天八卦数",
    { qian: 1, dui: 2, li: 3, zhen: 4, xun: 5, kan: 6, gen: 7, kun: 8 },
    "起卦数与八卦建立固定映射。", SOURCES.meihua);
  method("meihua-time-input", "meihua_birth_time", 2, "time_input", "出生时刻按年月日时取数",
    { year: "earthlyBranchOrdinal", month: "lunarMonthNumber", day: "lunarDayNumber", hour: "earthlyBranchOrdinal" },
    "此处使用出生时刻起卦，与四柱结构并列保存，不宣称两者是同一算法。", SOURCES.meihua);
  method("meihua-upper", "meihua_birth_time", 3, "upper_trigram", "年月日之和定上卦",
    { formula: "(year + month + day) mod 8", zeroRemainder: 8 },
    "余数对应先天八卦数。", SOURCES.meihua);
  method("meihua-lower", "meihua_birth_time", 4, "lower_trigram", "年月日时之和定下卦",
    { formula: "(year + month + day + hour) mod 8", zeroRemainder: 8 },
    "在年月日之和上加入时数。", SOURCES.meihua);
  method("meihua-moving-line", "meihua_birth_time", 5, "moving_line", "年月日时之和定动爻",
    { formula: "(year + month + day + hour) mod 6", zeroRemainder: 6 },
    "自初爻向上计数。", SOURCES.meihua);
  method("meihua-mutual", "meihua_birth_time", 6, "mutual_hexagram", "二三四与三四五爻组成互卦",
    { lowerPositions: [2, 3, 4], upperPositions: [3, 4, 5] },
    "互卦由本卦中间四爻重新组合。", SOURCES.meihua);
  method("meihua-change", "meihua_birth_time", 7, "changed_hexagram", "动爻阴阳反转形成变卦",
    { flipOnlyMovingLine: true }, "其余五爻保持不变。", SOURCES.meihua);
  method("meihua-body-use", "meihua_birth_time", 8, "body_and_use", "动爻所在经卦为用，另一经卦为体",
    { movingTrigram: "use", stableTrigram: "body" },
    "体用用于观察上下卦五行关系，不直接等同事件吉凶。", SOURCES.meihua);
}

function addInterpretations() {
  const phaseTexts = {
    same: ["同类", "两者五行相同", "表示同一类五行之气并见，强弱仍需结合月令和所在位置。"],
    generates: ["我生", "前者生后者", "表示五行之气由前者向后者流转，不单独判断好坏。"],
    generated_by: ["生我", "前者得到后者相生", "表示后者为前者提供生助，仍需观察整体是否需要。"],
    controls: ["我克", "前者制约后者", "表示两种五行之间存在制约关系，不等同现实冲突。"],
    controlled_by: ["克我", "前者受到后者制约", "表示结构中存在约束方向，不作事件结果预测。"]
  };
  for (const [code, [title, summary, detail]] of Object.entries(phaseTexts)) interpretation(`interpret-phase-${code}`, "five_phase_relation", code, title, summary, detail);

  for (const [key, [code, name]] of Object.entries(tenGodNames)) interpretation(`interpret-ten-god-${code}`, "ten_god", code, name,
    "以日干为中心形成的传统五行与阴阳关系名称。", `映射依据为${key.includes("same") ? "阴阳同类" : "阴阳异类"}及五行生克方向；不作为人格或职业标签。`);

  const relationTexts = {
    branch_six_harmony: ["六合", "两个地支形成传统合关系", "只说明组合成立，不直接解释为顺利或必然合作。"],
    branch_three_harmony: ["三合", "三个地支共同指向一种五行结构", "缺少成员时不得展示为完整三合。"],
    branch_season_meeting: ["三会", "三个相邻季节地支形成方气", "必须三个成员齐全才标记完整三会。"],
    branch_clash: ["六冲", "两个地支处于相对位置", "只呈现结构牵动，不预测争执、损失或灾祸。"],
    branch_harm: ["六害", "两个地支形成传统害关系", "属于结构参考，不扩写成他人伤害或关系结论。"],
    branch_break: ["六破", "两个地支形成传统破关系", "不将其解释为破财、破裂或必然坏结果。"],
    branch_punishment: ["刑", "若干地支形成传统刑关系", "只显示成立条件和名称，不进行恐惧化解释。"]
  };
  for (const [code, [title, summary, detail]] of Object.entries(relationTexts)) interpretation(`interpret-${code}`, "branch_relation", code, title, summary, detail);

  const strengthTexts = {
    prosperous: ["旺", "当令", "该五行处在当前月令的主要时序位置。"],
    supporting: ["相", "得时序相生", "该五行承接当令五行之气。"],
    resting: ["休", "暂居休位", "表示时序位置退后，不等同缺陷。"],
    confined: ["囚", "受时序约束", "表示季节支持较少，不作困境预测。"],
    dormant: ["死", "传统旺衰名称", "仅为古法时序术语，产品展示时必须同时说明并非生命或灾祸判断。"]
  };
  for (const [code, [title, summary, detail]] of Object.entries(strengthTexts)) interpretation(`interpret-strength-${code}`, "seasonal_strength", code, title, summary, detail);
}

function validate() {
  if (entities.filter(item => item.category === "five_phase").length !== 5) throw new Error("five phases incomplete");
  if (entities.filter(item => item.category === "heavenly_stem").length !== 10) throw new Error("heavenly stems incomplete");
  if (entities.filter(item => item.category === "earthly_branch").length !== 12) throw new Error("earthly branches incomplete");
  if (entities.filter(item => item.category === "sexagenary_cycle").length !== 60) throw new Error("sexagenary cycle incomplete");
  if (entities.filter(item => item.category === "solar_term").length !== 24) throw new Error("solar terms incomplete");
  if (relations.filter(item => item.relationType === "hidden_stem").length !== 28) throw new Error("hidden stems incomplete");
  if (relations.filter(item => item.relationType === "ten_god_mapping").length !== 100) throw new Error("ten-god mappings incomplete");
  if (relations.filter(item => item.relationType === "seasonal_phase_strength").length !== 60) throw new Error("seasonal strengths incomplete");
  for (const collection of [entities, relations, methodRules, interpretations]) {
    if (new Set(collection.map(item => item.id)).size !== collection.length) throw new Error("duplicate catalog ids");
  }
  const content = JSON.stringify({ entities, relations, methodRules, interpretations });
  if (/心理学|星座|保证发财|命中注定/.test(content)) throw new Error("forbidden content found");
  if (![...phaseByCode].length) throw new Error("phase catalog missing");
}
