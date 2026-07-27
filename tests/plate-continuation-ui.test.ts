import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  INITIAL_PLATE_SAVE_STATE,
  nextPlateSaveRequestId
} from "@/components/PlateSaveControl";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const workspaces = read("src/components/MethodWorkspaces.tsx");
const detail = read("src/components/PlateSnapshotDetail.tsx");
const notice = read("src/components/PlateContinuationNotice.tsx");
const baziPage = read("src/app/bazi/page.tsx");
const relationPage = read("src/app/marriage/page.tsx");
const homePage = read("src/app/fengshui/page.tsx");
const timingPage = read("src/app/date-selection/page.tsx");
const continuation = read("src/lib/plateContinuation.ts");

describe("plate continuation UI contract", () => {
  it("offers only opaque snapshot-id continuation links on details", () => {
    expect(detail).toContain("/bazi?from=${id}");
    expect(detail).toContain("/marriage?from=${id}");
    expect(detail).toContain("/fengshui?from=${id}");
    expect(detail).toContain("/date-selection?from=${id}&mode=original");
    expect(detail).toContain("/date-selection?from=${id}&mode=today");
    expect(detail).not.toMatch(/birthDate=.*\\?|inputSnapshot=.*\\?|JSON\.stringify/);
    expect(detail).toContain("新结果不会覆盖这条历史快照");
    expect(detail).toContain("这条记录暂不支持继续使用");
  });

  it("loads continuations on the server with the current cookie user and expected plate type", () => {
    for (const [source, plateType] of [
      [baziPage, "BAZI"],
      [relationPage, "RELATION"],
      [homePage, "HOME"],
      [timingPage, "TIMING"]
    ] as const) {
      expect(source).toContain("getCurrentUserId()");
      expect(source).toContain(`loadPlateContinuation(userId, from, "${plateType}")`);
      expect(source).toContain("notFound()");
    }
    expect(continuation).toContain("where: { id: snapshotId, userId }");
    expect(continuation).not.toMatch(/plateSnapshot\.(update|upsert)/);
  });

  it("keeps BAZI on the current profile and displays the required distinction", () => {
    expect(workspaces).toContain("使用当前保存的生辰资料和当前计算规则");
    expect(workspaces).toContain("<ProfileGate");
    expect(workspaces).not.toContain("continuation.input.profile");
    expect(workspaces).toContain('plateType="BAZI"');
    expect(workspaces).toContain("input={{}}");
  });

  it("restores relation fields while nickname stays outside computation", () => {
    expect(workspaces).toContain("continuation?.input.otherBirthDate");
    expect(workspaces).toContain("continuation?.input.otherNickname");
    expect(workspaces).toContain("continuation?.input.relationshipType");
    const factsCall = workspaces.match(/buildPairInteractionFacts\([^)]*\)/)?.[0] ?? "";
    expect(factsCall).not.toContain("otherNickname");
    expect(workspaces).toContain("本人部分使用当前保存的生辰资料");
  });

  it("clones HOME input and recalculates with the current assessment function", () => {
    expect(workspaces).toContain("cloneHomeInput(continuation?.input.areas ?? {})");
    expect(workspaces).toContain("buildHomeSpaceAssessment(input)");
    expect(workspaces).toContain("当前结果按现行规则计算");
  });

  it("uses actual TIMING startDate for calculation, display, reset key, and save payload", () => {
    expect(timingPage).toContain("resolveTimingContinuation");
    expect(timingPage).toContain('value === "original" || value === "today"');
    expect(workspaces).toContain("const startDate = continuation?.startDate ?? today");
    expect(workspaces).toContain("本次实际起始日期");
    expect(workspaces.match(/startDate,/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(workspaces).not.toContain("startDate: today");
    expect(workspaces).toContain("if (!selection)");
    expect(continuation).toContain("原选中日期已不在当前候选中");
  });

  it("starts a continuation save as a fresh intent rather than reusing the source id", () => {
    const uuid = "d0000000-0000-4000-8000-000000000001";
    expect(nextPlateSaveRequestId(INITIAL_PLATE_SAVE_STATE, () => uuid)).toBe(uuid);
    expect(workspaces).not.toMatch(/requestId\s*=\s*continuation|requestId:\s*continuation/);
    expect(notice).toContain("原记录不会被修改");
    expect(notice).toContain("新结果需要再次明确点击保存");
    expect(notice).toContain("返回历史快照");
  });

  it("does not add AI, Report, automatic saving, or snapshot update behavior", () => {
    const combined = [
      continuation,
      notice,
      baziPage,
      relationPage,
      homePage,
      timingPage
    ].join("\n");
    expect(combined).not.toMatch(/Report|report|Anthropic|OpenAI|safetyFilter/);
    expect(combined).not.toMatch(/plateSnapshot\.(update|upsert)/);
    expect(combined).not.toContain("/api/reports");
    expect(notice).not.toMatch(/已自动另存|历史记录已更新|已同步|结果保持一致/);
  });
});
