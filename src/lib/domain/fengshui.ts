// ============================================================
// 住宅风水规则（基础版）
//
// 设计原则：
//   · 传统风水原则 + 现实空间逻辑（采光 / 通风 / 动线 / 整洁度 /
//     噪音 / 隐私 / 心理舒适度）
//   · 不承诺"发财 / 转运"
//   · 输出可执行建议，分 0元 / 300元内 / 1000元内 三档
// ============================================================

import type { FengShuiInput } from "../types";

export interface FengShuiAssessment {
  focus: {
    key: string;
    label: string;
    summary: string;
  };
  orientationNote: string;
  layoutNote: string;
  perRoom: Array<{
    name: string;
    traditionalView: string;
    practicalView: string;
    suggestions: string[];
  }>;
  improvementsZeroBudget: string[];
  improvementsLowBudget: string[];   // ≤300
  improvementsMediumBudget: string[]; // ≤1000
  warnings: string[];
}

const CONCERN_FOCUS = [
  { pattern: /潮|湿|霉|返潮/, key: "dry", label: "干爽与呼吸", summary: "这个家眼下最值得先照顾的，是潮气和空气流动。先让墙角、布艺和卫生间干爽下来，人住在里面也会轻松一些。" },
  { pattern: /噪|吵|隔音|临街/, key: "quiet", label: "安静与休息", summary: "这个家眼下最值得先照顾的，是声音带来的打扰。把休息区护得安静一点，回到家才更容易慢慢松下来。" },
  { pattern: /暗|采光|光线|阴/, key: "light", label: "光线与精神", summary: "这个家眼下最值得先照顾的，是光线的层次。白天尽量把自然光请进来，夜里再用柔和的灯接住生活。" },
  { pattern: /乱|收纳|杂物|拥挤/, key: "order", label: "秩序与留白", summary: "这个家眼下最值得先照顾的，是物品与空间的关系。不是要把家收得像样板间，而是给常走、常坐的地方留一点余地。" },
  { pattern: /通风|闷|气味|油烟/, key: "air", label: "空气与清爽", summary: "这个家眼下最值得先照顾的，是空气能不能顺畅流动。先处理闷、味道和油烟，比添置装饰更能改变居住感受。" },
  { pattern: /隐私|正对|对冲|正冲/, key: "privacy", label: "遮挡与安心", summary: "这个家眼下最值得先照顾的，是视线与边界。用轻巧的遮挡留出一点缓冲，空间会更有被安顿好的感觉。" },
  { pattern: /动线|堵|狭窄|走动/, key: "flow", label: "走动与舒展", summary: "这个家眼下最值得先照顾的，是每天走动是否顺手。把经常经过的路线理清，家会像松开了一口气。" }
] as const;

const FOCUS_ACTIONS: Record<string, { zero: string; low: string; medium: string }> = {
  dry: { zero: "每天选两个时段对流通风，并擦干窗边、墙角和卫生间积水", low: "添置湿度计与可重复使用的除湿盒，先找出最潮的位置（约 80–200 元）", medium: "为潮湿空间配置小型除湿机或强化排风（约 500–1000 元）" },
  quiet: { zero: "把床、书桌等需要安静的位置尽量移离临街墙面，并关掉持续发声的闲置设备", low: "为门缝加密封条，给椅脚和桌脚加软垫（约 50–200 元）", medium: "为主要噪声窗增添厚帘或可拆卸隔音帘（约 400–1000 元）" },
  light: { zero: "白天拉开厚窗帘，移走挡光物，并把常用座位挪到自然光更舒服的位置", low: "增加一盏可移动的暖色台灯或落地灯（约 100–300 元）", medium: "将主要空间灯具换成可调亮度与色温的灯（约 400–800 元）" },
  order: { zero: "先清出玄关、餐桌或床边的一块空面，只保留每天真正会用到的东西", low: "用同尺寸收纳盒整理一个最容易堆积的区域（约 100–300 元）", medium: "为高频杂物增加一组带门收纳柜，减少视觉拥挤（约 500–1000 元）" },
  air: { zero: "做一次十分钟对流通风，并清理挡住风口、门口和窗边的物品", low: "清洁或更换排风扇、空调与油烟机滤网（约 80–300 元）", medium: "为厨房或卫生间改善排风设备，先处理气味来源（约 400–1000 元）" },
  privacy: { zero: "站在门口和常坐位置看一遍视线，把最让人不自在的直视路线先错开", low: "用纱帘、布帘或一盆中型植物做柔和遮挡（约 100–300 元）", medium: "添置轻薄屏风或半高玄关柜，保留采光同时建立边界（约 500–1000 元）" },
  flow: { zero: "沿着进门、起居和休息的常用路线走一遍，把绊脚和需要侧身绕过的物品移开", low: "用挂钩、窄架或理线器收起动线上的零碎物品（约 50–250 元）", medium: "用窄边家具替换堵住通道的深柜或大茶几（约 500–1000 元）" }
};

function chooseFocus(input: FengShuiInput) {
  const text = `${input.primaryConcerns ?? ""} ${input.layout ?? ""} ${input.rooms.map(room => room.note ?? "").join(" ")}`;
  return CONCERN_FOCUS.find(item => item.pattern.test(text)) ?? {
    key: input.orientation.includes("北") ? "light" : "flow",
    label: input.orientation.includes("北") ? "光线与精神" : "走动与舒展",
    summary: input.orientation.includes("北")
      ? "先不用急着添很多东西，这个家更适合从光线和空气开始照顾。让常待的地方亮一点，生活的节奏也会更舒展。"
      : "先不用急着给这个家下结论，从每天最常走、最常坐的地方看起。动线顺了、光线柔和了，住起来通常就会更自在。"
  };
}

const ORIENTATION_NOTE: Record<string, string> = {
  "朝南": "传统上朝南采光、通风良好，适合作主要起居空间；现实上需注意夏季西晒。",
  "朝北": "传统认为朝北采光稍弱，适合作休息/储物空间；现实上需要提升人工采光与通风。",
  "朝东": "朝东早间采光良好，适合作早起活动；下午光线偏弱，注意补光。",
  "朝西": "朝西下午西晒强烈，建议加遮光帘或植物阻挡，避免家具长期暴晒老化。",
  "朝东南": "朝东南通风良好，传统视角下气流顺畅，适合作主要起居动线。",
  "朝西南": "朝西南夏季偏热，建议加强遮阳与通风。",
  "朝东北": "朝东北采光与通风一般，建议补充室内灯光与气流方案。",
  "朝西北": "朝西北冬季偏冷，建议关注保温与气流方向。"
};

function describeOrientation(o: string): string {
  return ORIENTATION_NOTE[o] ?? "未识别明确朝向，请结合实际采光与通风综合判断。";
}

const ROOM_RULES: Record<string, { trad: string; practical: string; tips: string[] }> = {
  "客厅": {
    trad: "传统视角下客厅是接气、聚人之所，宜方正、明亮、动线开阔。",
    practical: "现实上注意：进门视线不被正对沙发遮挡；主沙发「背有依靠」（靠墙或屏风）；电视墙避免反光直射。",
    tips: ["沙发尽量靠墙摆放", "保证主灯 + 辅光的双层照明", "茶几避免尖锐边角朝向常坐位置"]
  },
  "卧室": {
    trad: "传统认为卧室宜静、宜暗、宜藏，以利休息与气场沉降。",
    practical: "现实上：床头避免正对门、避免大梁压顶（视觉与心理压迫）、电视/电脑等强电器尽量与床保持距离。",
    tips: ["床头实墙，避免正对门口", "卧室避免镜子直对床", "夜间使用暖色低亮夜灯"]
  },
  "厨房": {
    trad: "厨房属火，传统认为忌与水（卫生间）正对、忌正对入户门。",
    practical: "现实上：油烟通风首要（抽油烟机功率与排风口走向）；灶台与水槽保持适度距离；操作动线「取—洗—切—炒」宜顺序展开。",
    tips: ["保持台面整洁", "刀具收纳避免外露", "油烟机定期清洁"]
  },
  "卫生间": {
    trad: "传统认为卫生间属水、忌正对入户门或卧室门。",
    practical: "现实上：通风与干湿分离最重要；地漏排水通畅；门常关并保持空气流通。",
    tips: ["保持干湿分离", "增加排风扇运行时间", "门口可放置吸水地垫"]
  },
  "书房": {
    trad: "传统认为书房宜安静、稳定，靠墙而坐为佳。",
    practical: "现实上：办公位「背有依靠」，避免背对门；屏幕避免正对窗户造成反光；保证桌面整洁。",
    tips: ["办公椅背靠实墙", "保证桌面光照 ≥ 300lux", "周围少放干扰性物品"]
  },
  "玄关": {
    trad: "传统认为玄关是「气口」，宜稍作遮挡，避免一进门一览无余。",
    practical: "现实上：玄关是「卸去外界状态」的过渡，宜有挂衣 + 鞋柜 + 钥匙盘三件套。",
    tips: ["进门处保持整洁", "可设小型挂画或植物", "鞋柜留通风空间"]
  },
  "餐厅": {
    trad: "传统认为餐厅宜方正、安静，靠近厨房。",
    practical: "现实上：餐桌避免正对厕所门；照明柔和适合用餐；尽量减少强反光材质。",
    tips: ["餐桌避开厕所正对", "使用暖色照明", "餐边柜保持简洁"]
  }
};

export function assessFengShui(input: FengShuiInput): FengShuiAssessment {
  const focus = chooseFocus(input);
  const focusActions = FOCUS_ACTIONS[focus.key];
  const orientationNote = describeOrientation(input.orientation);
  const perRoom = input.rooms.map(r => {
    const rule = ROOM_RULES[r.name] ?? {
      trad: "传统视角下需结合具体方位与功能综合判断。",
      practical: "现实上请关注：采光、通风、动线、整洁度、噪音、隐私六个维度。",
      tips: ["保持整洁有序", "保证基本通风与采光", "避免动线交叉拥挤"]
    };
    return {
      name: r.name,
      traditionalView: rule.trad,
      practicalView: rule.practical + (r.note ? `（用户备注：${r.note}）` : ""),
      suggestions: rule.tips
    };
  });

  const warnings: string[] = [];
  if (/正对|对冲|正冲/.test(input.primaryConcerns ?? "")) {
    warnings.push("您提到「正对/对冲」问题：现实上多以视觉与心理影响为主，可用屏风、绿植、布艺改善，无需做大改动。");
  }
  if (/潮|湿|霉/.test(input.primaryConcerns ?? "")) {
    warnings.push("提到潮湿/霉味问题：建议优先排查通风与防水，再讨论「传统调整」，否则治标不治本。");
  }

  return {
    focus,
    orientationNote,
    layoutNote: input.layout
      ? `户型描述：${input.layout}。建议结合上述各空间逐一查验。`
      : "未填写户型描述，建议补充以便进一步分析。",
    perRoom,
    improvementsZeroBudget: [
      focusActions.zero,
      "整理玄关与客厅 30 分钟，丢弃明显冗余物品",
      "调整沙发/床朝向，保证「背有依靠」",
      ...perRoom.slice(0, 1).flatMap(room => room.suggestions.slice(0, 1))
    ],
    improvementsLowBudget: [
      focusActions.low,
      "为窗户加遮光/纱帘组合，缓解西晒（约 200 元）",
      "为玄关增设小型置物架与挂衣钩（约 150 元）",
      "卧室增加一只暖色小夜灯（约 80 元）"
    ],
    improvementsMediumBudget: [
      focusActions.medium,
      "更换主灯为可调色温吸顶灯，提升整体光环境（约 400–800 元）",
      "为客厅或书房添置一组实木屏风/玄关柜（约 600–1000 元）",
      "增添 1–2 盆易养护绿植（如绿萝、虎皮兰，合计约 200 元）"
    ],
    warnings
  };
}
