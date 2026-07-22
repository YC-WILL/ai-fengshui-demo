import type { BaziLifeSceneId } from "../domain/baziLifeScenes";
import type { PillarName, TenGodName } from "../domain/baziStructure";
import type { Element, Stem } from "../domain/elements";

export const BAZI_SCENE_CATALOG_VERSION = "2026-07-22.bazi-scenes-v2";

export interface TenGodBehaviorAtom {
  entry: string;
  active: string;
  pressure: string;
  focus: Record<BaziLifeSceneId, string>;
}

export const TEN_GOD_BEHAVIOR_ATOMS: Record<TenGodName, TenGodBehaviorAtom> = {
  比肩: {
    entry: "先确认自己的判断和位置，不急着把决定交给现场",
    active: "方向清楚后会按自己的节奏持续推进，也重视彼此能否平等往来",
    pressure: "连续被打断或被替自己作决定时，会把更多力气用来守住边界",
    focus: {
      social: "是否能平等说话、各自保留位置",
      solitude: "把外部声音放下后重新听见自己的判断",
      work: "保留核心决定空间并守住做事节奏",
      own_time: "让时间真正由自己支配，而不是继续跟随安排"
    }
  },
  劫财: {
    entry: "先观察谁在参与、资源怎样分配，再决定自己投入多少",
    active: "有人并肩时反应会更快，也会在比较和协商中调整做法",
    pressure: "分工含糊或付出失衡时，容易把注意力转向谁承担得更多",
    focus: {
      social: "往来是否对等，彼此能否把空间和分寸谈清",
      solitude: "从比较和他人的节奏里撤回来",
      work: "协作、竞争与资源分配是否清楚",
      own_time: "不让别人的需求不断挤占自己的安排"
    }
  },
  食神: {
    entry: "先寻找一个顺手的切口，希望事情能自然展开而不是硬推",
    active: "会把经验慢慢做成稳定的方法、作品或让人容易接住的表达",
    pressure: "持续赶进度又没有完成感时，原本从容的输出会变得拖沓或失去兴趣",
    focus: {
      social: "用轻松、具体的内容让关系慢慢熟起来",
      solitude: "通过写、做、吃或一项熟悉活动把自己接回来",
      work: "把经验沉淀成可重复的方法和看得见的成品",
      own_time: "让兴趣有过程、有手感，也有一点完成感"
    }
  },
  伤官: {
    entry: "很快注意到现有说法或方法哪里不顺，并开始形成自己的判断",
    active: "会提出新的角度，把含糊处说清，或直接改出一个更可用的版本",
    pressure: "看见问题却长期不能调整时，耐心容易消耗在质疑和重复解释上",
    focus: {
      social: "对话是否真实、有内容，能不能容纳不同看法",
      solitude: "把没说完的判断整理成自己的语言",
      work: "发现流程问题并寻找更直接有效的做法",
      own_time: "给好奇心、表达和尝试留出不被评价的出口"
    }
  },
  偏财: {
    entry: "先看现场有哪些可调用的人、信息和机会，再决定从哪里切入",
    active: "条件变化时较会调动外部资源，让事情保持流动并继续向前",
    pressure: "机会和请求同时出现时，容易铺开太多方向，后续收束变得费力",
    focus: {
      social: "往来是否有活力，也能否自然连接不同的人和信息",
      solitude: "把外部机会暂时放下，分清哪些真的值得继续",
      work: "快速连接资源、应对变化并抓住现实窗口",
      own_time: "接触新鲜事物，但不让每个兴趣都变成新的承诺"
    }
  },
  正财: {
    entry: "先看时间、资源、步骤和最后需要交付什么，再安排投入",
    active: "会把散乱事项排出顺序，用持续处理让结果逐渐落稳",
    pressure: "责任和琐事一起堆积时，容易把休息也继续用于收尾",
    focus: {
      social: "对方是否守信，关系能否落实在稳定往来里",
      solitude: "先安顿未完成的小事，心里才容易真正停下来",
      work: "把进度、分工和成果放到可以管理的位置",
      own_time: "给日子留下一两个现实落点，不让时间散掉"
    }
  },
  七杀: {
    entry: "面对明确压力或时间限制时，会迅速寻找可以回应的着力点",
    active: "局面需要推进时较能集中力量，愿意承担难度并直接处理阻碍",
    pressure: "要求密集又缺少缓冲时，容易一直保持警觉，动作和语气也随之收紧",
    focus: {
      social: "遇到强势或边界试探时怎样迅速保护自己的位置",
      solitude: "外部压力结束后，身体和思绪是否仍维持警觉",
      work: "在期限、难题和突发要求中快速找到突破口",
      own_time: "从持续应对中退下来，不把空闲也过成待命"
    }
  },
  正官: {
    entry: "先确认规则、责任和彼此允许的范围，再决定怎样行动",
    active: "边界清楚后会稳定履行自己的部分，也希望过程有次序可循",
    pressure: "标准反复或权责不清时，容易反复检查自己是否遗漏要求",
    focus: {
      social: "分寸是否清楚，彼此是否尊重约定和边界",
      solitude: "确认重要责任没有失控后才逐渐放松",
      work: "在明确标准和职责中建立稳定推进方式",
      own_time: "用简单框架安放生活，但避免把休息也排得过满"
    }
  },
  偏印: {
    entry: "先从不明显的线索和侧面经验入手，不急着接受现成解释",
    active: "会把不同来源的信息重新组合，形成一套更符合自己理解的路径",
    pressure: "信息彼此冲突时，容易不断换角度推演，启动和表达随之延后",
    focus: {
      social: "先读懂语气和弦外之意，再决定是否真正靠近",
      solitude: "进入自己的联想和理解方式，把零散线索重新拼好",
      work: "从非标准信息中找到新路径，但需要明确何时停止扩展",
      own_time: "沉入小众内容或个人兴趣，获得不被打断的内部空间"
    }
  },
  正印: {
    entry: "先把背景、依据和已有经验弄明白，再决定如何回应",
    active: "理解逐渐完整后，会把接收到的信息整理成稳定、可依靠的认识",
    pressure: "资料太多却没有消化空间时，思绪会继续运转，很难立刻切换",
    focus: {
      social: "先听懂对方的来路和真实意思，再给出回应",
      solitude: "消化一天接收的信息，分清哪些声音属于自己",
      work: "先找到可信依据，再把经验转成自己的理解",
      own_time: "通过阅读、学习或安静体会补回内部空间"
    }
  }
};

export const DAY_MASTER_ACTION_STYLE: Record<Stem, string> = {
  甲: "一旦认定方向，更愿意先搭出骨架，再带着事情往前生长",
  乙: "较会观察条件，在连接与调整中寻找可以继续前进的空间",
  丙: "倾向把态度和重点摆到明处，让周围人知道事情正在怎样推进",
  丁: "会把注意力聚到真正重要的细处，用持续投入把一件事做深",
  戊: "遇到复杂局面时先稳住框架，让人和事都有可以承放的位置",
  己: "会先吸收杂乱信息，再把细节和关系一层层整理妥当",
  庚: "遇到阻滞时较想找到切入口，用明确行动把局面打开",
  辛: "容易察觉细微差别，愿意把标准、品质和边界磨得清楚",
  壬: "会连接更大范围的信息，在变化中寻找仍能继续流动的路径",
  癸: "更常先观察细处，以渐进方式确认变化，再给出自己的判断"
};

export const DAY_BRANCH_RECOVERY: Record<Element, string> = {
  木: "恢复节奏时，比起完全停住，更适合保留一个可以继续生长的小方向",
  火: "恢复节奏时，需要先让过快的回应慢下来，再把真正想表达的重点留下",
  土: "恢复节奏时，把身边一两件具体小事安顿好，会比继续盘算全部问题更有帮助",
  金: "恢复节奏时，可以先放松一条不影响结果的标准，给变化留一点进入的位置",
  水: "恢复节奏时，先收住继续扩展的信息，再确认眼下最倾向的一条路径"
};

export const PILLAR_SCENE_LENS: Record<BaziLifeSceneId, Record<PillarName, string>> = {
  social: {
    年柱: "这股力量在年柱出现，较容易先进入陌生环境和外部接触",
    月柱: "它落在月柱，进入集体、熟人圈或日常分工时更容易被看见",
    日柱: "它贴近日柱，关系真正靠近后才更明显地参与判断",
    时柱: "它位于时柱，往往在谈到未来、计划和长期往来时才逐渐出现"
  },
  solitude: {
    年柱: "它来自年柱，独处时可能先处理外部环境留下的声音",
    月柱: "它落在月柱，日常责任结束后仍可能跟着回到自己的时间里",
    日柱: "它贴近日柱，是回到私人生活后较容易启动的一层",
    时柱: "它位于时柱，安静下来后容易走向尚未展开的想法和长期方向"
  },
  work: {
    年柱: "它在年柱出现，面对外部评价和陌生任务时较容易先被调用",
    月柱: "它落在月柱，直接参与日常工作、集体分工与环境要求",
    日柱: "它贴近日柱，涉及核心判断和亲自负责的部分时更明显",
    时柱: "它位于时柱，规划后续、打磨成果和推进长期项目时更容易出现"
  },
  own_time: {
    年柱: "它来自年柱，空下来后可能先沿用早已熟悉的安排方式",
    月柱: "它落在月柱，日常事务的惯性容易继续影响自己的时间",
    日柱: "它贴近日柱，更直接关系到你怎样安放私人生活",
    时柱: "它位于时柱，兴趣、长期积累和未来想做的事更容易从这里展开"
  }
};

export const VISIBILITY_LENS = {
  visible: "它在天干明现，别人通常较早能看见这套反应",
  hidden: "它藏在地支，更像遇到具体情境后才打开的一层",
  monthMain: "它同时是月令本气，是日常环境较常启动的背景力量"
} as const;

export const BAZI_SCENE_METHOD_RULES = [
  {
    id: "bazi-scene-method-time-facts",
    step: 1,
    code: "time_facts",
    title: "出生时间事实层",
    rule: { inputs: ["localDate", "localTime", "timezone", "birthLocation"], output: ["yearPillar", "monthPillar", "dayPillar", "hourPillar"], forbid: ["regionalPersonality", "genderPersonality"] },
    explanation: "地点只参与法定时区与交节换算，性别不改变四柱，也不直接生成性格。"
  },
  {
    id: "bazi-scene-method-structure-fingerprint",
    step: 2,
    code: "structure_fingerprint",
    title: "完整结构指纹",
    rule: { dimensions: ["exactTenGod", "pillar", "visibility", "qiLevel", "monthCommand", "branchRelation", "timePrecision"] },
    explanation: "场景层保留具体十神、柱位、显藏、气层与组合关系，不先压缩成五类。"
  },
  {
    id: "bazi-scene-method-life-scenes",
    step: 3,
    code: "life_scenes",
    title: "四场景证据分流",
    rule: { scenes: ["social", "solitude", "work", "own_time"], stages: ["entry", "active", "pressure"], requireEvidence: true },
    explanation: "四个场景使用不同柱位权重，先生成行为链，再翻译成生活语言。"
  },
  ...Object.entries(TEN_GOD_BEHAVIOR_ATOMS).map(([tenGod, atom], index) => ({
    id: `bazi-scene-ten-god-${index + 1}`,
    step: 10 + index,
    code: `ten_god_${index + 1}`,
    title: `${tenGod}四场景行为素材`,
    rule: { tenGod, ...atom },
    explanation: "仅作为完整命盘组合中的一条行为线索，不单独定义人格。"
  }))
];

export const BAZI_SCENE_SOURCE_TITLE = "卦安依据传统十神与柱位结构原创整理";
export const BAZI_SCENE_SOURCE_URL = "https://zh.wikisource.org/wiki/三命通會_(四庫全書本)/卷01";
