import { describe, expect, it } from "vitest";
import {
  HOME_AREA_DEFINITIONS,
  buildHomeSpaceAssessment,
  getHomeAreaStatus,
  type HomeAreaId,
  type HomeIssueId,
  type HomeSpaceInput
} from "@/lib/domain/homeSpaceObservations";

function area(...issues: HomeIssueId[]) {
  return { reviewed: true as const, issues };
}

function one(region: HomeAreaId, issue: HomeIssueId): HomeSpaceInput {
  return { [region]: area(issue) };
}

describe("home space observations", () => {
  it("keeps an empty input as insufficient instead of filling gaps", () => {
    const result = buildHomeSpaceAssessment({});

    expect(result.status).toBe("insufficient");
    expect(result.reviewedAreas).toEqual([]);
    expect(result.missingAreas).toEqual(["entry", "rest", "kitchen"]);
    expect(result.priority).toBeNull();
    expect(result.action).toBeNull();
    expect(result.coverageNote).toContain("没有填写");
  });

  it.each([
    ["entry", "entry_clutter"],
    ["rest", "rest_persistent_noise"],
    ["kitchen", "kitchen_workspace_interference"]
  ] as const)("can assess %s when it is the only reviewed area", (region, issue) => {
    const result = buildHomeSpaceAssessment(one(region, issue));

    expect(result.status).toBe("priority");
    expect(result.reviewedAreas).toEqual([region]);
    expect(result.missingAreas).toHaveLength(2);
    expect(result.priority?.area).toBe(region);
    expect(result.coverageNote).toContain("资料不足");
  });

  it("does not manufacture a problem when all reviewed conditions are normal", () => {
    const result = buildHomeSpaceAssessment({
      entry: area(),
      rest: area(),
      kitchen: area()
    });

    expect(result.status).toBe("clear");
    expect(result.facts).toEqual([]);
    expect(result.priority).toBeNull();
    expect(result.action).toBeNull();
    expect(result.coverageNote).toBe("入户、主要休息区和厨房均已填写，本次排序只使用这些现实情况。");
    expect(result.coverageNote).not.toMatch(/未填写区域|补充其他区域/);
  });

  it("lists the two missing areas when only one reviewed area is normal", () => {
    const result = buildHomeSpaceAssessment({ rest: area() });

    expect(result.status).toBe("clear");
    expect(result.reviewedAreas).toEqual(["rest"]);
    expect(result.missingAreas).toEqual(["entry", "kitchen"]);
    expect(result.coverageNote).toContain("已根据主要休息区判断");
    expect(result.coverageNote).toContain("入户、厨房资料不足");
  });

  it("distinguishes insufficient, clear and issue-count area states", () => {
    const input: HomeSpaceInput = {
      rest: area(),
      kitchen: area("kitchen_backtracking", "kitchen_passage_blocked")
    };

    expect(getHomeAreaStatus(input, "entry")).toEqual({
      state: "insufficient",
      label: "资料不足",
      issueCount: 0
    });
    expect(getHomeAreaStatus(input, "rest")).toEqual({
      state: "clear",
      label: "已检查正常",
      issueCount: 0
    });
    expect(getHomeAreaStatus(input, "kitchen")).toEqual({
      state: "issues",
      label: "发现2项",
      issueCount: 2
    });
  });

  it.each([
    ["entry_passage_blocked", "通道受阻"],
    ["entry_emergency_exit_blocked", "安全出口受阻"]
  ] as const)("keeps the entry issue %s traceable", (issueId, label) => {
    const result = buildHomeSpaceAssessment(one("entry", issueId));

    expect(result.priority?.issueLabel).toBe(label);
    expect(result.priority?.source).toContain(`入户 · ${label}`);
    expect(result.action?.sourceFactId).toBe(result.priority?.id);
  });

  it.each([
    ["rest_persistent_noise", "持续噪声"],
    ["rest_night_strong_light", "夜间强光"],
    ["rest_poor_ventilation", "通风不足"],
    ["rest_damp_mold", "潮湿或霉味"]
  ] as const)("distinguishes the rest condition %s", (issueId, label) => {
    const result = buildHomeSpaceAssessment(one("rest", issueId));

    expect(result.priority?.issueLabel).toBe(label);
    expect(result.action?.text).not.toBe("");
    expect(result.action?.doneWhen).not.toBe("");
    expect(result.action?.durationMinutes).toBeLessThanOrEqual(20);
  });

  it.each([
    ["kitchen_poor_exhaust", "排烟不足"],
    ["kitchen_heat_hazard", "热源附近有风险物品"],
    ["kitchen_workspace_interference", "操作区互相妨碍"],
    ["kitchen_backtracking", "来回折返"]
  ] as const)("distinguishes the kitchen condition %s", (issueId, label) => {
    const result = buildHomeSpaceAssessment(one("kitchen", issueId));

    expect(result.priority?.issueLabel).toBe(label);
    expect(result.action?.sourceIssueId).toBe(issueId);
  });

  it("ranks safety above long-term conditions and daily function", () => {
    const result = buildHomeSpaceAssessment({
      entry: area("entry_passage_blocked"),
      rest: area("rest_damp_mold"),
      kitchen: area("kitchen_heat_hazard", "kitchen_backtracking")
    });

    expect(result.priority?.issueId).toBe("kitchen_heat_hazard");
    expect(result.priority?.priority).toBe(1);
    expect(result.priority?.priorityLabel).toBe("明显安全问题");
    expect(result.action?.requiresProfessional).toBe(true);
    expect(result.action?.text).toMatch(/暂停使用/);
    expect(result.action?.text).toMatch(/物业|合格专业人员/);
  });

  it("uses area order and then option order when top problems share a priority", () => {
    const acrossAreas = buildHomeSpaceAssessment({
      kitchen: area("kitchen_backtracking"),
      rest: area("rest_bump_passage"),
      entry: area("entry_clutter")
    });
    const insideRestArea = buildHomeSpaceAssessment({
      rest: area("rest_damp_mold", "rest_persistent_noise", "rest_night_strong_light")
    });

    expect(acrossAreas.priority?.issueId).toBe("entry_clutter");
    expect(insideRestArea.priority?.issueId).toBe("rest_persistent_noise");
  });

  it("reports the actual number of other top-priority problems", () => {
    const result = buildHomeSpaceAssessment({
      rest: area("rest_persistent_noise", "rest_night_strong_light"),
      kitchen: area("kitchen_poor_exhaust", "kitchen_backtracking")
    });

    expect(result.priority?.priority).toBe(2);
    expect(result.otherTopPriorityCount).toBe(2);
    expect(result.selectionNote).toBe("另有2项同级问题，本次按检查顺序先展示这一项；其他已填写问题没有被忽略。");
  });

  it("changes the priority for an explainable reason after one input is removed", () => {
    const before = buildHomeSpaceAssessment({
      entry: area("entry_emergency_exit_blocked"),
      rest: area("rest_persistent_noise")
    });
    const after = buildHomeSpaceAssessment({
      entry: area(),
      rest: area("rest_persistent_noise")
    });

    expect(before.priority?.issueId).toBe("entry_emergency_exit_blocked");
    expect(after.priority?.issueId).toBe("rest_persistent_noise");
    expect(after.facts.some(fact => fact.issueId === "entry_emergency_exit_blocked")).toBe(false);
  });

  it("keeps the five-step counterfactual sequence stable", () => {
    const noiseOnly = buildHomeSpaceAssessment({ rest: area("rest_persistent_noise") });
    const withSafety = buildHomeSpaceAssessment({
      entry: area("entry_emergency_exit_blocked"),
      rest: area("rest_persistent_noise")
    });
    const safetyRemoved = buildHomeSpaceAssessment({
      rest: area("rest_persistent_noise")
    });
    const cleared = buildHomeSpaceAssessment({});
    const allNormal = buildHomeSpaceAssessment({
      entry: area(),
      rest: area(),
      kitchen: area()
    });

    expect(noiseOnly.priority?.issueId).toBe("rest_persistent_noise");
    expect(withSafety.priority?.issueId).toBe("entry_emergency_exit_blocked");
    expect(safetyRemoved.priority?.issueId).toBe("rest_persistent_noise");
    expect(cleared.status).toBe("insufficient");
    expect(allNormal.status).toBe("clear");
  });

  it("ties the only action to the selected priority fact", () => {
    const result = buildHomeSpaceAssessment({
      entry: area("entry_clutter", "entry_dim"),
      kitchen: area("kitchen_workspace_interference")
    });

    expect(result.action).not.toBeNull();
    expect(result.action?.sourceFactId).toBe(result.priority?.id);
    expect(result.action?.sourceArea).toBe(result.priority?.area);
    expect(result.action?.sourceIssueId).toBe(result.priority?.issueId);
    expect(result.action?.durationMinutes).toBeLessThanOrEqual(20);
    expect(result.action?.doneWhen.length).toBeGreaterThan(8);
  });

  it("gives different actions to different conditions", () => {
    const actionTexts = HOME_AREA_DEFINITIONS.flatMap(definition =>
      definition.issueIds.map(issueId => buildHomeSpaceAssessment(one(definition.id, issueId)).action?.text)
    );

    expect(actionTexts.every(Boolean)).toBe(true);
    expect(new Set(actionTexts).size).toBe(actionTexts.length);
  });

  it("keeps all generated content within the requested safety boundary", () => {
    const outputs = HOME_AREA_DEFINITIONS.flatMap(definition =>
      definition.issueIds.map(issueId => buildHomeSpaceAssessment(one(definition.id, issueId)))
    );
    const text = JSON.stringify(outputs);

    expect(text).not.toMatch(/吉凶|财运|健康|婚姻|化煞|改运/);
    expect(text).not.toMatch(/住宅评分|风水分数|能量分数|幸运颜色|摆件/);
  });
});
