import { computeBazi } from "./bazi";
import { KE, SHENG, STEM_ELEMENT, type Branch, type Element } from "./elements";
import type { DateSelectionEvent } from "../types";

export type TimingRangeDays = 7 | 30;

export interface TimingSelectionInput {
  event: DateSelectionEvent;
  startDate: string;
  rangeDays: TimingRangeDays;
  birthDate: string;
  birthTime?: string | null;
  birthLocation?: string | null;
  timezone?: string;
  unknownTime?: boolean;
}

export interface TimingCandidateEvidence {
  id: "calendar-day" | "birth-reference" | "year-branch-check" | "event-rule";
  source: string;
  fact: string;
  explanation: string;
}

export interface TimingPreparationAction {
  sourceEvent: DateSelectionEvent;
  sourceDate: string;
  durationMinutes: 20;
  text: string;
  doneWhen: string;
}

export interface TimingCandidate {
  date: string;
  weekday: string;
  distanceLabel: string;
  ganzhiDay: string;
  whyCandidate: string;
  arrangementFit: string;
  confirmBefore: string;
  limitation: string;
  evidence: TimingCandidateEvidence[];
  action: TimingPreparationAction;
}

export interface TimingSelectionResult {
  status: "ready" | "insufficient";
  event: DateSelectionEvent;
  eventLabel: string;
  startDate: string;
  endDate: string;
  rangeDays: TimingRangeDays;
  profileScope: string;
  insufficientReason?: string;
  candidates: TimingCandidate[];
  boundary: string;
}

interface EventRuleResult {
  matches: boolean;
  fact: string;
  arrangementFit: string;
  confirmBefore: string;
}

const EVENT_LABEL: Record<DateSelectionEvent, string> = {
  wedding: "婚礼",
  moving: "搬家",
  opening: "开业",
  signing: "签约",
  travel: "出行",
  renovation_start: "动工"
};

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] as const;

const PREPARATION_ACTIONS: Record<DateSelectionEvent, {
  text: (dateLabel: string) => string;
  doneWhen: string;
}> = {
  wedding: {
    text: dateLabel => `用20分钟为${dateLabel}建立关键参与人确认表，列出新人、双方主要家人与场地方是否能到场。`,
    doneWhen: "每一方都标有“已确认”或“待回复”，并为待回复项写下最晚确认时间。"
  },
  moving: {
    text: dateLabel => `用20分钟核对${dateLabel}的搬家交接链，依次确认钥匙领取、物业通行和搬运到达时间。`,
    doneWhen: "三项都写下负责人和具体时间；无法确认的项目已标出下一位联系人。"
  },
  opening: {
    text: dateLabel => `用20分钟检查${dateLabel}开门前的人员、证照和关键设备，把未就绪项集中写在一张清单上。`,
    doneWhen: "人员、证照、设备三栏均有明确状态，未就绪项各有负责人和处理时间。"
  },
  signing: {
    text: dateLabel => `用20分钟整理${dateLabel}签约前仍待确认的主体、金额期限和违约退出条款。`,
    doneWhen: "每类条款都标明已确认版本；存在疑问的地方已写成可以直接发给对方的问题。"
  },
  travel: {
    text: dateLabel => `用20分钟核对${dateLabel}出发所需的交通班次、有效证件和目的地天气。`,
    doneWhen: "三项均已核对；任何未确定事项都有最晚确认时间和替代安排。"
  },
  renovation_start: {
    text: dateLabel => `用20分钟确认${dateLabel}动工所需的物业许可、施工方到场和现场安全交底。`,
    doneWhen: "三项都有确认人和确认状态；涉及电气、燃气或结构的内容已交由合格专业人员负责。"
  }
};

export function buildTimingSelection(input: TimingSelectionInput): TimingSelectionResult {
  assertDateKey(input.startDate);
  const userChart = computeBazi({
    gender: "other",
    birthDate: input.birthDate,
    birthTime: input.birthTime ?? "",
    birthLocation: input.birthLocation ?? undefined,
    timezone: input.timezone,
    unknownTime: input.unknownTime ?? !input.birthTime
  });
  const endDate = offsetDate(input.startDate, input.rangeDays - 1);
  if (userChart.calculation.uncertainty?.yearCandidates) {
    return {
      status: "insufficient",
      event: input.event,
      eventLabel: EVENT_LABEL[input.event],
      startDate: input.startDate,
      endDate,
      rangeDays: input.rangeDays,
      profileScope: `已保存出生日期为 ${input.birthDate}，但出生当天处于立春年柱交接边界。`,
      insufficientReason: "出生时辰未知，年支无法唯一确定；当前排除规则需要年支，因此本次不生成候选。",
      candidates: [],
      boundary: "补充大致出生时段后才能继续使用当前候选规则；系统不会用中午结果代替不确定年柱。"
    };
  }
  const candidates: TimingCandidate[] = [];

  for (let offset = 0; offset < input.rangeDays; offset += 1) {
    const date = offsetDate(input.startDate, offset);
    const dayChart = computeBazi({
      gender: "other",
      birthDate: date,
      birthTime: "12:00",
      unknownTime: false
    });
    const weekdayIndex = weekdayOf(date);
    const eventRule = evaluateEventRule(input.event, dayChart.day.stem, dayChart.day.branch, weekdayIndex, offset);
    const yearBranchClash = isSixClash(userChart.year.branch, dayChart.day.branch);
    if (!eventRule.matches || yearBranchClash) continue;

    const relation = describeStemRelation(
      STEM_ELEMENT[userChart.dayMaster],
      dayChart.day.stemElement
    );
    const dateLabel = `${formatShortDate(date)}（${WEEKDAYS[weekdayIndex]}）`;
    const evidence: TimingCandidateEvidence[] = [
      {
        id: "calendar-day",
        source: date,
        fact: `${dateLabel}的日柱为${dayChart.day.pillarLabel}`,
        explanation: "日期与日柱来自现有确定性历法计算。"
      },
      {
        id: "birth-reference",
        source: `已保存出生日期 ${input.birthDate}`,
        fact: relation.fact,
        explanation: "这里只使用出生日期得到的日干作为参照，没有使用出生时辰。"
      },
      {
        id: "year-branch-check",
        source: `本人年支${userChart.year.branch}、候选日支${dayChart.day.branch}`,
        fact: "未触发本版排除的年支六冲",
        explanation: "这只表示没有命中当前排除规则，不代表事情会按计划发生。"
      },
      {
        id: "event-rule",
        source: `${EVENT_LABEL[input.event]}筛选规则`,
        fact: eventRule.fact,
        explanation: "事项规则公开参与候选筛选，不使用隐藏分数。"
      }
    ];

    candidates.push({
      date,
      weekday: WEEKDAYS[weekdayIndex],
      distanceLabel: formatDistance(offset),
      ganzhiDay: dayChart.day.pillarLabel,
      whyCandidate: `这一天进入候选，是因为${eventRule.fact}；同时，${relation.summary}，且没有触发本版排除的年支六冲。`,
      arrangementFit: eventRule.arrangementFit,
      confirmBefore: eventRule.confirmBefore,
      limitation: relation.limitation,
      evidence,
      action: {
        sourceEvent: input.event,
        sourceDate: date,
        durationMinutes: 20,
        text: PREPARATION_ACTIONS[input.event].text(dateLabel),
        doneWhen: PREPARATION_ACTIONS[input.event].doneWhen
      }
    });
  }

  return {
    status: "ready",
    event: input.event,
    eventLabel: EVENT_LABEL[input.event],
    startDate: input.startDate,
    endDate,
    rangeDays: input.rangeDays,
    profileScope: `本次使用已保存资料得到的日干与年支作为有限参照；出生时辰和法定时区只在年柱交接边界用于确认年支，性别不参与候选筛选。`,
    candidates: candidates.slice(0, 3),
    boundary: "候选日期只表示当前规则下值得继续核对，不代表事情结果；现实中的人员、合同、天气、交通、场地和安全条件仍需优先确认。"
  };
}

function evaluateEventRule(
  event: DateSelectionEvent,
  dayStem: string,
  dayBranch: Branch,
  weekday: number,
  offset: number
): EventRuleResult {
  const weekend = weekday === 0 || weekday === 6;
  const weekdayLabel = WEEKDAYS[weekday];
  switch (event) {
    case "wedding": {
      const ritualBranch = dayBranch === "卯" || dayBranch === "酉";
      return {
        matches: weekend || ritualBranch,
        fact: weekend
          ? `${weekdayLabel}便于核对主要参与者与场地安排`
          : `${dayBranch}日进入本版礼仪与约定类日期观察`,
        arrangementFit: weekend ? "更便于集中协调参与者、场地和交通。" : "可用于继续核对仪式流程与关键约定。",
        confirmBefore: "先确认双方关键参与者、场地与交通是否在这一天可执行。"
      };
    }
    case "moving":
      return {
        matches: dayBranch === "寅" || dayBranch === "午",
        fact: `${dayBranch}日命中本版搬家事项的寅、午日规则`,
        arrangementFit: "适合继续核对钥匙、物业通行与搬运衔接。",
        confirmBefore: "先确认物业、电梯或通道、钥匙交接和搬运人员时间。"
      };
    case "opening":
      return {
        matches: dayStem === "甲" || dayStem === "丙",
        fact: `${dayStem}日命中本版开业事项的甲、丙日规则`,
        arrangementFit: "适合继续核对人员到岗、证照和设备启用。",
        confirmBefore: "先确认许可手续、现场设备和首班人员能够按时就位。"
      };
    case "signing":
      return {
        matches: !weekend,
        fact: `${weekdayLabel}命中本版签约事项的工作日规则`,
        arrangementFit: "便于合同主体、授权人与专业支持同步确认。",
        confirmBefore: "先确认对方主体、授权文件、合同终稿和必要的专业复核。"
      };
    case "travel":
      return {
        matches: offset >= 2,
        fact: `距离计划起点还有${offset}天，命中本版出行事项至少预留两天的规则`,
        arrangementFit: "仍有时间核对交通、证件、天气和替代安排。",
        confirmBefore: "先确认班次、证件有效期、目的地天气与返程余量。"
      };
    case "renovation_start":
      return {
        matches: !weekend,
        fact: `${weekdayLabel}命中本版动工事项的工作日协同规则`,
        arrangementFit: "便于物业、施工方和现场负责人同步确认。",
        confirmBefore: "先确认物业许可、施工人员和安全交底；电气、燃气与结构事项交由合格专业人员。"
      };
  }
}

function describeStemRelation(userElement: Element, dayElement: Element) {
  if (userElement === dayElement) {
    return {
      fact: `候选日干与本人日干同属${dayElement}`,
      summary: "候选日干与本人日干属于同类关系",
      limitation: "同类关系只是传统结构参照，仍需按现实条件核对日期。"
    };
  }
  if (SHENG[userElement] === dayElement) {
    return {
      fact: `本人日干五行生候选日干五行（${userElement}生${dayElement}）`,
      summary: "日干关系属于本人一侧向候选日提供承接",
      limitation: "这项生克关系不代表事情一定顺利，也不替代现实准备。"
    };
  }
  if (SHENG[dayElement] === userElement) {
    return {
      fact: `候选日干五行生本人日干五行（${dayElement}生${userElement}）`,
      summary: "日干关系属于候选日一侧向本人结构提供承接",
      limitation: "这项生克关系只用于日期比较，不等于现实中的支持一定出现。"
    };
  }
  if (KE[userElement] === dayElement) {
    return {
      fact: `本人日干五行克候选日干五行（${userElement}克${dayElement}）`,
      summary: "日干关系提示准备时可能需要本人投入更多控制与核对",
      limitation: "这不作结果判断；若现实条件更合适，仍可继续人工核对。"
    };
  }
  return {
    fact: `候选日干五行克本人日干五行（${dayElement}克${userElement}）`,
    summary: "日干关系提示准备时需要为外部限制预留余量",
    limitation: "这不是坏结果预测，也不会单独排除一个现实可执行的日期。"
  };
}

function isSixClash(first: Branch, second: Branch) {
  const pairs: Array<[Branch, Branch]> = [
    ["子", "午"], ["丑", "未"], ["寅", "申"],
    ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]
  ];
  return pairs.some(([a, b]) => (a === first && b === second) || (b === first && a === second));
}

function assertDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T12:00:00Z`).getTime())) {
    throw new Error("日期格式错误，请使用 YYYY-MM-DD");
  }
}

function offsetDate(dateKey: string, offset: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function weekdayOf(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

function formatDistance(offset: number) {
  if (offset === 0) return "今天";
  if (offset === 1) return "明天";
  return `${offset}天后`;
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
