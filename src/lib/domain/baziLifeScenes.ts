import type { BaziChart } from "./bazi";
import {
  buildBaziMainline,
  buildBaziStructure,
  type PowerCategoryId,
  type PowerChannel
} from "./baziStructure";

export type BaziLifeSceneId = "social" | "solitude" | "work" | "own_time";

export interface BaziLifeScene {
  id: BaziLifeSceneId;
  label: string;
  shortLabel: string;
  lead: string;
  moments: Array<{
    id: "entry" | "active" | "pressure";
    label: string;
    title: string;
    body: string;
  }>;
  evidenceSummary: string;
  evidence: string[];
}

const SCENE_ORDER: BaziLifeSceneId[] = ["social", "solitude", "work", "own_time"];

const SCENE_META: Record<BaziLifeSceneId, {
  label: string;
  shortLabel: string;
  stages: Array<{ id: "entry" | "active" | "pressure"; label: string; title: string }>;
  weights: Record<PowerCategoryId, number>;
}> = {
  social: {
    label: "社交中的你",
    shortLabel: "社交",
    stages: [
      { id: "entry", label: "刚进入关系", title: "你先把什么放在前面" },
      { id: "active", label: "逐渐熟悉以后", title: "别人开始看见哪一面" },
      { id: "pressure", label: "出现分歧时", title: "原本藏着的力量怎样出来" }
    ],
    weights: { output: 2.4, self: 1, constraint: 1.2, reality: 1, resource: 0.7 }
  },
  solitude: {
    label: "独处时的你",
    shortLabel: "独处",
    stages: [
      { id: "entry", label: "刚停下来", title: "身体停下后，注意力去了哪里" },
      { id: "active", label: "真正安静以后", title: "你怎样把自己慢慢接回来" },
      { id: "pressure", label: "思绪积压时", title: "什么会让休息仍像在做事" }
    ],
    weights: { resource: 1.5, self: 1.25, reality: 1.05, output: 0.85, constraint: 0.8 }
  },
  work: {
    label: "工作与做事",
    shortLabel: "工作与做事",
    stages: [
      { id: "entry", label: "接到事情时", title: "你从哪里开始判断" },
      { id: "active", label: "真正推进时", title: "你的力气怎样落到事情上" },
      { id: "pressure", label: "条件变化时", title: "最容易增加消耗的地方" }
    ],
    weights: { reality: 1.5, constraint: 1.4, output: 1.15, resource: 0.4, self: 0.4 }
  },
  own_time: {
    label: "自己的日子",
    shortLabel: "自己的日子",
    stages: [
      { id: "entry", label: "没有任务时", title: "你怎样安放一段空白时间" },
      { id: "active", label: "有了兴趣以后", title: "什么会让日子真正有感觉" },
      { id: "pressure", label: "生活失去节奏时", title: "你会怎样重新找回落点" }
    ],
    weights: { self: 1.35, resource: 1.2, output: 1.1, reality: 1, constraint: 0.75 }
  }
};

const LIFE_TEXT: Record<BaziLifeSceneId, Record<PowerCategoryId, Record<"entry" | "active" | "pressure", string>>> = {
  social: {
    resource: {
      entry: "你更容易先听懂对方的语气和来路，不急着用第一反应定义这段关系",
      active: "信息足够以后，你会把零散细节连起来，回应往往比刚认识时更深入",
      pressure: "话没有想明白时，你可能先退回自己的思路里，整理清楚后才真正回应"
    },
    self: {
      entry: "你会先确认自己在关系里的位置，不急着跟随现场的节奏改变立场",
      active: "熟悉以后，你更愿意守住自己的步调，也会自然靠近能够平等往来的人",
      pressure: "反复让步会让你逐渐收紧边界，最后回到自己的判断上"
    },
    output: {
      entry: "有明确话题或真实内容时，你比只有寒暄的场面更容易进入状态",
      active: "熟悉以后，观点、方法和幽默感更容易走到前面，别人也更容易听见你的真实判断",
      pressure: "问题积累一段时间后，你可能不再绕开，而是把真正不顺的地方直接说清"
    },
    reality: {
      entry: "你会留意彼此是否守信、有来有往，而不只看第一次见面是否热络",
      active: "关系稳定后，你较常用实际投入表达在意，例如记住安排、兑现承诺或处理具体事情",
      pressure: "长期单向付出或反复失约，会比一次说错话更消耗你对关系的耐心"
    },
    constraint: {
      entry: "进入陌生环境时，你会先辨认相处规则、分寸和哪些边界不能越过",
      active: "边界清楚以后，你反而更能放松，因为不必一直猜测彼此允许什么",
      pressure: "规则反复或边界被连续试探时，你会从观察转向明确划线"
    }
  },
  solitude: {
    resource: {
      entry: "外界安静下来后，你需要把一天接收的信息慢慢收回来，而不是立刻切换成空白",
      active: "真正独处一会儿，你更容易重新理解发生过的事，也知道哪些声音不是自己的",
      pressure: "信息太多却没有消化空间时，思绪会在内部继续转动，休息也难马上变得安静"
    },
    self: {
      entry: "你会先从别人的节奏里撤回来，重新确认此刻真正想怎样安排自己",
      active: "不被打扰时，你较容易站稳自己的感觉，不需要不停从外界得到回应",
      pressure: "长期迁就外部安排后，独处时间可能被用来重新争回自己的节奏"
    },
    output: {
      entry: "人停下来以后，脑中仍可能继续组织说法、方法或还没有表达完整的部分",
      active: "写下来、做出一点东西或把想法理顺，比强迫自己什么都不想更容易卸下思绪",
      pressure: "没有出口的判断容易在脑中重复排练，让放松变成另一场内部表达"
    },
    reality: {
      entry: "即使没有工作，你的注意力也容易先落到尚未处理完的现实小事上",
      active: "把几件散乱的事情安顿好以后，你才更容易感到这段时间真正属于自己",
      pressure: "待办和责任同时堆着时，你可能把休息继续用来处理事情，身体停下而大脑仍在收尾"
    },
    constraint: {
      entry: "安静下来后，你可能会复盘自己有没有遗漏标准、越过边界或辜负某项责任",
      active: "确认重要事情没有失控以后，内在警觉才会逐渐放松",
      pressure: "要求不清或责任悬着时，你容易在独处中继续推演各种可能"
    }
  },
  work: {
    resource: {
      entry: "你更容易先把背景、依据和已有经验弄明白，再决定从哪里下手",
      active: "找到可信的方法以后，你会边吸收边形成自己的理解，不只照搬表面步骤",
      pressure: "信息互相矛盾时，你会花额外力气判断什么值得相信，启动速度也会被拖慢"
    },
    self: {
      entry: "你会先确认自己的判断和可承担范围，不愿在位置不清时贸然答应",
      active: "方向确定后，你更愿意按自己的节奏守住过程，也不轻易把核心判断交出去",
      pressure: "持续被打断或越过决定空间时，你会把更多力气用来守住自己的做法"
    },
    output: {
      entry: "你会很快注意现有方法哪里不顺，并开始想怎样说清或做出一个可见版本",
      active: "推进过程中，你倾向把想法变成方法、表达或成果，让别人看见事情如何继续",
      pressure: "已经看见问题却不能调整时，内部判断会持续运转，耐心容易消耗在重复解释上"
    },
    reality: {
      entry: "你会先看时间、资源、分工和最后需要交付什么，让事情从概念落到现实",
      active: "进入推进后，你较擅长把散乱事项排出次序，并一件件安放到可完成的位置",
      pressure: "只有方向却没有资源和责任归属时，你会比任务本身更容易感到无从落手"
    },
    constraint: {
      entry: "你会先辨认标准、期限和责任边界，避免做到一半才发现规则已经改变",
      active: "规则清楚时，你更容易集中力量，在框架里找到自己的推进方式",
      pressure: "标准反复、权责不清时，你会一边继续处理，一边不断判断现有做法是否合理"
    }
  },
  own_time: {
    resource: {
      entry: "一段空白时间到来时，你更容易先寻找能让自己沉进去的内容，而不是急着安排热闹",
      active: "有值得理解或慢慢体会的事物时，日子会显得更有内部空间",
      pressure: "长期只有输入却没有消化时间，会让原本喜欢的内容也变成新的负担"
    },
    self: {
      entry: "没有任务时，你需要先确认这段时间由自己支配，不必继续跟随别人的安排",
      active: "能够按自己的节奏决定快慢，比把每个小时填满更容易让你感到自在",
      pressure: "生活长期被外部节奏推着走时，你会更想守住一块不被打断的个人空间"
    },
    output: {
      entry: "完全没有方向的空白未必最放松，你更容易被一个想做、想说或想尝试的念头带动",
      active: "当兴趣能够变成一次体验、一件作品或一个看得见的变化时，你会更容易投入",
      pressure: "表达和尝试长期没有出口时，你可能一边觉得无聊，一边又不知道该从哪里重新开始"
    },
    reality: {
      entry: "你倾向先给日子留下一两个现实支点，再决定其余时间怎样自由展开",
      active: "做完一件具体小事、改善一个空间或兑现一次安排，会让一天更有落点",
      pressure: "琐事散落却没有收束时，你可能很难安心享受原本留给自己的时间"
    },
    constraint: {
      entry: "有一个简单边界会让你更容易放松，例如知道今天哪些事需要完成、哪些可以不做",
      active: "框架稳定但内部可以自由选择时，你更容易兼顾秩序和松弛",
      pressure: "安排过密会让生活像另一份任务，完全无序又会让注意力失去落点"
    }
  }
};

const SCENE_LEAD: Record<BaziLifeSceneId, Record<PowerCategoryId, string>> = {
  social: {
    resource: "你在人际里常先理解，再决定怎样靠近",
    self: "你不是随时跟着现场变化，而是先站稳自己的位置",
    output: "你的表达需要内容和位置，熟悉前后会呈现不同层次",
    reality: "你判断关系时，会看实际往来是否经得住时间",
    constraint: "你会先看边界，边界清楚以后反而更自然"
  },
  solitude: {
    resource: "独处对你更像消化，而不只是把外界声音关掉",
    self: "独处让你从外部节奏撤回，重新站回自己的位置",
    output: "身体停下来以后，表达和思考未必会立刻停下",
    reality: "你往往先把散落的事情安顿好，才真正进入休息",
    constraint: "悬而未决的标准和责任，容易跟着你回到独处里"
  },
  work: {
    resource: "你做事先找依据，理解清楚后才愿意真正投入",
    self: "你需要保留自己的判断位置，才容易持续推进",
    output: "你容易从方法和出口进入一件事，让想法尽快变得可见",
    reality: "你会把注意力拉回资源、进度和能否真正完成",
    constraint: "你先看清门框在哪里，再寻找自己的通过方式"
  },
  own_time: {
    resource: "属于自己的时间，需要有可以慢慢进入的内部内容",
    self: "日子真正属于你，首先意味着节奏由自己决定",
    output: "有一点想做和想尝试的东西，空闲才更容易变得鲜活",
    reality: "你喜欢自由里仍有一两个现实落点，不让日子散掉",
    constraint: "简单框架能帮助你松弛，过密安排则会夺走生活感"
  }
};

function rawScore(channel: PowerChannel) {
  const visible = channel.visible.filter(item => item.tenGod !== "日主").length * 3;
  const hidden = channel.hidden.reduce((sum, item) => sum + (
    item.qiLevel === "本气" ? 2 : item.qiLevel === "中气" ? 1.25 : 0.75
  ), 0);
  return visible + hidden + (channel.isMonthCommand ? 4 : 0);
}

function rankedChannels(scene: BaziLifeSceneId, channels: PowerChannel[]) {
  const weights = SCENE_META[scene].weights;
  const ranked = [...channels]
    .map(channel => ({ channel, score: rawScore(channel) * weights[channel.id] }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.channel.id.localeCompare(b.channel.id));
  const primary = ranked[0]?.channel ?? channels.find(channel => channel.id === "self")!;
  const secondary = ranked.find(item => item.channel.id !== primary.id)?.channel
    ?? channels.find(channel => channel.id !== primary.id)!;
  return { primary, secondary };
}

function channelEvidence(channel: PowerChannel) {
  const items = [
    ...channel.visible.map(item => `${item.source}${item.stem}·${item.tenGod}`),
    ...channel.hidden.map(item => `${item.source}${item.stem}·${item.tenGod}`)
  ];
  return `${channel.label}（${channel.traditional}）：${items.slice(0, 4).join("；") || "已知盘面未见直接线索"}`;
}

export function buildBaziLifeScenes(chart: BaziChart): BaziLifeScene[] {
  const structure = buildBaziStructure(chart);
  const mainline = buildBaziMainline(chart);
  const monthMain = structure.monthCommand.hiddenStems[0];

  return SCENE_ORDER.map(id => {
    const meta = SCENE_META[id];
    const { primary, secondary } = rankedChannels(id, mainline.flow.channels);
    const primaryText = LIFE_TEXT[id][primary.id];
    const secondaryText = LIFE_TEXT[id][secondary.id];
    return {
      id,
      label: meta.label,
      shortLabel: meta.shortLabel,
      lead: `以日主${chart.dayMaster}${structure.dayMaster.element}为参照，${SCENE_LEAD[id][primary.id]}。这里同时结合${secondary.label}，不是用单个字给你定性。`,
      moments: meta.stages.map(stage => ({
        ...stage,
        body: `${primaryText[stage.id]}。${secondaryText[stage.id]}。`
      })),
      evidenceSummary: `本场景主要由${primary.label}与${secondary.label}共同展开；月令${structure.monthCommand.branch}的本气${monthMain.stem}·${monthMain.name}提供整张盘的季节底色。`,
      evidence: [
        `日主：${chart.dayMaster}${structure.dayMaster.element}，取自日柱天干`,
        `月令：${structure.monthCommand.branch}月，本气${monthMain.stem}·${monthMain.name}`,
        channelEvidence(primary),
        channelEvidence(secondary),
        chart.hour ? `时柱：${chart.hour.pillarLabel}，已参与场景组合` : "出生时间未知：只使用年、月、日三柱，时柱没有补猜"
      ]
    };
  });
}
