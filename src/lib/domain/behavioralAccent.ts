// 出生月日只用于补充表达侧重，不单独展示来源，也不作为人格判断。
// 这层线索必须与八字结构、关系输入或现实事项共同使用。

export interface BehavioralAccent {
  traitKeywords: [string, string, string];
  profile: string;
  response: string;
  action: string;
  planning: string;
  watchFor: string;
}

export interface RelationshipBehaviorFacts {
  firstPerson: BehavioralAccent;
  secondPerson: BehavioralAccent;
  responsePattern: "similar" | "different";
  planningPattern: "similar" | "different";
}

const ACCENTS: BehavioralAccent[] = [
  { traitKeywords: ["行动直接", "启动迅速", "重视自主"], profile: "遇到新事情时更愿意先迈出一步，再边走边调整", response: "把重点直接说出来", action: "行动前先留半分钟确认真正想解决的问题", planning: "把最想推进的一步放在清单最前面，完成后再加下一项", watchFor: "起步很快时，别让后续收尾和他人的反应落在视线之外" },
  { traitKeywords: ["稳定务实", "持续投入", "重视确定"], profile: "更看重踏实和可持续，确认值得以后往往愿意稳稳投入", response: "先确认现实条件是否安稳", action: "变化较大时先保留一个熟悉环节，帮助自己平稳进入状态", planning: "提前确认预算、时间和备用方案，心里会更从容", watchFor: "为了维持熟悉和稳定，可能会把已经不合适的安排保留太久" },
  { traitKeywords: ["信息敏锐", "思路灵活", "需要交流"], profile: "对信息和变化较敏感，常能很快看见不止一种可能", response: "先交换信息、理清来龙去脉", action: "想法较多时先选一个最值得验证的方向", planning: "把信息集中在一张清单里，避免临近时来回寻找", watchFor: "选项不断增加时，容易一直比较而迟迟不愿关掉其他可能" },
  { traitKeywords: ["重视安全", "照顾感受", "依赖熟悉"], profile: "在意熟悉感与彼此感受，环境安心时更容易发挥自己", response: "先确认彼此的感受有没有被听见", action: "照顾别人之前也说出一项自己的具体需要", planning: "提前和重要的人对齐安排，减少临时变化带来的牵挂", watchFor: "照顾熟悉的人时，可能先接住别人的需要，再把自己的负担往后放" },
  { traitKeywords: ["表达鲜明", "重视认可", "带动他人"], profile: "愿意把事情做得有温度、有存在感，也重视真诚回应", response: "先表达立场，也期待得到清楚回应", action: "表达热情时也给对方留出回应和补充的空间", planning: "先确认自己最想留下的体验，再围绕它安排细节", watchFor: "投入没有得到及时回应时，容易把沉默理解成否定或冷淡" },
  { traitKeywords: ["关注细节", "讲求秩序", "重视完成"], profile: "容易留意细节和完成度，准备充分时会感到更笃定", response: "先把细节和顺序梳理清楚", action: "给准备设置停止点，避免为了更妥帖而反复修改", planning: "按先后顺序检查三项关键细节，不必一次照顾所有小事", watchFor: "标准越清楚，越可能把注意力留在不足之处，忽略已经完成的部分" },
  { traitKeywords: ["重视公平", "善于协调", "顾及立场"], profile: "习惯同时看见不同立场，希望事情在关系里保持平衡", response: "先听完双方说法，再寻找彼此都能接受的位置", action: "需要取舍时先写下自己的第一选择，再听他人意见", planning: "提前确认参与者的时间与边界，让安排对大家都更友好", watchFor: "为了让各方都舒服，可能把自己的第一选择说得太晚或太轻" },
  { traitKeywords: ["投入深入", "重视信任", "直指核心"], profile: "对重要的人和事投入较深，信任建立后通常很有韧性", response: "先确认真正介意的核心，再决定说多少", action: "心里反复琢磨时，可以用一句事实开启对话", planning: "把隐私、重要物品和关键约定提前单独确认", watchFor: "越在意的事情越可能先放在心里验证，外人不容易及时知道你的顾虑" },
  { traitKeywords: ["重视方向", "需要自由", "看见可能"], profile: "喜欢看见更远的方向，空间足够时更容易保持活力", response: "先谈方向和可能性，再补充具体步骤", action: "开始新计划时同时写下一项现实限制", planning: "给行程留一点自由时间，也准备一个可随时调整的方案", watchFor: "方向让人兴奋时，容易低估重复执行、时间成本和细节收尾" },
  { traitKeywords: ["责任感强", "目标明确", "稳住局面"], profile: "面对责任时更愿意先把事情稳住，再慢慢表达感受", response: "先谈目标、责任和怎样真正落地", action: "完成任务之外，也给休息和求助留出明确位置", planning: "把责任人、截止时间和确认节点写清楚，减少临时慌乱", watchFor: "习惯先扛住局面时，别人可能看不出你已经承担得太多" },
  { traitKeywords: ["独立视角", "愿意创新", "需要自主"], profile: "常愿意换个角度看问题，也需要保留一点自主空间", response: "先提出不同角度，再寻找可一起尝试的方法", action: "新点子出现时先小范围试一次，再决定是否扩大", planning: "保留一个备选做法，让变化来时仍有选择余地", watchFor: "太早跳到新角度时，可能让仍在处理原问题的人觉得没有被接住" },
  { traitKeywords: ["感受敏锐", "富有共情", "想象丰富"], profile: "容易感受到气氛里的细微变化，安静下来时判断更清楚", response: "先感受气氛，再慢慢把真实想法说出来", action: "感受复杂时先记录事实、感受和需要各一句", planning: "在重要安排前留一段安静时间，确认自己真正担心什么", watchFor: "气氛复杂时，容易先吸收周围人的情绪，反而晚一点才辨认自己的判断" }
];

// 生日区间只在规则层使用。报告永远只拿到行为侧重，不输出星座名称。
// 日期采用 MMDD，跨年区间（1222–0119）由 wrapsYear 标记。
export interface ZodiacBehaviorProfile {
  name: string;
  start: number;
  end: number;
  accent: BehavioralAccent;
  wrapsYear?: boolean;
}

/**
 * 12 个生日区间的行为侧重索引。
 * name 仅供规则、测试和内容运营定位使用，禁止传入报告 prompt。
 */
export const ZODIAC_BEHAVIOR_PROFILES: readonly ZodiacBehaviorProfile[] = [
  { name: "白羊座", start: 321, end: 419, accent: ACCENTS[0] },
  { name: "金牛座", start: 420, end: 520, accent: ACCENTS[1] },
  { name: "双子座", start: 521, end: 621, accent: ACCENTS[2] },
  { name: "巨蟹座", start: 622, end: 722, accent: ACCENTS[3] },
  { name: "狮子座", start: 723, end: 822, accent: ACCENTS[4] },
  { name: "处女座", start: 823, end: 922, accent: ACCENTS[5] },
  { name: "天秤座", start: 923, end: 1023, accent: ACCENTS[6] },
  { name: "天蝎座", start: 1024, end: 1122, accent: ACCENTS[7] },
  { name: "射手座", start: 1123, end: 1221, accent: ACCENTS[8] },
  { name: "摩羯座", start: 1222, end: 119, accent: ACCENTS[9], wrapsYear: true },
  { name: "水瓶座", start: 120, end: 218, accent: ACCENTS[10] },
  { name: "双鱼座", start: 219, end: 320, accent: ACCENTS[11] }
] as const;

export function behavioralAccent(birthDate: string): BehavioralAccent {
  const [, monthText, dayText] = birthDate.split("-");
  const monthDay = Number(monthText) * 100 + Number(dayText);
  if (!Number.isFinite(monthDay)) return ACCENTS[9];

  return ZODIAC_BEHAVIOR_PROFILES.find(range =>
    "wrapsYear" in range
      ? monthDay >= range.start || monthDay <= range.end
      : monthDay >= range.start && monthDay <= range.end
  )?.accent ?? ACCENTS[9];
}

export function relationshipAccent(firstBirthDate: string, secondBirthDate: string): {
  observation: string;
  suggestion: string;
  behaviorFacts: RelationshipBehaviorFacts;
} {
  const first = behavioralAccent(firstBirthDate);
  const second = behavioralAccent(secondBirthDate);
  const sameResponse = first.response === second.response;
  const samePlanning = first.planning === second.planning;
  return {
    observation: sameResponse
      ? `从日常回应方式看，你们都可能习惯${first.response}；熟悉感是优势，也别忘了确认对方是否真的接收到。`
      : `从日常回应方式看，一方可能更习惯${first.response}，另一方则更容易${second.response}；把这个先后差说清，误会会少一些。`,
    suggestion: sameResponse
      ? `讨论重要事情时，可以轮流先说结论、再补充感受，避免两个人沿着同一种习惯漏掉另一面。`
      : `聊重要事情前，可以先约定这次是“先听感受”还是“先定办法”，让两种回应节奏都有位置。`,
    behaviorFacts: {
      firstPerson: first,
      secondPerson: second,
      responsePattern: sameResponse ? "similar" : "different",
      planningPattern: samePlanning ? "similar" : "different"
    }
  };
}
