import { describe, expect, it } from "vitest";
import {
  loadPlateSnapshotDetail,
  presentPlateArchive,
  presentPlateDetail,
  type PlatePresentationInput
} from "@/lib/platePresentation";
import {
  PLATE_ENGINE_VERSIONS,
  PLATE_PROTOCOL_VERSION,
  type PlateType
} from "@/lib/plateRecords";

const IDS = {
  bazi: "b0000000-0000-4000-8000-000000000001",
  relation: "b0000000-0000-4000-8000-000000000002",
  home: "b0000000-0000-4000-8000-000000000003",
  timing: "b0000000-0000-4000-8000-000000000004"
} as const;
const CREATED_AT = new Date("2026-07-27T03:00:00.000Z");

function base(
  plateType: PlateType,
  inputSnapshot: unknown,
  resultSnapshot: unknown,
  id: string = IDS.bazi
): PlatePresentationInput {
  return {
    id,
    plateType,
    protocolVersion: PLATE_PROTOCOL_VERSION,
    engineVersion: PLATE_ENGINE_VERSIONS[plateType],
    inputSnapshot,
    resultSnapshot,
    resultDate: "2026-07-27",
    calculatedAt: CREATED_AT,
    createdAt: CREATED_AT,
    action: null
  };
}

const profile = {
  birthDate: "1990-05-20",
  birthTime: null,
  birthLocation: "上海",
  timezone: "Asia/Shanghai",
  unknownTime: true
};

const observation = {
  title: "启动方式",
  conclusion: "先确认依据再开始。",
  trigger: "资料较多时",
  strength: "减少返工",
  watchout: "可能迟迟不开始",
  action: "写下三条事实。",
  limitation: "只作生活观察。"
};

function baziSnapshot() {
  return base("BAZI", { input: {}, profile }, {
    chart: {
      year: { pillarLabel: "庚午" },
      month: { pillarLabel: "辛巳" },
      day: { pillarLabel: "乙酉" },
      hour: null
    },
    observations: [observation, observation, observation],
    weeklyAction: { sourceTitle: "启动方式", action: "写下三条事实。" },
    timeLayers: [{
      label: "今日",
      period: "2026-07-27",
      pillar: { pillarLabel: "壬寅" },
      focusTitle: "先确认一个事实",
      lifeTheme: "今天适合从一个可核对事实开始。"
    }]
  }, IDS.bazi);
}

function relationSnapshot(nickname = "很长但仍然安全的昵称") {
  return base("RELATION", {
    input: {
      relationshipType: "cooperation",
      otherBirthDate: "1992-06-12",
      otherNickname: nickname
    },
    profile
  }, {
    selfChart: { day: { pillarLabel: "乙酉" } },
    otherChart: { day: { pillarLabel: "丙辰" } },
    interactionFacts: {
      firstPerspective: { fact: "你会先确认边界。" },
      secondPerspective: { fact: "对方会先推进表达。" },
      elementRelation: { label: "相生", fact: "一方提供另一方所需资源。" }
    },
    observations: [observation, observation, observation],
    jointAction: {
      title: "共同确认",
      action: "双方各说一个待确认事实。",
      doneWhen: "两项事实都有结论。",
      durationMinutes: 20
    }
  }, IDS.relation);
}

function homeSnapshot(status: "priority" | "clear" | "insufficient") {
  const priority = status === "priority" ? {
    areaLabel: "主要休息区",
    issueLabel: "持续噪声",
    title: "先记录噪声来源",
    reason: "它会持续影响休息条件。"
  } : null;
  return base("HOME", {
    input: {
      areas: status === "insufficient"
        ? {}
        : { rest: { reviewed: true, issues: status === "priority" ? ["rest_persistent_noise"] : [] } }
    }
  }, {
    assessment: {
      status,
      coverageNote: status === "insufficient" ? "尚未确认区域。" : "已确认主要休息区。",
      priority,
      action: priority ? {
        text: "记录噪声时段。",
        doneWhen: "记录三个时段。",
        durationMinutes: 15,
        requiresProfessional: false
      } : null
    }
  }, IDS.home);
}

function timingSnapshot(options: { candidates?: boolean; selected?: boolean } = {}) {
  const candidates = options.candidates === false ? [] : [{
    date: "2026-07-30",
    weekday: "星期四",
    whyCandidate: "符合事项规则。",
    arrangementFit: "方便确认条款。",
    confirmBefore: "确认主体和金额。",
    limitation: "不保证现实结果。",
    evidence: [{ fact: "日柱为甲子", explanation: "来自确定性历法。" }],
    action: {
      text: "整理待确认条款。",
      doneWhen: "每项都有状态。",
      durationMinutes: 20
    }
  }];
  return base("TIMING", {
    input: {
      event: "signing",
      startDate: "2026-07-28",
      rangeDays: 7,
      ...(options.selected === false ? {} : { selectedDate: "2026-07-30" })
    },
    profile
  }, {
    selection: {
      status: options.candidates === false ? "insufficient" : "ready",
      insufficientReason: options.candidates === false ? "出生边界尚未确定。" : undefined,
      candidates,
      boundary: "候选只作安排参考。"
    },
    selectedCandidate: options.selected === false || options.candidates === false ? null : candidates[0]
  }, IDS.timing);
}

describe("plate presentation DTO", () => {
  it("presents BAZI with unknown birth time, pillars, observations, and time layers", () => {
    const detail = presentPlateDetail(baziSnapshot());
    expect(detail.displayable).toBe(true);
    if (!detail.displayable || detail.content.kind !== "BAZI") throw new Error("unexpected DTO");
    expect(detail.content.profile.timeLabel).toBe("出生时间未确定");
    expect(detail.content.pillars.at(-1)?.value).toBe("时辰未定");
    expect(detail.content.observations).toHaveLength(3);
    expect(detail.content.weeklyAction?.text).toBe("写下三条事实。");
    expect(detail.content.timeLayers[0].pillar).toBe("壬寅");
    expect(detail.actionAvailable).toBe(true);
  });

  it("presents RELATION nickname, relationship label, and date summary", () => {
    const archive = presentPlateArchive(relationSnapshot("小林"));
    expect(archive.summary).toBe("小林 · 合作");
    expect(archive.secondary).toBe("对方出生日期 1992-06-12");
    const detail = presentPlateDetail(relationSnapshot("小林"));
    expect(detail.displayable).toBe(true);
    if (!detail.displayable || detail.content.kind !== "RELATION") throw new Error("unexpected DTO");
    expect(detail.content.nickname).toBe("小林");
    expect(detail.content.otherBirthDate).toBe("1992-06-12");
    expect(detail.content.interaction).toHaveLength(3);
    expect(detail.actionAvailable).toBe(true);
  });

  it.each([
    ["priority", "主要休息区 · 持续噪声"],
    ["clear", "已检查区域暂未见上述问题"],
    ["insufficient", "当时仅保存了部分空间情况"]
  ] as const)("presents HOME %s state", (status, expectedSummary) => {
    const item = presentPlateArchive(homeSnapshot(status));
    expect(item.summary).toBe(expectedSummary);
    const detail = presentPlateDetail(homeSnapshot(status));
    expect(detail.displayable).toBe(true);
    if (!detail.displayable || detail.content.kind !== "HOME") throw new Error("unexpected DTO");
    expect(detail.content.status).toBe(status);
    expect(detail.actionAvailable).toBe(status === "priority");
  });

  it("presents TIMING original range, candidates, and selected date", () => {
    const detail = presentPlateDetail(timingSnapshot());
    expect(detail.displayable).toBe(true);
    if (!detail.displayable || detail.content.kind !== "TIMING") throw new Error("unexpected DTO");
    expect(detail.content.startDate).toBe("2026-07-28");
    expect(detail.content.rangeDays).toBe(7);
    expect(detail.content.selectedDate).toBe("2026-07-30");
    expect(detail.content.candidates).toHaveLength(1);
    expect(detail.actionAvailable).toBe(true);
  });

  it("presents TIMING without candidates or selectedDate without replacing startDate", () => {
    const snapshot = timingSnapshot({ candidates: false, selected: false });
    const detail = presentPlateDetail(snapshot);
    expect(detail.displayable).toBe(true);
    if (!detail.displayable || detail.content.kind !== "TIMING") throw new Error("unexpected DTO");
    expect(detail.content.startDate).toBe("2026-07-28");
    expect(detail.content.selectedDate).toBeNull();
    expect(detail.content.candidates).toEqual([]);
    expect(detail.actionAvailable).toBe(false);
    expect(presentPlateArchive(snapshot).secondary).toBe("当时未选出候选日期");
  });

  it("degrades damaged JSON and unknown versions without exposing internal IDs", () => {
    const damaged = { ...baziSnapshot(), resultSnapshot: { chart: "broken" } };
    const damagedDetail = presentPlateDetail(damaged);
    expect(damagedDetail.displayable).toBe(false);
    expect(presentPlateArchive(damaged).summary).toBe("这条记录暂时无法完整展示");

    const oldVersion = { ...baziSnapshot(), protocolVersion: "plate-snapshot-v0" };
    expect(presentPlateDetail(oldVersion).displayable).toBe(false);
    const serialized = JSON.stringify(presentPlateDetail(oldVersion));
    expect(serialized).not.toContain("userId");
    expect(serialized).not.toContain("requestId");
  });

  it("maps optional readonly action status and reviews", () => {
    const withAction: PlatePresentationInput = {
      ...baziSnapshot(),
      action: {
        id: "c0000000-0000-4000-8000-000000000001",
        actionVersion: "plate-action-v1",
        actionData: {
          plateType: "BAZI",
          source: { kind: "weeklyAction", id: "observation-start", title: "启动方式" },
          text: "写下三条事实。",
          durationMinutes: null,
          doneWhen: null,
          requiresProfessional: false
        },
        status: "completed",
        completedAt: CREATED_AT,
        createdAt: CREATED_AT,
        reviews: [{
          id: "d0000000-0000-4000-8000-000000000001",
          reviewVersion: "plate-action-review-v1",
          reviewData: { outcome: "helpful", note: "确实有帮助" },
          createdAt: CREATED_AT
        }]
      }
    };
    const detail = presentPlateDetail(withAction);
    expect(detail.action?.statusLabel).toBe("已完成");
    expect(detail.action).toMatchObject({
      id: "c0000000-0000-4000-8000-000000000001",
      text: "写下三条事实。",
      operable: true
    });
    expect(detail.action?.reviews[0]).toMatchObject({
      outcome: "有帮助",
      note: "确实有帮助"
    });

    const actionFixture = withAction.action;
    const reviewFixture = actionFixture?.reviews?.[0];
    if (!actionFixture || !reviewFixture) throw new Error("expected action review fixture");
    const damagedAction = presentPlateDetail({
      ...withAction,
      action: {
        ...actionFixture,
        actionData: { text: "broken" },
        reviews: [{
          ...reviewFixture,
          reviewData: { outcome: "unknown" }
        }]
      }
    });
    expect(damagedAction.action).toMatchObject({
      operable: false,
      text: null
    });
    expect(damagedAction.action?.reviews[0]).toMatchObject({
      outcome: "复盘内容暂时无法展示",
      note: null
    });
  });
});

describe("detail ownership loader", () => {
  it("queries by id and userId and returns null for malformed or foreign IDs", async () => {
    const calls: unknown[] = [];
    const client = {
      plateSnapshot: {
        findFirst: async (args: unknown) => {
          calls.push(args);
          return baziSnapshot();
        }
      }
    };
    const detail = await loadPlateSnapshotDetail("user-a", IDS.bazi, client as never);
    expect(detail?.id).toBe(IDS.bazi);
    expect(calls[0]).toMatchObject({
      where: { id: IDS.bazi, userId: "user-a" },
      include: {
        action: {
          include: { reviews: { orderBy: { createdAt: "asc" } } }
        }
      }
    });
    expect(await loadPlateSnapshotDetail("user-a", "not-a-uuid", client as never)).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it("returns null when the owned query finds no record", async () => {
    const client = { plateSnapshot: { findFirst: async () => null } };
    expect(await loadPlateSnapshotDetail("user-b", IDS.bazi, client as never)).toBeNull();
  });
});
