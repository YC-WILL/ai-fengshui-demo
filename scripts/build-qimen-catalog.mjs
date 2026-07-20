import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const VERSION = "2026-07-20.qimen-foundation-v2";
const OUTPUT = resolve("prisma/data/qimen-catalog.json");
const SOURCES = {
  tongzong: { title: "《奇门遁甲统宗》", url: "https://zh.wikisource.org/zh/奇門遁甲統宗" },
  volume1: { title: "《奇门遁甲统宗》卷一", url: "https://ctext.org/wiki.pl?chapter=666094&if=gb" },
  volume2: { title: "《奇门遁甲统宗》卷二", url: "https://ctext.org/wiki.pl?chapter=491157&if=gb" },
  zhigui: { title: "《奇门旨归》卷一", url: "https://ctext.org/wiki.pl?chapter=360446&if=gb" },
  baojian: { title: "《奇门宝鉴御定》", url: "https://zh.wikisource.org/zh-hant/奇門寶鑑御定" }
};

const entities = [];
const relations = [];
const methodRules = [];
const interpretations = [];

const palaces = [
  ["kan-1", "坎一宫", 1, "坎", "北", "水", 2, 1],
  ["kun-2", "坤二宫", 2, "坤", "西南", "土", 0, 0],
  ["zhen-3", "震三宫", 3, "震", "东", "木", 1, 0],
  ["xun-4", "巽四宫", 4, "巽", "东南", "木", 0, 2],
  ["center-5", "中五宫", 5, null, "中", "土", 1, 1],
  ["qian-6", "乾六宫", 6, "乾", "西北", "金", 2, 2],
  ["dui-7", "兑七宫", 7, "兑", "西", "金", 1, 2],
  ["gen-8", "艮八宫", 8, "艮", "东北", "土", 2, 0],
  ["li-9", "离九宫", 9, "离", "南", "火", 0, 1]
];
const gates = [
  ["rest", "休门", 1, "kan-1", "水", "三吉门"], ["death", "死门", 2, "kun-2", "土", "其余五门"],
  ["injury", "伤门", 3, "zhen-3", "木", "其余五门"], ["delusion", "杜门", 4, "xun-4", "木", "其余五门"],
  ["open", "开门", 6, "qian-6", "金", "三吉门"], ["fear", "惊门", 7, "dui-7", "金", "其余五门"],
  ["life", "生门", 8, "gen-8", "土", "三吉门"], ["scenery", "景门", 9, "li-9", "火", "其余五门"]
];
const stars = [
  ["peng", "天蓬星", 1, "kan-1", "水"], ["rui", "天芮星", 2, "kun-2", "土"],
  ["chong", "天冲星", 3, "zhen-3", "木"], ["fu", "天辅星", 4, "xun-4", "木"],
  ["qin", "天禽星", 5, "center-5", "土"], ["xin", "天心星", 6, "qian-6", "金"],
  ["zhu", "天柱星", 7, "dui-7", "金"], ["ren", "天任星", 8, "gen-8", "土"],
  ["ying", "天英星", 9, "li-9", "火"]
];
const deities = [
  ["chief", "值符"], ["snake", "腾蛇"], ["great-yin", "太阴"], ["harmony", "六合"],
  ["white-tiger", "白虎"], ["black-tortoise", "玄武"], ["nine-earth", "九地"], ["nine-heaven", "九天"]
];
const stems = [
  ["yi", "乙", "three_wonders", "三奇"], ["bing", "丙", "three_wonders", "三奇"], ["ding", "丁", "three_wonders", "三奇"],
  ["wu", "戊", "six_instruments", "六仪"], ["ji", "己", "six_instruments", "六仪"], ["geng", "庚", "six_instruments", "六仪"],
  ["xin", "辛", "six_instruments", "六仪"], ["ren", "壬", "six_instruments", "六仪"], ["gui", "癸", "six_instruments", "六仪"]
];
const leaders = [
  ["jia-zi", "甲子", "wu"], ["jia-xu", "甲戌", "ji"], ["jia-shen", "甲申", "geng"],
  ["jia-wu", "甲午", "xin"], ["jia-chen", "甲辰", "ren"], ["jia-yin", "甲寅", "gui"]
];
const yuanSpecs = [["upper", "上元"], ["middle", "中元"], ["lower", "下元"]];
const solarTermBureaus = [
  ["lichun", "立春", "yang", [8, 5, 2]], ["yushui", "雨水", "yang", [9, 6, 3]],
  ["jingzhe", "惊蛰", "yang", [1, 7, 4]], ["chunfen", "春分", "yang", [3, 9, 6]],
  ["qingming", "清明", "yang", [4, 1, 7]], ["guyu", "谷雨", "yang", [5, 2, 8]],
  ["lixia", "立夏", "yang", [4, 1, 7]], ["xiaoman", "小满", "yang", [5, 2, 8]],
  ["mangzhong", "芒种", "yang", [6, 3, 9]], ["xiazhi", "夏至", "yin", [9, 3, 6]],
  ["xiaoshu", "小暑", "yin", [8, 2, 5]], ["dashu", "大暑", "yin", [7, 1, 4]],
  ["liqiu", "立秋", "yin", [2, 5, 8]], ["chushu", "处暑", "yin", [1, 4, 7]],
  ["bailu", "白露", "yin", [9, 3, 6]], ["qiufen", "秋分", "yin", [7, 1, 4]],
  ["hanlu", "寒露", "yin", [6, 9, 3]], ["shuangjiang", "霜降", "yin", [5, 8, 2]],
  ["lidong", "立冬", "yin", [6, 9, 3]], ["xiaoxue", "小雪", "yin", [5, 8, 2]],
  ["daxue", "大雪", "yin", [4, 7, 1]], ["dongzhi", "冬至", "yang", [1, 7, 4]],
  ["xiaohan", "小寒", "yang", [2, 8, 5]], ["dahan", "大寒", "yang", [3, 9, 6]]
];
const oppositePalaces = [
  ["kan-1", "li-9"], ["li-9", "kan-1"], ["kun-2", "gen-8"], ["gen-8", "kun-2"],
  ["zhen-3", "dui-7"], ["dui-7", "zhen-3"], ["xun-4", "qian-6"], ["qian-6", "xun-4"]
];
const patterns = [
  ["gate-fuyin", "八门伏吟", { layer: "gate", condition: "destinationPalaceEqualsBasePalace" }],
  ["gate-fanyin", "八门反吟", { layer: "gate", condition: "destinationPalaceEqualsOppositeOfBasePalace" }],
  ["star-fuyin", "九星伏吟", { layer: "star", condition: "destinationPalaceEqualsBasePalace" }],
  ["star-fanyin", "九星反吟", { layer: "star", condition: "destinationPalaceEqualsOppositeOfBasePalace" }],
  ["gate-pressure", "门迫", { layer: "gate_palace", condition: "gatePhaseControlsPalacePhase" }]
];

for (const [code, name, number, trigram, direction, phase, row, column] of palaces) {
  entities.push(entity(`qimen-palace-${code}`, "qimen_palace", code, name, number,
    { number, trigram, direction, phase, grid: { row, column } }, SOURCES.volume2));
  if (trigram) relations.push(relation(`qimen-palace-trigram-${code}`, "palace_trigram",
    [`qimenPalace:${code}`], [`zhouyiTrigram:${romanizeTrigram(trigram)}`], null, { direction, phase }, SOURCES.volume2));
}
for (const [code, name, baseNumber, basePalace, phase, classicalGroup] of gates) {
  entities.push(entity(`qimen-gate-${code}`, "qimen_gate", code, name, baseNumber,
    { basePalace, phase, classicalGroup }, SOURCES.tongzong));
  relations.push(relation(`qimen-gate-base-${code}`, "gate_base_palace", [`qimenGate:${code}`], [`qimenPalace:${basePalace}`], null, {}, SOURCES.tongzong));
}
for (const [code, name, baseNumber, basePalace, phase] of stars) {
  entities.push(entity(`qimen-star-${code}`, "qimen_star", code, name, baseNumber,
    { basePalace, phase }, SOURCES.tongzong));
  relations.push(relation(`qimen-star-base-${code}`, "star_base_palace", [`qimenStar:${code}`], [`qimenPalace:${basePalace}`], null, {}, SOURCES.tongzong));
}
for (const [index, [code, name]] of deities.entries()) {
  entities.push(entity(`qimen-deity-${code}`, "qimen_deity", code, name, index + 1,
    { yangDunOrder: index + 1, yinDunOrder: 8 - index }, SOURCES.volume2));
}
for (const [index, [code, name, role, roleName]] of stems.entries()) {
  entities.push(entity(`qimen-stem-${code}`, "qimen_stem_role", code, name, index + 1,
    { role, roleName }, SOURCES.tongzong));
}
for (const [index, [code, name, instrument]] of leaders.entries()) {
  entities.push(entity(`qimen-leader-${code}`, "qimen_jia_leader", code, name, index + 1,
    { concealedBy: instrument }, SOURCES.tongzong));
  relations.push(relation(`qimen-conceal-${code}`, "jia_concealment", [`qimenJia:${code}`], [`qimenStem:${instrument}`], null, {}, SOURCES.tongzong));
}
for (const [index, [code, name]] of yuanSpecs.entries()) {
  entities.push(entity(`qimen-yuan-${code}`, "qimen_yuan", code, name, index + 1,
    { order: index + 1, durationDays: 5 }, SOURCES.zhigui));
}
for (const [index, [code, name, direction]] of [["yang", "阳遁", "forward"], ["yin", "阴遁", "reverse"]].entries()) {
  entities.push(entity(`qimen-dun-${code}`, "qimen_dun", code, name, index + 1,
    { instrumentOrder: direction, wonderOrder: direction === "forward" ? "reverse" : "forward" }, SOURCES.volume1));
}
for (const dun of ["yang", "yin"]) {
  for (let bureau = 1; bureau <= 9; bureau += 1) {
    entities.push(entity(`qimen-bureau-${dun}-${bureau}`, "qimen_bureau", `${dun}-${bureau}`,
      `${dun === "yang" ? "阳遁" : "阴遁"}${bureau}局`, bureau, { dun, bureau }, SOURCES.volume1));
  }
}
for (const [code, name, dun, bureaus] of solarTermBureaus) {
  for (const [yuanIndex, [yuanCode, yuanName]] of yuanSpecs.entries()) {
    const bureau = bureaus[yuanIndex];
    relations.push(relation(`qimen-term-bureau-${code}-${yuanCode}`, "solar_term_yuan_bureau",
      [`solarTerm:${code}`, `qimenYuan:${yuanCode}`], [`qimenBureau:${dun}-${bureau}`], `${dun}-${bureau}`,
      { solarTerm: code, solarTermName: name, yuan: yuanCode, yuanName, dun, bureau, mappingVersion: VERSION }, SOURCES.zhigui));
  }
}
for (const [from, to] of oppositePalaces) {
  relations.push(relation(`qimen-palace-opposite-${from}-${to}`, "palace_opposition",
    [`qimenPalace:${from}`], [`qimenPalace:${to}`], to, {}, SOURCES.baojian));
}
for (const [index, [code, name, detection]] of patterns.entries()) {
  entities.push(entity(`qimen-pattern-${code}`, "qimen_pattern", code, name, index + 1,
    { detection, requiresCompletePlate: true, standaloneVerdictForbidden: true }, SOURCES.baojian));
}

method("qimen-method-scope", 1, "method_scope", "固定排盘口径",
  { required: true, engineMayChooseSilently: false, proposedMethod: "hourly_rotating_qimen" },
  "同一时刻必须使用同一套时家奇门口径；拆补、置闰等方法不得混算，方法与版本必须随盘保存。", SOURCES.baojian);
method("qimen-time-input", 2, "time_input", "确定时间与时区",
  { requiredFields: ["localDateTime", "timezone"], defaultTimezone: "Asia/Shanghai", rejectUnknownTime: true },
  "时家奇门以具体时辰排盘；时间不确定时不能自动补猜，也不能输出伪精确盘。", SOURCES.volume1);
method("qimen-solar-term", 3, "solar_term", "确定节气",
  { useExactInstant: true, nearBoundaryRequiresReview: true },
  "节气交接影响阴阳遁和局数。交节附近须按北京时间的具体时刻复核。", SOURCES.volume1);
method("qimen-yin-yang-dun", 4, "yin_yang_dun", "区分阴遁与阳遁",
  { yangFrom: "winter_solstice", yinFrom: "summer_solstice", detailedBoundaryDependsOnMethod: true },
  "冬至、夏至是阴阳遁转换的基本界线；实际起局仍须服从已选定的方法版本。", SOURCES.volume1);
method("qimen-three-yuan", 5, "three_yuan", "确定上中下元",
  { values: ["upper", "middle", "lower"], requiresVerifiedAlgorithm: true },
  "上、中、下元与局数相连。第一版知识库只保存结构，不在算法未核验前自动推盘。", SOURCES.volume1);
method("qimen-bureau", 6, "bureau", "确定遁局",
  { values: [1, 2, 3, 4, 5, 6, 7, 8, 9], requires: ["methodVersion", "solarTerm", "yuan", "dun"] },
  "阴遁九局、阳遁九局共十八局；局数必须能回溯到节气、元和排盘方法。", SOURCES.volume1);
method("qimen-bureau-table", 7, "bureau_table", "查节气三元局数表",
  { relationType: "solar_term_yuan_bureau", expectedMappings: 72, requires: ["solarTerm", "yuan"] },
  "按二十四节气与上、中、下元查得阴阳遁局数；结果必须保留所用节气、元与映射版本。", SOURCES.zhigui);
method("qimen-earth-plate", 8, "earth_plate", "布地盘三奇六仪",
  { layers: ["three_wonders", "six_instruments"], centerHandlingMustBeVersioned: true },
  "依阴阳遁、局数布三奇六仪；中五宫寄宫方式存在口径差异，必须显式记录。", SOURCES.volume2);
method("qimen-chief-envoy", 9, "chief_and_envoy", "取值符值使",
  { chief: "star_of_xun_leader", envoy: "gate_of_xun_leader", rotateByHour: true },
  "以旬首确定值符和值使，再随时干、时支定位；不可只凭名称直接判断结果。", SOURCES.volume2);
method("qimen-heaven-plate", 10, "heaven_plate", "布九星天盘",
  { entities: "qimen_star", requires: ["chief", "hourStem"] },
  "九星为盘面天时层，须结合所落宫、旺衰及其他层共同阅读。", SOURCES.volume2);
method("qimen-human-plate", 11, "human_plate", "布八门人盘",
  { entities: "qimen_gate", requires: ["envoy", "hourBranch"] },
  "八门为用事层；门的传统分类不能脱离所落宫和事项直接变成现实吉凶。", SOURCES.volume2);
method("qimen-deity-plate", 12, "deity_plate", "布八神",
  { entities: "qimen_deity", orderDependsOnDun: true },
  "八神依值符起布并区分阴阳顺逆，只作为盘面象义层，不作神秘力量的事实声明。", SOURCES.volume2);
method("qimen-layer-reading", 13, "layer_reading", "分层合参",
  { order: ["palace", "gate", "star", "deity", "heavenStem", "earthStem"], includeFivePhaseRelations: true },
  "解释必须展示宫、门、星、神和干的组合依据；禁止只给一个好坏标签。", SOURCES.tongzong);
method("qimen-pattern-detection", 14, "pattern_detection", "识别可验证结构",
  { patterns: patterns.map(item => item[0]), requireMachineCondition: true, forbidNameOnlyVerdict: true },
  "伏吟、反吟、门迫等名称只能在盘面条件被程序核对后出现，并须说明触发条件，不能只凭名称下结论。", SOURCES.baojian);
method("qimen-evidence-output", 15, "evidence_output", "保存判读证据",
  { required: ["methodVersion", "timeInput", "solarTerm", "yuan", "dun", "bureau", "matchedRelations", "matchedPatterns"], reproducible: true },
  "每项解释都要能追溯到局数映射、落宫关系和已匹配结构，便于复核同一输入的一致性。", SOURCES.baojian);
method("qimen-safety-boundary", 16, "safety_boundary", "产品解释边界",
  { forbiddenDomains: ["medicalDiagnosis", "legalOutcome", "investmentReturn", "disaster", "death", "marriageOutcome"], noFearMarketing: true },
  "奇门内容只作传统文化的时空结构参考，不预测疾病、灾难、死亡、投资收益或关系结局。", SOURCES.baojian);

const gateMeanings = {
  rest: ["休门", "传统象义偏向休整、会合与从容安排。"], death: ["死门", "传统象义偏向终止、收束与静止状态。"],
  injury: ["伤门", "传统象义偏向竞争、损耗与外在冲击。"], delusion: ["杜门", "传统象义偏向闭藏、保密与阻隔。"],
  open: ["开门", "传统象义偏向开启、公开与通达。"], fear: ["惊门", "传统象义偏向声息、警觉与突发扰动。"],
  life: ["生门", "传统象义偏向生发、经营与资源增长。"], scenery: ["景门", "传统象义偏向呈现、文书与可见度。"]
};
const starMeanings = {
  peng: ["天蓬星", "传统象义偏向流动、冒险与水势。"], rui: ["天芮星", "传统象义偏向承载、问题与修整。"],
  chong: ["天冲星", "传统象义偏向启动、速度与冲击。"], fu: ["天辅星", "传统象义偏向辅佐、学习与条理。"],
  qin: ["天禽星", "传统象义偏向中正、统摄与承接。"], xin: ["天心星", "传统象义偏向判断、治理与精密。"],
  zhu: ["天柱星", "传统象义偏向言说、阻隔与支撑。"], ren: ["天任星", "传统象义偏向承担、稳定与持续。"],
  ying: ["天英星", "传统象义偏向光显、名声与表现。"]
};
const deityMeanings = {
  chief: ["值符", "作为八神之首，传统象义偏向主导、权柄与核心位置。"], snake: ["腾蛇", "传统象义偏向缠绕、反复与虚实难辨。"],
  "great-yin": ["太阴", "传统象义偏向隐密、细致与内在助力。"], harmony: ["六合", "传统象义偏向连接、协同与关系往来。"],
  "white-tiger": ["白虎", "传统象义偏向刚烈、压力与损伤信号。"], "black-tortoise": ["玄武", "传统象义偏向隐伏、流动与信息不明。"],
  "nine-earth": ["九地", "传统象义偏向下沉、稳守与落地。"], "nine-heaven": ["九天", "传统象义偏向上扬、扩展与远行。"]
};

for (const [code, [title, summary]] of Object.entries(gateMeanings)) addInterpretation("qimen_gate", code, title, summary,
  `${summary}解释时须同时查看所落宫、五行关系和具体事项，不能把门名直接翻译成结果。`, SOURCES.tongzong);
for (const [code, [title, summary]] of Object.entries(starMeanings)) addInterpretation("qimen_star", code, title, summary,
  `${summary}九星属于盘面天时层，单独出现不足以判断现实事件。`, SOURCES.tongzong);
for (const [code, [title, summary]] of Object.entries(deityMeanings)) addInterpretation("qimen_deity", code, title, summary,
  `${summary}八神只作传统象义标记，不应描述成可验证的超自然力量。`, SOURCES.volume2);
for (const [code, name, role, roleName] of stems) addInterpretation("qimen_stem_role", code, name,
  `${name}在奇门结构中属于${roleName}。`,
  "三奇六仪既参与地盘和天盘排布，也用于记录旬首所隐；必须结合上下盘位置和完整结构解释。", SOURCES.tongzong);
for (const [code, name, instrument] of leaders) addInterpretation("qimen_jia_leader", code, name,
  `${name}旬首在盘中隐于${stems.find(item => item[0] === instrument)?.[1]}仪。`,
  "旬首用于确定值符、值使和排盘起点，是计算依据，不直接代表现实结果。", SOURCES.tongzong);
for (const [code, name] of yuanSpecs) addInterpretation("qimen_yuan", code, name,
  `${name}是每一节气三元结构中的一个五日单位。`,
  "上、中、下元与节气共同确定局数；元的判定方法必须随排盘版本保存。", SOURCES.zhigui);
const patternExplanations = {
  "gate-fuyin": "八门回到各自本宫的结构标记，传统上取其重复、停驻之象。",
  "gate-fanyin": "八门落到本宫对冲宫位的结构标记，传统上取其往复、变化之象。",
  "star-fuyin": "九星回到各自本宫的结构标记，须由星盘落宫逐一核对。",
  "star-fanyin": "九星落到本宫对冲宫位的结构标记，须由宫位对冲关系核对。",
  "gate-pressure": "八门五行克制所落宫五行时称门迫，是门宫关系，不是单看门名。"
};
for (const [code, name, detection] of patterns) addInterpretation("qimen_pattern", code, name,
  patternExplanations[code],
  `程序仅在条件“${detection.condition}”成立时标记；它是合参证据之一，不得单独翻译成现实吉凶。`, SOURCES.baojian);
for (const [code, name, number, trigram, direction, phase] of palaces) addInterpretation("qimen_palace", code, name,
  `${name}位于${direction}方，五行属${phase}${trigram ? `，配${trigram}卦` : ""}。`,
  "九宫是定位盘面各层的空间骨架；宫位本身不等同于现实结果。", SOURCES.volume2);
addInterpretation("qimen_boundary", "method_version", "排盘口径", "每张盘必须展示方法与版本。",
  "拆补、置闰、转盘、飞盘等口径不可混用；算法未核验时只展示知识结构，不生成盘局。", SOURCES.baojian);
addInterpretation("qimen_boundary", "time_precision", "时间精度", "时家奇门需要明确日期、时辰与时区。",
  "时间不确定或位于交节附近时，应提示补充或复核，不得自动猜测。", SOURCES.volume1);
addInterpretation("qimen_boundary", "safe_use", "使用边界", "用于比较传统时空结构，不保证现实结果。",
  "不得用于医疗诊断、法律结论、投资收益、死亡灾难或婚姻结果预测，也不得以恐惧推动付费。", SOURCES.baojian);

validate();
const output = { version: VERSION, scope: "Qimen Dunjia foundational entities, solar-term bureau mappings, structural patterns, method boundaries and interpretations", sources: Object.values(SOURCES), entities, relations, methodRules, interpretations };
await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ entities: entities.length, relations: relations.length, methodRules: methodRules.length, interpretations: interpretations.length, output: OUTPUT }));

function entity(id, category, code, name, sequence, attributes, source) { return { id, version: VERSION, system: "qimen", category, code, name, sequence, attributes, sourceTitle: source.title, sourceUrl: source.url, isActive: true }; }
function relation(id, relationType, subjectCodes, objectCodes, resultCode, attributes, source) { return { id, version: VERSION, system: "qimen", relationType, subjectCodes, objectCodes, resultCode, attributes, sourceTitle: source.title, sourceUrl: source.url, isActive: true }; }
function method(id, step, code, title, rule, explanation, source) { methodRules.push({ id, version: VERSION, method: "qimen_hourly_rotating", step, code, title, rule, explanation, sourceTitle: source.title, sourceUrl: source.url, isActive: true }); }
function addInterpretation(category, code, title, summary, detail, source) { interpretations.push({ id: `qimen-interpretation-${category}-${code}`, version: VERSION, category, code, title, summary, detail, allowedUse: "仅用于解释可核验的奇门盘面结构、时间和方位关系。", forbiddenUse: "不得预测疾病、灾难、死亡、投资收益、诉讼结果或婚姻结局；不得作保证性判断或恐惧营销。", sourceTitle: source.title, sourceUrl: source.url, isActive: true }); }
function romanizeTrigram(name) { return ({ 坎: "kan", 坤: "kun", 震: "zhen", 巽: "xun", 乾: "qian", 兑: "dui", 艮: "gen", 离: "li" })[name]; }
function validate() {
  for (const collection of [entities, relations, methodRules, interpretations]) {
    if (new Set(collection.map(item => item.id)).size !== collection.length) throw new Error("duplicate qimen id");
    if (collection.some(item => !item.sourceUrl.startsWith("https://"))) throw new Error("invalid qimen source URL");
  }
  const text = JSON.stringify({ entities, relations, methodRules, interpretations });
  if (/心理学|星座|命中注定|保证发财|必然离婚|疾病预测/.test(text)) throw new Error("unsafe qimen content");
  if (relations.filter(item => item.relationType === "solar_term_yuan_bureau").length !== 72) throw new Error("incomplete solar-term bureau mappings");
  if (new Set(relations.filter(item => item.relationType === "solar_term_yuan_bureau").map(item => item.attributes.solarTerm)).size !== 24) throw new Error("incomplete solar terms");
}
