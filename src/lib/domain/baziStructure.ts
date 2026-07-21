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

function channelScore(channel: PowerChannel): number {
  const visibleScore = channel.visible.filter(item => item.tenGod !== "日主").length * 3;
  const hiddenScore = channel.hidden.reduce((sum, item) => sum + (
    item.qiLevel === "本气" ? 2 : item.qiLevel === "中气" ? 1.25 : 0.75
  ), 0);
  return visibleScore + hiddenScore + (channel.isMonthCommand ? 4 : 0);
}

function supportAction(resource: PowerChannel, self: PowerChannel): string {
  const hasResource = resource.visible.length + resource.hidden.length > 0;
  const peerCount = self.visible.filter(item => item.tenGod !== "日主").length + self.hidden.length;
  if (hasResource && peerCount) return "先像接过一张地图，弄清依据，再站稳自己的位置";
  if (hasResource) return "先把信息收进来，理解清楚后再动手";
  if (peerCount) return "先确认自己的位置，也会借同类回应来稳住起点";
  return "先从自己的判断出发，直接进入眼前事项";
}

function targetMeaning(target: PowerChannel): string {
  if (target.id === "output") return "把心里的判断送到桌面上，变成一句话、一套方法或看得见的成果";
  if (target.id === "reality") return "把资源、进度和成果一件件安放到现实里";
  if (target.id === "constraint") return "在标准、责任与边界之间找到可行的位置";
  if (target.id === "resource") return "先吸收经验、建立依据，再形成自己的理解";
  return "站稳自己的立场，并与身边同类形成呼应";
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
    resource: "像先把水收进容器：观察、吸收，确认有依据后再回应",
    self: "像先把脚站稳：先确认自己的位置，再看谁能同行",
    output: "像先打开一扇窗：把感受与判断说出来、做出来",
    reality: "像先整理桌面：先看资源、进度和结果怎样落地",
    constraint: "像先看清门框：先辨认标准、责任和边界，再决定怎样通过"
  };
  const visibility = visibilityInLife(monthChannel);
  const counterpartText = channelScore(counterpart) > 0
    ? `${counterpart.label}也有盘面线索，使这种气质不会只停在单一方向。`
    : "已知盘面暂未见另一类明显线索。";
  return `从月令带来的底色看，你更容易先这样回应：${entry[monthCategory]}。这股力量${visibility}。${counterpartText}`;
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
  return {
    prominent,
    absentVisible,
    foundInHidden,
    absentEntirely,
    summary: `${prominentText}；${absentText}。这里的“未见”只描述已知盘面，不等于缺陷，也不单独决定旺衰。`
  };
}

function evidenceCountPhrase(channel: PowerChannel): string {
  const visible = channel.visible.length ? `${channel.visible.length}处明干` : "未在天干明现";
  const hidden = channel.hidden.length ? `${channel.hidden.length}处藏干` : "地支未见藏干线索";
  return `${visible}、${hidden}`;
}

/**
 * 将十神拆成五类可理解的力量，并用月令、明干、藏干的组合生成一条短主线。
 * 这里不做单一十神对应人格，也不把出现次数直接等同于旺衰结论。
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
  const external = channels
    .filter(channel => !["self", "resource"].includes(channel.id))
    .sort((a, b) => channelScore(b) - channelScore(a));
  const primary = external[0];
  const secondary = external[1];
  const peerCount = self.visible.filter(item => item.tenGod !== "日主").length + self.hidden.length;
  const resourceCount = resource.visible.length + resource.hidden.length;
  const visibleLabels = channels.filter(channel => channel.visible.length).map(channel => channel.label);
  const hiddenOnlyLabels = channels.filter(channel => !channel.visible.length && channel.hidden.length).map(channel => channel.label);
  const secondaryClause = channelScore(secondary) > 0
    ? `${secondary.label}是另一落点，${evidenceState(secondary)}。`
    : "";
  const monthClause = primary.isMonthCommand
    ? `月令本气也归入${primary.label}，因此它位于这张盘的季节入口。`
    : `月令本气归入${POWER_CATEGORY[monthCategory].label}，它构成另一层季节背景。`;

  const temperamentCounterpart = primary.id === monthCategory ? secondary : primary;
  const temperament = temperamentMeaning(monthCategory, channelById[monthCategory], temperamentCounterpart);
  const workingStyle = `做事时，你更可能${supportAction(resource, self)}，然后把主要力气放到${targetMeaning(primary)}。专业结构中，这叫“${primary.label}”较突出：${visibilityInLife(primary)}；“${secondary.label}”则${visibilityInLife(secondary)}。`;

  return {
    corePosition: {
      title: "你在盘中的核心位置",
      summary: `把日主${structure.dayMaster.stem}${structure.dayMaster.element}想成${DAY_MASTER_IMAGE[structure.dayMaster.stem]}，它站在整张盘中央，代表你处理事情时的基本出发点。它生在${structure.monthCommand.branch}月，月令本气${monthMain.stem}带来“${POWER_CATEGORY[monthCategory].label}”的环境底色。盘中较常被调动的是${primary.label}${channelScore(secondary) > 0 ? `，旁边还有${secondary.label}` : ""}。`,
      evidence: [
        `日主：${structure.dayMaster.stem}，取自${structure.dayMaster.source}`,
        `月令：${structure.monthCommand.branch}，本气${monthMain.stem}·${monthMain.name}`,
        `同类线索 ${peerCount} 处；生扶线索 ${resourceCount} 处`
      ]
    },
    flow: {
      title: "这张盘的力量怎样流动",
      sequence: channels.map(channel => channel.label),
      summary: `把命局想成一条从“接住信息”到“把事落地”的路：先有承接来源，再站稳自身力量，随后经过表达输出、现实事务，最后碰到规则约束。本盘${visibleLabels.join("、")}像摆在桌面上的工具${hiddenOnlyLabels.length ? `；${hiddenOnlyLabels.join("、")}更像收在抽屉里，要到具体情境才会拿出来` : ""}。月令带入的${POWER_CATEGORY[monthCategory].label}，是这条路的季节底色。`,
      channels
    },
    meaning: {
      title: "这对你意味着什么",
      temperament,
      workingStyle,
      summary: `从组合看，你做事较可能${supportAction(resource, self)}，主要把力量放到${targetMeaning(primary)}。${monthClause}${secondaryClause}这是盘中力量的使用顺序，不是固定性格标签。`,
      basis: `由月令本气${monthMain.stem}${monthMain.name}、${primary.label}的${evidenceCountPhrase(primary)}${channelScore(secondary) > 0 ? `，以及${secondary.label}的组合` : ""}共同得出。`
    },
    elementOverview: buildElementOverview(structure, chart),
    incompleteNote: chart.hour
      ? undefined
      : "出生时间未知，以上只使用年柱、月柱、日柱；时柱及其藏干没有参与主线判断。"
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

function pillarConnection(name: PillarName, kind: BaziCharacterKind, tendency: string): { title: string; text: string } {
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
    text: `${context}。放到你的盘里，它提示你${tendency}。这是其中一面，仍要和月令、日主及全盘组合一起看。`
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

export function explainBaziCharacter(
  item: PillarStructure,
  dayMaster: Stem,
  kind: BaziCharacterKind
): BaziCharacterExplanation | null {
  if (kind === "stem") {
    if (!item.visibleStem) return null;
    const stem = item.visibleStem;
    const isDayMaster = stem.role === "日主";
    const connection = pillarConnection(item.name, "stem", STEM_USER_SIDE[stem.stem]);
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
  const connection = pillarConnection(item.name, "branch", BRANCH_USER_SIDE[item.branch.branch]);
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
