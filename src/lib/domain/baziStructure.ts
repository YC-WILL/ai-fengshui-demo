import type { BaziChart, Pillar } from "./bazi";
import {
  BRANCH_ELEMENT,
  BRANCH_YIN_YANG,
  KE,
  SHENG,
  STEM_ELEMENT,
  STEM_YIN_YANG,
  type Branch,
  type Element,
  type Stem
} from "./elements";

export const PILLAR_NAMES = ["年柱", "月柱", "日柱", "时柱"] as const;
export type PillarName = (typeof PILLAR_NAMES)[number];
export type QiLevel = "本气" | "中气" | "余气";
export type TenGodName = "比肩" | "劫财" | "食神" | "伤官" | "偏财" | "正财" | "七杀" | "正官" | "偏印" | "正印";
export type TenGodRelation = "同我" | "我生" | "我克" | "克我" | "生我";
export type BaziCharacterKind = "stem" | "branch";
export type PowerCategoryId = "self" | "resource" | "output" | "reality" | "constraint";

export interface PowerEvidence {
  stem: Stem;
  source: string;
  tenGod: TenGodName | "日主";
  visibility: "天干显露" | "地支藏干";
  qiLevel?: QiLevel;
}

export interface PowerChannel {
  id: PowerCategoryId;
  label: "自身力量" | "承接来源" | "表达输出" | "现实事务" | "规则约束";
  traditional: "比劫" | "印" | "食伤" | "财" | "官杀";
  scene: string;
  visible: PowerEvidence[];
  hidden: PowerEvidence[];
  isMonthCommand: boolean;
}

export interface BaziMainline {
  corePosition: {
    title: string;
    summary: string;
    evidence: string[];
  };
  flow: {
    title: string;
    sequence: string[];
    summary: string;
    channels: PowerChannel[];
  };
  meaning: {
    title: string;
    temperament: string;
    workingStyle: string;
    summary: string;
    basis: string;
  };
  elementOverview: {
    prominent: Element[];
    absentVisible: Element[];
    foundInHidden: Element[];
    absentEntirely: Element[];
    summary: string;
    interpretation: string;
  };
  monthReading: {
    image: string;
    interpretation: string;
  };
  tenGodReading: {
    headline: string;
    interpretation: string;
  };
  incompleteNote?: string;
}

interface HiddenStemDefinition {
  stem: Stem;
  qiLevel: QiLevel;
}

const HIDDEN_STEMS: Record<Branch, readonly HiddenStemDefinition[]> = {
  子: [{ stem: "癸", qiLevel: "本气" }],
  丑: [{ stem: "己", qiLevel: "本气" }, { stem: "癸", qiLevel: "中气" }, { stem: "辛", qiLevel: "余气" }],
  寅: [{ stem: "甲", qiLevel: "本气" }, { stem: "丙", qiLevel: "中气" }, { stem: "戊", qiLevel: "余气" }],
  卯: [{ stem: "乙", qiLevel: "本气" }],
  辰: [{ stem: "戊", qiLevel: "本气" }, { stem: "乙", qiLevel: "中气" }, { stem: "癸", qiLevel: "余气" }],
  巳: [{ stem: "丙", qiLevel: "本气" }, { stem: "戊", qiLevel: "中气" }, { stem: "庚", qiLevel: "余气" }],
  午: [{ stem: "丁", qiLevel: "本气" }, { stem: "己", qiLevel: "中气" }],
  未: [{ stem: "己", qiLevel: "本气" }, { stem: "丁", qiLevel: "中气" }, { stem: "乙", qiLevel: "余气" }],
  申: [{ stem: "庚", qiLevel: "本气" }, { stem: "壬", qiLevel: "中气" }, { stem: "戊", qiLevel: "余气" }],
  酉: [{ stem: "辛", qiLevel: "本气" }],
  戌: [{ stem: "戊", qiLevel: "本气" }, { stem: "辛", qiLevel: "中气" }, { stem: "丁", qiLevel: "余气" }],
  亥: [{ stem: "壬", qiLevel: "本气" }, { stem: "甲", qiLevel: "中气" }]
};

export interface TenGodFact {
  name: TenGodName;
  relation: TenGodRelation;
  polarity: "同阴阳" | "异阴阳";
}

export interface HiddenStemFact extends HiddenStemDefinition, TenGodFact {
  element: Element;
  source: string;
}

export interface PillarStructure {
  name: PillarName;
  pillar: Pillar | null;
  visibleStem: null | {
    stem: Stem;
    element: Element;
    role: TenGodName | "日主";
    relation: TenGodRelation | "参照点";
    source: string;
  };
  branch: null | {
    branch: Branch;
    element: Element;
    yinYang: "阳" | "阴";
    source: string;
  };
  hiddenStems: HiddenStemFact[];
}

export function tenGodFor(dayMaster: Stem, otherStem: Stem): TenGodFact {
  const dayElement = STEM_ELEMENT[dayMaster];
  const otherElement = STEM_ELEMENT[otherStem];
  const samePolarity = STEM_YIN_YANG[dayMaster] === STEM_YIN_YANG[otherStem];
  const polarity = samePolarity ? "同阴阳" : "异阴阳";

  if (otherElement === dayElement) {
    return { name: samePolarity ? "比肩" : "劫财", relation: "同我", polarity };
  }
  if (SHENG[dayElement] === otherElement) {
    return { name: samePolarity ? "食神" : "伤官", relation: "我生", polarity };
  }
  if (KE[dayElement] === otherElement) {
    return { name: samePolarity ? "偏财" : "正财", relation: "我克", polarity };
  }
  if (KE[otherElement] === dayElement) {
    return { name: samePolarity ? "七杀" : "正官", relation: "克我", polarity };
  }
  return { name: samePolarity ? "偏印" : "正印", relation: "生我", polarity };
}

export function hiddenStemsFor(branch: Branch, dayMaster: Stem, pillarName: PillarName): HiddenStemFact[] {
  return HIDDEN_STEMS[branch].map(item => ({
    ...item,
    ...tenGodFor(dayMaster, item.stem),
    element: STEM_ELEMENT[item.stem],
    source: `${pillarName}地支·${branch}${item.qiLevel}`
  }));
}

export function buildBaziStructure(chart: BaziChart) {
  const values = [chart.year, chart.month, chart.day, chart.hour] as const;
  const pillars: PillarStructure[] = values.map((pillar, index) => {
    const name = PILLAR_NAMES[index];
    if (!pillar) return { name, pillar: null, visibleStem: null, branch: null, hiddenStems: [] };
    const role = index === 2 ? "日主" : tenGodFor(chart.dayMaster, pillar.stem).name;
    const relation = index === 2 ? "参照点" : tenGodFor(chart.dayMaster, pillar.stem).relation;
    return {
      name,
      pillar,
      visibleStem: {
        stem: pillar.stem,
        element: pillar.stemElement,
        role,
        relation,
        source: `${name}天干`
      },
      branch: {
        branch: pillar.branch,
        element: BRANCH_ELEMENT[pillar.branch],
        yinYang: BRANCH_YIN_YANG[pillar.branch],
        source: `${name}地支`
      },
      hiddenStems: hiddenStemsFor(pillar.branch, chart.dayMaster, name)
    };
  });

  return {
    dayMaster: {
      stem: chart.dayMaster,
      element: STEM_ELEMENT[chart.dayMaster],
      yinYang: STEM_YIN_YANG[chart.dayMaster],
      source: "日柱天干"
    },
    monthCommand: {
      branch: chart.month.branch,
      element: chart.month.branchElement,
      source: "月柱地支",
      hiddenStems: hiddenStemsFor(chart.month.branch, chart.dayMaster, "月柱")
    },
    pillars
  };
}

const POWER_CATEGORY: Record<PowerCategoryId, Pick<PowerChannel, "label" | "traditional" | "scene">> = {
  self: { label: "自身力量", traditional: "比劫", scene: "像立足：确认自己与同类" },
  resource: { label: "承接来源", traditional: "印", scene: "像补给：接住经验与依据" },
  output: { label: "表达输出", traditional: "食伤", scene: "像出口：把所想变成表达" },
  reality: { label: "现实事务", traditional: "财", scene: "像落地：处理资源与成果" },
  constraint: { label: "规则约束", traditional: "官杀", scene: "像边框：面对标准与责任" }
};

const POWER_SEQUENCE: PowerCategoryId[] = ["resource", "self", "output", "reality", "constraint"];

function categoryForTenGod(name: TenGodName | "日主"): PowerCategoryId {
  if (name === "日主" || name === "比肩" || name === "劫财") return "self";
  if (name === "正印" || name === "偏印") return "resource";
  if (name === "食神" || name === "伤官") return "output";
  if (name === "正财" || name === "偏财") return "reality";
  return "constraint";
}

function evidenceState(channel: PowerChannel, excludeDayMaster = false): string {
  const visible = excludeDayMaster
    ? channel.visible.filter(item => item.tenGod !== "日主").length
    : channel.visible.length;
  if (visible && channel.hidden.length) return "明干、藏干都有线索";
  if (visible) return "在天干明现";
  if (channel.hidden.length) return "藏在地支";
  return "在已知三柱或四柱中未见直接线索";
}

function hasChannelEvidence(channel: PowerChannel): boolean {
  return channel.visible.some(item => item.tenGod !== "日主") || channel.hidden.length > 0;
}

const DAY_MASTER_IMAGE: Record<Stem, string> = {
  甲: "一株向上立起的乔木", 乙: "一枝会顺势寻找空间的藤木",
  丙: "把四周照亮的日光", 丁: "把一处照深的灯火",
  戊: "能承住重量的高地", 己: "能整理与滋养事物的田土",
  庚: "需要锻打成形的金属", 辛: "经过打磨、善于分辨的细金",
  壬: "向远处汇流的江河", 癸: "慢慢渗入细处的雨露"
};

function visibilityInLife(channel: PowerChannel): string {
  const visible = channel.visible.filter(item => item.tenGod !== "日主").length;
  if (visible && channel.hidden.length) return "既写在天干表面，也埋在地支内部，平时和关键情境里都容易被调动";
  if (visible) return "写在天干表面，别人通常较容易看见";
  if (channel.hidden.length) return "藏在地支内部，更像遇到具体情境才会打开的抽屉";
  return "在已知盘面中没有直接露出，需要结合后续时间层再观察";
}

function temperamentMeaning(monthCategory: PowerCategoryId, monthChannel: PowerChannel, counterpart: PowerChannel): string {
  const entry: Record<PowerCategoryId, string> = {
    resource: "像把水先收进容器：观察、吸收，确认有依据后再回应",
    self: "像先把脚站稳：确认自己的位置，再看谁能同行",
    output: "像打开一扇窗：把感受与判断说出来、做出来",
    reality: "像整理桌面：先看资源、进度和结果怎样落地",
    constraint: "像看清门框：先辨认标准、责任和边界，再决定怎样通过"
  };
  const visibility = visibilityInLife(monthChannel);
  const counterpartText = hasChannelEvidence(counterpart)
    ? `本次另取${counterpart.label}作为第二条观察线索，用来和现实经历交叉对照。`
    : "已知盘面暂未见另一类明显线索。";
  return `传统上可先从月令观察：${entry[monthCategory]}。这类线索${visibility}。${counterpartText}`;
}

function buildElementOverview(structure: ReturnType<typeof buildBaziStructure>, chart: BaziChart): BaziMainline["elementOverview"] {
  const elements = ["木", "火", "土", "金", "水"] as const;
  const counts = chart.elementDistribution.counts;
  const values = elements.map(element => counts[element]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const prominent = max - min >= 2 ? elements.filter(element => counts[element] === max) : [];
  const absentVisible = elements.filter(element => counts[element] === 0);
  const hiddenSet = new Set(structure.pillars.flatMap(pillar => pillar.hiddenStems.map(hidden => hidden.element)));
  const foundInHidden = absentVisible.filter(element => hiddenSet.has(element));
  const absentEntirely = absentVisible.filter(element => !hiddenSet.has(element));
  const prominentText = prominent.length
    ? `明字中${prominent.join("、")}相对偏多`
    : "明字五行分布接近，没有明显偏多的一类";
  const absentText = !absentVisible.length
    ? "五行在明字中都有出现"
    : [
        foundInHidden.length ? `${foundInHidden.join("、")}虽未在明字出现，但可在地支藏干中找到` : "",
        absentEntirely.length ? `${absentEntirely.join("、")}在已知明字与藏干中均未见` : ""
      ].filter(Boolean).join("；");
  const prominentScenes = prominent.map(element => ELEMENT_LIFE_SCENE[element]).join("；");
  const relationText = prominent.length
    ? prominent.map(element => `${element}相对日主属于“${POWER_CATEGORY[categoryForElement(structure.dayMaster.element, element)].label}”`).join("，")
    : "五行没有一类在明字中拉开明显差距";
  const absentMeaning = absentVisible.length
    ? `至于明字未见的${absentVisible.join("、")}，它们不一定消失，只是不习惯站在盘面最前面${foundInHidden.length ? `；其中${foundInHidden.join("、")}仍藏在地支，往往要到具体情境才被调用` : ""}。`
    : "五行都在明字中出现，表示可见工具较齐，但仍要看月令和组合决定使用顺序。";
  return {
    prominent,
    absentVisible,
    foundInHidden,
    absentEntirely,
    summary: `${prominentText}；${absentText}。这里的“未见”只描述已知盘面，不等于缺陷，也不单独决定旺衰。`,
    interpretation: prominent.length
      ? `明字中${prominent.join("、")}出现得更集中。放到日常里，这更像：${prominentScenes}。专业关系上，${relationText}，所以这里不只是在数数量，也是在看你的力气较常往哪里去。${absentMeaning}`
      : `你的明字不像只有一种工具反复出现，更像几种方式都能拿到手边。${relationText}，因此需要继续看月令和十神组合，不能只凭数量下结论。${absentMeaning}`
  };
}

const ELEMENT_LIFE_SCENE: Record<Element, string> = {
  木: "接到新任务后，你较容易先找延展方向，搭出下一步路径",
  火: "事情需要推进时，你较容易把态度、重点和进展摆到明处",
  土: "信息和事务堆在一起时，你较容易先归类、排顺序并安顿细节",
  金: "标准含糊或意见不一时，你较容易先做取舍、把边界说清",
  水: "条件发生变化时，你较容易先收集信息、连接资源并保留转圜空间"
};

function categoryForElement(dayElement: Element, otherElement: Element): PowerCategoryId {
  if (otherElement === dayElement) return "self";
  if (SHENG[otherElement] === dayElement) return "resource";
  if (SHENG[dayElement] === otherElement) return "output";
  if (KE[dayElement] === otherElement) return "reality";
  return "constraint";
}

const MONTH_SCENE: Record<Branch, string> = {
  寅: "初春刚破土的时节", 卯: "春木舒展的时节", 辰: "春夏交接、湿土承接的时节",
  巳: "初夏火气渐起的时节", 午: "盛夏光热最显的时节", 未: "夏末收束、燥土整理的时节",
  申: "初秋开始整序的时节", 酉: "秋金成形、分辨清楚的时节", 戌: "秋冬交接、守成收尾的时节",
  亥: "初冬开始收藏的时节", 子: "冬水最深、蓄势待发的时节", 丑: "冬末积累尚未完全舒展的时节"
};

const POWER_BEHAVIOR_SCENE: Record<PowerCategoryId, string> = {
  resource: "先把资料和依据找齐，或听懂有经验的人怎么做，再决定怎样下手",
  self: "先确认自己的判断，再决定与谁并肩、哪些部分可以让步",
  output: "先把方法说清、做出样品，或指出现有做法哪里不顺",
  reality: "先把注意力拉回时间、资源、分工和最后能交付什么",
  constraint: "先看清标准、期限和责任边界，避免做到一半才发现越线"
};

export function buildBaziMonthReadingFromFacts({
  dayStem,
  monthBranch,
  mainStem,
  mainTenGod
}: {
  dayStem: Stem;
  monthBranch: Branch;
  mainStem: Stem;
  mainTenGod: TenGodName;
}): BaziMainline["monthReading"] {
  const monthCategory = categoryForTenGod(mainTenGod);
  return {
    image: `想象${DAY_MASTER_IMAGE[dayStem]}来到${MONTH_SCENE[monthBranch]}。四周先给它的，是“${POWER_CATEGORY[monthCategory].label}”这层做事气候。`,
    interpretation: `月令本气${mainStem}相对日主${dayStem}形成${mainTenGod}，这是本轮采用的传统结构事实。蟾先森把这组结构暂时解释为：在某些情境中，你可能更倾向${POWER_BEHAVIOR_SCENE[monthCategory]}。这个说法属于项目的现代解释，需要由现实经历核对。`
  };
}

function evidenceCountPhrase(channel: PowerChannel): string {
  const visible = channel.visible.length ? `${channel.visible.length}处明干` : "未在天干明现";
  const hidden = channel.hidden.length ? `${channel.hidden.length}处藏干` : "地支未见藏干线索";
  return `${visible}、${hidden}`;
}

/**
 * 将十神拆成五类可核对的观察线索。五类的展示顺序只是教学顺序，
 * 不代表某个人的实际力量流动，也不以自定义分数判断强弱。
 */
export function buildBaziMainline(chart: BaziChart): BaziMainline {
  const structure = buildBaziStructure(chart);
  const monthMain = structure.monthCommand.hiddenStems[0];
  const monthCategory = categoryForTenGod(monthMain.name);
  const channels = POWER_SEQUENCE.map(id => ({
    id,
    ...POWER_CATEGORY[id],
    visible: [] as PowerEvidence[],
    hidden: [] as PowerEvidence[],
    isMonthCommand: id === monthCategory
  }));
  const channelById = Object.fromEntries(channels.map(channel => [channel.id, channel])) as Record<PowerCategoryId, PowerChannel>;

  structure.pillars.forEach(pillar => {
    if (pillar.visibleStem) {
      const id = categoryForTenGod(pillar.visibleStem.role);
      channelById[id].visible.push({
        stem: pillar.visibleStem.stem,
        source: pillar.visibleStem.source,
        tenGod: pillar.visibleStem.role,
        visibility: "天干显露"
      });
    }
    pillar.hiddenStems.forEach(hidden => {
      const id = categoryForTenGod(hidden.name);
      channelById[id].hidden.push({
        stem: hidden.stem,
        source: hidden.source,
        tenGod: hidden.name,
        visibility: "地支藏干",
        qiLevel: hidden.qiLevel
      });
    });
  });

  const self = channelById.self;
  const resource = channelById.resource;
  const primary = channelById[monthCategory];
  const secondary = channels.find(channel => channel.id !== primary.id && channel.visible.some(item => item.tenGod !== "日主"))
    ?? channels.find(channel => channel.id !== primary.id && channel.hidden.length)
    ?? channels.find(channel => channel.id !== primary.id)!;
  const peerCount = self.visible.filter(item => item.tenGod !== "日主").length + self.hidden.length;
  const resourceCount = resource.visible.length + resource.hidden.length;
  const visibleLabels = channels.filter(channel => channel.visible.length).map(channel => channel.label);
  const hiddenOnlyLabels = channels.filter(channel => !channel.visible.length && channel.hidden.length).map(channel => channel.label);
  const secondaryClause = hasChannelEvidence(secondary)
    ? `${secondary.label}是本次选取的另一条观察线索，${evidenceState(secondary)}。`
    : "";
  const monthClause = `月令本气归入${primary.label}，这里只把它作为出生季节的观察入口。`;

  const temperament = temperamentMeaning(monthCategory, primary, secondary);
  const workingStyle = `另一条可对照的线索是“${secondary.label}”：${visibilityInLife(secondary)}。可以观察自己在相关情境中是否会${POWER_BEHAVIOR_SCENE[secondary.id]}；若现实经历不符合，不应把它当作性格结论。`;
  const monthReading = buildBaziMonthReadingFromFacts({
    dayStem: structure.dayMaster.stem,
    monthBranch: structure.monthCommand.branch,
    mainStem: monthMain.stem,
    mainTenGod: monthMain.name
  });
  const tenGodHeadline = `本次先观察“${primary.label}”与“${secondary.label}”两组盘面线索`;
  const tenGodInterpretation = `第一条取自月令本气，第二条取自已知天干或藏干的位置。传统上分别归入${primary.traditional}与${secondary.traditional}。这里用于帮助核对结构，不表示两股力量有固定先后，也不据此给人格下结论。`;

  return {
    corePosition: {
      title: "先确认两个排盘事实",
      summary: `日主是${structure.dayMaster.stem}${structure.dayMaster.element}，传统意象可理解为${DAY_MASTER_IMAGE[structure.dayMaster.stem]}；出生在${structure.monthCommand.branch}月，月令本气为${monthMain.stem}${monthMain.name}。这两项是后续观察的起点，不直接等于性格或人生结论。`,
      evidence: [
        `日主：${structure.dayMaster.stem}，取自${structure.dayMaster.source}`,
        `月令：${structure.monthCommand.branch}，本气${monthMain.stem}·${monthMain.name}`,
        `同类线索 ${peerCount} 处；生扶线索 ${resourceCount} 处`
      ]
    },
    flow: {
      title: "五类十神线索怎样分布",
      sequence: channels.map(channel => channel.label),
      summary: `下面五类按十神生克的教学顺序并列展示；这个顺序对所有命盘都一样，不代表你的力量实际这样流动。本盘天干可见${visibleLabels.join("、") || "日主"}${hiddenOnlyLabels.length ? `；${hiddenOnlyLabels.join("、")}只见于藏干` : ""}。月令本气归入${POWER_CATEGORY[monthCategory].label}。`,
      channels
    },
    meaning: {
      title: "两条可以对照生活的观察",
      temperament,
      workingStyle,
      summary: `${monthClause}${secondaryClause}这只是传统解释转成的生活观察，不代表经专业校盘确认的格局、旺衰或用神结论。`,
      basis: `第一条来自月令本气${monthMain.stem}${monthMain.name}；第二条来自${secondary.label}的${evidenceCountPhrase(secondary)}。未使用自定义分数判断强弱。`
    },
    elementOverview: buildElementOverview(structure, chart),
    monthReading,
    tenGodReading: {
      headline: tenGodHeadline,
      interpretation: tenGodInterpretation
    },
    incompleteNote: chart.hour
      ? undefined
      : "出生时间未知，以上只使用年柱、月柱、日柱；时柱及其藏干没有参与结构观察。"
  };
}

export interface BaziCharacterExplanation {
  character: Stem | Branch;
  element: Element;
  identity: string;
  source: string;
  roleTitle: string;
  role: string;
  connectionTitle: string;
  connection: string;
  plainMeaning: string;
  evidence: string;
}

const STEM_PLAIN_MEANING: Record<Stem, string> = {
  甲: "像向上成形的树干，白话里侧重开端、建立与向外生长。",
  乙: "像藤蔓与花草，白话里侧重顺势调整、连接与寻找路径。",
  丙: "像日光铺开，白话里侧重照见、表达与把事情推到明处。",
  丁: "像灯火聚焦，白话里侧重专注、持续与细处照料。",
  戊: "像高地与厚土，白话里侧重承载、稳定与建立框架。",
  己: "像可耕作的土，白话里侧重吸收、整理与把细节安顿下来。",
  庚: "像需要锻打的金属，白话里侧重切入、执行与破开阻滞。",
  辛: "像经过打磨的金属，白话里侧重分辨、精细与明确边界。",
  壬: "像江河大水，白话里侧重流动、连接与打开更大范围。",
  癸: "像雨露细水，白话里侧重渗透、观察与润物无声。"
};

const BRANCH_PLAIN_MEANING: Record<Branch, string> = {
  子: "子是水气集中的地支，也含夜半与起始之意，白话里偏向蓄势与流动的入口。",
  丑: "丑是寒湿之土，处在收藏将尽、尚待舒展的位置，白话里偏向积累与等待成形。",
  寅: "寅是初春木气发动的位置，白话里偏向启动、破土与打开局面。",
  卯: "卯是仲春木气舒展的位置，白话里偏向展开、生长与建立连接。",
  辰: "辰是春夏交接的湿土，白话里偏向承接、转换与容纳多种线索。",
  巳: "巳是初夏火气渐盛的位置，白话里偏向酝酿成熟与加快显现。",
  午: "午是火气旺盛的位置，白话里偏向显露、推动与把力量送到前台。",
  未: "未是夏秋交接的燥土，白话里偏向收束、整合与整理已有成果。",
  申: "申是初秋金气发动的位置，白话里偏向整理、切换与重新建立秩序。",
  酉: "酉是仲秋金气成形的位置，白话里偏向分辨、收敛与把边界说清。",
  戌: "戌是秋冬交接的燥土，白话里偏向收尾、守住成果与确定界线。",
  亥: "亥是初冬水气展开的位置，白话里偏向收藏、孕育与为下一轮蓄力。"
};

const STEM_USER_SIDE: Record<Stem, string> = {
  甲: "较愿意先立方向、搭骨架，再带着事情向上生长",
  乙: "较会观察条件，在连接与调整中找到可以继续前进的缝隙",
  丙: "较愿意把信息摊开，让目标、态度和进展被看见",
  丁: "较容易把注意力聚在一处，用持续和细致把事情照深",
  戊: "较重视稳住局面、建立框架，让事情有地方可以承放",
  己: "较擅长吸收杂乱信息，再把人和事一层层整理妥当",
  庚: "遇到阻滞时较想找到切入口，用执行把局面打开",
  辛: "较容易察觉细微差别，愿意把标准、品质和边界磨清楚",
  壬: "较习惯连接更大范围，在流动的信息和关系中寻找通路",
  癸: "较会先观察细节，以渐进、柔和的方式影响事情走向"
};

const BRANCH_USER_SIDE: Record<Branch, string> = {
  子: "面对新变化时，常先蓄住信息，再寻找一个流动的入口",
  丑: "面对尚未成熟的事，较能先积累、容纳，等条件慢慢成形",
  寅: "局面需要启动时，较容易产生先迈一步、把空间打开的动力",
  卯: "进入人与事的连接时，较重视展开、协调和持续生长",
  辰: "处在转换阶段时，较能同时容纳几条线索，再寻找承接点",
  巳: "事情接近成熟时，较容易集中热度，让进展加快显现",
  午: "需要推动局面时，较愿意把力量放到前台，让态度变得清楚",
  未: "事情已有积累后，较愿意收束线索、整合成果并安顿细节",
  申: "环境开始变化时，较容易重新整理顺序，找到新的切换方式",
  酉: "需要取舍时，较重视分辨、收敛，并把界线说得更明确",
  戌: "进入收尾阶段时，较愿意守住已有成果，把边界和责任定下来",
  亥: "外部暂时安静时，较容易转向内在积累，为下一轮行动蓄力"
};

function pillarConnection(name: PillarName, kind: BaziCharacterKind, tendency: string, combinationDetail: string): { title: string; text: string } {
  const lens: Record<PillarName, Record<BaziCharacterKind, [string, string]>> = {
    年柱: {
      stem: ["别人较先看见的一面", "年柱天干偏向外部呈现与早年环境留下的表达方式"],
      branch: ["早年环境留下的底色", "年柱地支偏向早期生活环境与面对外部世界时的背景节奏"]
    },
    月柱: {
      stem: ["你进入集体时的一面", "月柱天干偏向处理日常任务、进入集体与回应环境要求的方式"],
      branch: ["你做事时所处的季节", "月柱地支同时是月令，偏向整张盘的季节气候与做事底色"]
    },
    日柱: {
      stem: ["你作决定时的起点", "日柱天干是日主，偏向你调动整张盘时最基本的自我参照"],
      branch: ["你回到日常生活时的一面", "日柱地支偏向贴近日常、亲近互动与内在落脚处的节奏"]
    },
    时柱: {
      stem: ["你规划下一步时的一面", "时柱天干偏向后续展开、长远想法与想要表达出去的方向"],
      branch: ["你为未来积累的方式", "时柱地支偏向内在愿景、后续成果与尚在酝酿中的节奏"]
    }
  };
  const [title, context] = lens[name][kind];
  return {
    title,
    text: `${context}。${combinationDetail}落到生活里，它更像你${tendency}。这是其中一面，仍要和月令、日主及全盘组合一起看。`
  };
}

export const TEN_GOD_PLAIN_MEANING: Record<TenGodName | "日主", string> = {
  日主: "整张盘的中心坐标，像你站在盘中看事情的起点。",
  比肩: "像并肩同行的力量，侧重自己的立场、同类与协作。",
  劫财: "像同桌分配资源，侧重同伴互动、协商与竞争中的取舍。",
  食神: "像把经验做成一道成品，侧重从容表达、方法与持续输出。",
  伤官: "像发现旧方法不顺手后另开一扇窗，侧重辨别、表达与突破。",
  偏财: "像接住流动中的机会，侧重外部往来、机动资源与快速调配。",
  正财: "像把账本和日程排稳，侧重可管理的资源、进度与日常成果。",
  七杀: "像迎面而来的硬任务，侧重压力、时限与需要迅速回应的要求。",
  正官: "像一把清楚的尺，侧重规则、职责、次序与可遵循的边界。",
  偏印: "像从侧门取得线索，侧重非典型经验、独立吸收与重新组合。",
  正印: "像背后稳稳的支撑，侧重学习、依据、照料与承接经验。"
};

const HIDDEN_PILLAR_SCENE: Record<PillarName, string> = {
  年柱: "到了陌生环境、面对长辈或沿用早年熟悉的做法时",
  月柱: "进入集体分工、日常任务开始加压时",
  日柱: "自己真正作决定，或回到亲近关系和日常生活时",
  时柱: "规划下一步、经营长期项目或想象未来成果时"
};

export function hiddenLayerReading(item: PillarStructure): string {
  if (!item.branch || !item.hiddenStems.length) return "出生时辰未知，这一柱没有补猜内部力量。";
  const [main, ...others] = item.hiddenStems;
  const otherText = others.length
    ? `里面还收着${others.map(hidden => `${hidden.stem}${hidden.name}`).join("、")}，所以并不是只有一种反应。`
    : "这一支内部只有这一条藏干线索。";
  return `${item.name}${item.branch.branch}支像一个没有完全打开的抽屉，本气是${main.stem}${main.name}。${HIDDEN_PILLAR_SCENE[item.name]}，你较可能调出它所代表的这一面：${TEN_GOD_PLAIN_MEANING[main.name]}${otherText}`;
}

function stemCombinationDetail(
  structure: ReturnType<typeof buildBaziStructure>,
  item: PillarStructure,
  role: TenGodName | "日主"
): string {
  const category = categoryForTenGod(role);
  const visibleCount = structure.pillars.filter(pillar => pillar.visibleStem && categoryForTenGod(pillar.visibleStem.role) === category).length;
  const hiddenCount = structure.pillars.flatMap(pillar => pillar.hiddenStems).filter(hidden => categoryForTenGod(hidden.name) === category).length;
  const monthMain = structure.monthCommand.hiddenStems[0];
  const monthCategory = categoryForTenGod(monthMain.name);
  const monthMatches = monthCategory === category;
  return `你的${structure.monthCommand.branch}月令先把“${POWER_CATEGORY[monthCategory].label}”放进环境底色，而这个字在${item.name}以“${role}”明现，把力量带向“${POWER_CATEGORY[category].label}”。同类力量在天干共有${visibleCount}处，地支里还有${hiddenCount}处${monthMatches ? "，月令也在呼应它" : ""}。`;
}

function branchCombinationDetail(item: PillarStructure): string {
  const [main, ...others] = item.hiddenStems;
  if (!main) return "";
  return `它内部以${main.stem}${main.name}为本气${others.length ? `，同时还藏着${others.map(hidden => `${hidden.stem}${hidden.name}`).join("、")}` : ""}，所以这个字在你的盘里不是单独的一种性格。`;
}

export function explainBaziCharacter(
  item: PillarStructure,
  dayMaster: Stem,
  kind: BaziCharacterKind,
  structure: ReturnType<typeof buildBaziStructure>
): BaziCharacterExplanation | null {
  if (kind === "stem") {
    if (!item.visibleStem) return null;
    const stem = item.visibleStem;
    const isDayMaster = stem.role === "日主";
    const connection = pillarConnection(item.name, "stem", STEM_USER_SIDE[stem.stem], stemCombinationDetail(structure, item, stem.role));
    return {
      character: stem.stem,
      element: stem.element,
      identity: `${STEM_YIN_YANG[stem.stem]}${stem.element}天干`,
      source: stem.source,
      roleTitle: stem.role,
      role: isDayMaster
        ? "这是日主，是全盘的参照点。其他天干和藏干都要先与它比较，才能得到十神名称。"
        : `以日主${dayMaster}为参照，它与日主形成“${stem.relation}”关系，对应十神“${stem.role}”。`,
      connectionTitle: connection.title,
      connection: connection.text,
      plainMeaning: STEM_PLAIN_MEANING[stem.stem],
      evidence: isDayMaster
        ? `取${item.name}天干${stem.stem}为日主`
        : `${stem.stem}属${stem.element}，再比较日主${dayMaster}的五行与阴阳`
    };
  }

  if (!item.branch) return null;
  const hiddenSummary = item.hiddenStems.map(hidden => `${hidden.qiLevel}${hidden.stem}`).join("、");
  const isMonthCommand = item.name === "月柱";
  const connection = pillarConnection(item.name, "branch", BRANCH_USER_SIDE[item.branch.branch], branchCombinationDetail(item));
  return {
    character: item.branch.branch,
    element: item.branch.element,
    identity: `${item.branch.yinYang}${item.branch.element}地支`,
    source: item.branch.source,
    roleTitle: isMonthCommand ? "月令" : "地支",
    role: isMonthCommand
      ? `它位于月柱地支，因此也是月令，标记出生时段的季节位置。内部藏有${hiddenSummary}。`
      : `它承载这一柱的地支结构，内部藏有${hiddenSummary}。地支本身不直接定十神，要看其中藏干与日主的关系。`,
    connectionTitle: connection.title,
    connection: connection.text,
    plainMeaning: BRANCH_PLAIN_MEANING[item.branch.branch],
    evidence: `${item.branch.branch}属${item.branch.element}；藏干按固定地支藏干表展开`
  };
}

export const HIDDEN_STEM_REFERENCE = HIDDEN_STEMS;
