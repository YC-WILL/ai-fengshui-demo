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

const POWER_CATEGORY: Record<PowerCategoryId, Pick<PowerChannel, "label" | "traditional">> = {
  self: { label: "自身力量", traditional: "比劫" },
  resource: { label: "承接来源", traditional: "印" },
  output: { label: "表达输出", traditional: "食伤" },
  reality: { label: "现实事务", traditional: "财" },
  constraint: { label: "规则约束", traditional: "官杀" }
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
  if (hasResource && peerCount) return "先承接依据，再确认自身立场";
  if (hasResource) return "先理解、吸收并找到承接依据";
  if (peerCount) return "先确认自身立场，或借同类呼应稳住起点";
  return "从自身参照点直接进入眼前事项";
}

function targetMeaning(target: PowerChannel): string {
  if (target.id === "output") return "把理解和判断转成表达、方法、作品或可见输出";
  if (target.id === "reality") return "处理资源、进度、交换、成果等具体事务";
  if (target.id === "constraint") return "回应标准、责任、边界以及需要遵循的规则";
  if (target.id === "resource") return "吸收信息、建立依据并取得承接";
  return "建立自身立场并调用同类力量";
}

function temperamentMeaning(monthCategory: PowerCategoryId, monthChannel: PowerChannel, counterpart: PowerChannel): string {
  const entry: Record<PowerCategoryId, string> = {
    resource: "先观察、吸收并确认依据",
    self: "先从自身立场和同类呼应出发",
    output: "先把感受与判断转成表达或方法",
    reality: "先看具体事务、资源与结果怎样落地",
    constraint: "先留意标准、责任与边界"
  };
  const visibility = monthChannel.visible.length
    ? "这部分在天干明现，较容易直接成为外在表现"
    : "这部分主要藏在地支，更可能在具体情境中才显出来";
  const counterpartText = channelScore(counterpart) > 0
    ? `${counterpart.label}也有盘面线索，使这种气质不会只停在单一方向。`
    : "已知盘面暂未见另一类明显线索。";
  return `传统结构呈现的气质更偏向${entry[monthCategory]}；${visibility}。${counterpartText}`;
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
  const supportSummary = peerCount && resourceCount
    ? `同类与生扶都有线索：自身同类${evidenceState(self, true)}，承接来源${evidenceState(resource)}`
    : peerCount
      ? `盘中可见自身同类，${evidenceState(self, true)}；承接来源未见直接线索`
      : resourceCount
        ? `盘中未见额外同类，承接来源${evidenceState(resource)}`
        : "盘中未见额外同类或承接来源的直接线索";
  const visibleLabels = channels.filter(channel => channel.visible.length).map(channel => channel.label);
  const hiddenOnlyLabels = channels.filter(channel => !channel.visible.length && channel.hidden.length).map(channel => channel.label);
  const primaryVisibility = evidenceState(primary);
  const secondaryClause = channelScore(secondary) > 0
    ? `${secondary.label}是另一落点，${evidenceState(secondary)}。`
    : "";
  const monthClause = primary.isMonthCommand
    ? `月令本气也归入${primary.label}，因此它位于这张盘的季节入口。`
    : `月令本气归入${POWER_CATEGORY[monthCategory].label}，它构成另一层季节背景。`;

  const temperamentCounterpart = primary.id === monthCategory ? secondary : primary;
  const temperament = temperamentMeaning(monthCategory, channelById[monthCategory], temperamentCounterpart);
  const workingStyle = `做事时更可能${supportAction(resource, self)}，再把力量投入到${targetMeaning(primary)}。${primary.label}${primaryVisibility}；${secondary.label}${evidenceState(secondary)}。`;

  return {
    corePosition: {
      title: "你在盘中的核心位置",
      summary: `日主为${structure.dayMaster.stem}${structure.dayMaster.element}（${structure.dayMaster.yinYang}${structure.dayMaster.element}），是全盘参照点，生于${structure.monthCommand.branch}月；月令本气${monthMain.stem}归入“${POWER_CATEGORY[monthCategory].label}”。${supportSummary}。主要落点是${primary.label}${channelScore(secondary) > 0 ? `，其次是${secondary.label}` : ""}。`,
      evidence: [
        `日主：${structure.dayMaster.stem}，取自${structure.dayMaster.source}`,
        `月令：${structure.monthCommand.branch}，本气${monthMain.stem}·${monthMain.name}`,
        `同类线索 ${peerCount} 处；生扶线索 ${resourceCount} 处`
      ]
    },
    flow: {
      title: "这张盘的力量怎样流动",
      sequence: channels.map(channel => channel.label),
      summary: `传统结构的顺序是“承接来源 → 自身力量 → 表达输出 → 现实事务 → 规则约束”。本盘${visibleLabels.join("、")}在天干有明现${hiddenOnlyLabels.length ? `；${hiddenOnlyLabels.join("、")}只在地支藏干出现` : ""}。${POWER_CATEGORY[monthCategory].label}由月令本气带入，是观察这条主线的起点之一。`,
      channels
    },
    meaning: {
      title: "这对你意味着什么",
      temperament,
      workingStyle,
      summary: `${temperament}${workingStyle}${monthClause}${secondaryClause}这是盘中力量的使用顺序，不是固定性格标签。`,
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
  identity: string;
  source: string;
  roleTitle: string;
  role: string;
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

export function explainBaziCharacter(
  item: PillarStructure,
  dayMaster: Stem,
  kind: BaziCharacterKind
): BaziCharacterExplanation | null {
  if (kind === "stem") {
    if (!item.visibleStem) return null;
    const stem = item.visibleStem;
    const isDayMaster = stem.role === "日主";
    return {
      character: stem.stem,
      identity: `${STEM_YIN_YANG[stem.stem]}${stem.element}天干`,
      source: stem.source,
      roleTitle: stem.role,
      role: isDayMaster
        ? "这是日主，是全盘的参照点。其他天干和藏干都要先与它比较，才能得到十神名称。"
        : `以日主${dayMaster}为参照，它与日主形成“${stem.relation}”关系，对应十神“${stem.role}”。`,
      plainMeaning: `${STEM_PLAIN_MEANING[stem.stem]}它落在${item.name}天干位置；这是一条盘面线索，不单独等同于完整性格。`,
      evidence: isDayMaster
        ? `取${item.name}天干${stem.stem}为日主`
        : `${stem.stem}属${stem.element}，再比较日主${dayMaster}的五行与阴阳`
    };
  }

  if (!item.branch) return null;
  const hiddenSummary = item.hiddenStems.map(hidden => `${hidden.qiLevel}${hidden.stem}`).join("、");
  const isMonthCommand = item.name === "月柱";
  return {
    character: item.branch.branch,
    identity: `${item.branch.yinYang}${item.branch.element}地支`,
    source: item.branch.source,
    roleTitle: isMonthCommand ? "月令" : "地支",
    role: isMonthCommand
      ? `它位于月柱地支，因此也是月令，标记出生时段的季节位置。内部藏有${hiddenSummary}。`
      : `它承载这一柱的地支结构，内部藏有${hiddenSummary}。地支本身不直接定十神，要看其中藏干与日主的关系。`,
    plainMeaning: `${BRANCH_PLAIN_MEANING[item.branch.branch]}它落在${item.name}地支位置，仍需与月令、日主和藏干一起理解。`,
    evidence: `${item.branch.branch}属${item.branch.element}；藏干按固定地支藏干表展开`
  };
}

export const HIDDEN_STEM_REFERENCE = HIDDEN_STEMS;
