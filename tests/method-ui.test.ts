import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DATE_EVENTS, METHOD_MODULES, RELATION_DIMENSIONS } from "@/lib/product/methodUi";

describe("four plate product UI", () => {
  it("keeps four distinct, routable product modules", () => {
    expect(METHOD_MODULES.map(module => module.id)).toEqual(["bazi", "relation", "home", "timing"]);
    expect(new Set(METHOD_MODULES.map(module => module.href)).size).toBe(4);
    expect(METHOD_MODULES.every(module => module.basis.length > 0 && module.description.length > 0)).toBe(true);
  });

  it("lets users choose a plate from a real-life question without overstating save support", () => {
    const entryGrid = readFileSync("src/components/MethodEntryGrid.tsx", "utf8");

    expect(METHOD_MODULES.map(module => module.subtitle)).toEqual([
      "我想看清自己的做事方式",
      "我想理清两个人怎样相处",
      "我想先处理家里的实际困扰",
      "我想为一件事比较几个日期"
    ]);
    expect(entryGrid).toContain("你现在更想解决哪件事");
    expect(entryGrid).toContain("开始查看");
    expect(entryGrid).toContain("随时返回总览");
    expect(entryGrid).not.toContain("可以保存");
  });

  it("keeps every plate inside one input-result-exit loop", () => {
    const shell = readFileSync("src/components/MethodPageShell.tsx", "utf8");
    const workspaces = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");

    expect(shell).toContain('href="/#method-entry-title"');
    expect(shell).toContain("返回四盘总览");
    expect(shell).toContain("重新调整当前输入");
    expect(shell).toContain('id={`${current}-input`}');
    expect(shell).toContain("查看个人资料");
    expect(workspaces).toContain("基础资料暂时没读到");
    expect(workspaces).toContain("重新读取");
    expect(workspaces).toContain('error={error} onRetry={retry} onSaved={payload => setContext(payload)}');
    expect(workspaces).not.toContain('href="/me#birth-profile"');
  });

  it("uses structure dimensions instead of scores for relationships", () => {
    expect(RELATION_DIMENSIONS).toHaveLength(4);
    expect(JSON.stringify(RELATION_DIMENSIONS)).not.toMatch(/评分|匹配分|适不适合|注定|保证/);
  });

  it("gives each supported date event its own selectable entry", () => {
    expect(DATE_EVENTS.map(event => event.id)).toEqual([
      "wedding", "moving", "opening", "signing", "travel", "renovation_start"
    ]);
  });

  it("presents the frozen Bazi and relationship plates with their actual reading order", () => {
    const baziPage = readFileSync("src/app/bazi/page.tsx", "utf8");
    const relationshipPage = readFileSync("src/app/marriage/page.tsx", "utf8");
    const workspaces = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");
    const baziWorkspace = workspaces.slice(workspaces.indexOf("export function BaziWorkspace"), workspaces.indexOf("export function RelationWorkspace"));
    const relationshipWorkspace = workspaces.slice(workspaces.indexOf("export function RelationWorkspace"), workspaces.indexOf("const ROOMS"));

    expect(baziPage).toContain('status="1.0 已冻结"');
    expect(baziPage).toContain('stages={["八字分析", "专业细盘", "查看口径与来源"]}');
    expect(baziWorkspace).toContain('aria-label="八字内容层级"');
    expect(baziWorkspace.indexOf("bazi-view-switch")).toBeLessThan(baziWorkspace.indexOf("bazi-observations"));
    expect(baziWorkspace.indexOf("bazi-observations")).toBeLessThan(baziWorkspace.indexOf("<ProfessionalBaziPanel"));

    expect(relationshipPage).toContain('status="1.0 已冻结"');
    expect(relationshipPage).toContain("先看三种互动");
    expect(relationshipPage).toContain("一起试一个动作");
    expect(relationshipPage).toContain("再查双方日柱");
    expect(relationshipWorkspace.indexOf("relationship-setup")).toBeLessThan(relationshipWorkspace.indexOf("relationship-card-grid"));
    expect(relationshipWorkspace.indexOf("relationship-card-grid")).toBeLessThan(relationshipWorkspace.indexOf("relationship-joint-action"));
    expect(relationshipWorkspace.indexOf("relationship-joint-action")).toBeLessThan(relationshipWorkspace.indexOf("relationship-professional"));
  });

  it("presents the first home plate stage as reality input, one priority and one action", () => {
    const homePage = readFileSync("src/app/fengshui/page.tsx", "utf8");
    const workspaces = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");
    const homeWorkspace = workspaces.slice(workspaces.indexOf("export function HomeWorkspace"), workspaces.indexOf("export function TimingWorkspace"));

    expect(homePage).toContain('status="1.0 第一阶段"');
    expect(homePage).toContain("填写三处现实情况");
    expect(homePage).toContain("先处理一处");
    expect(homePage).toContain("今天完成一个动作");
    const detailedResult = homeWorkspace.indexOf('className={`home-priority-result');
    expect(homeWorkspace.indexOf("home-input-panel")).toBeLessThan(detailedResult);
    expect(detailedResult).toBeLessThan(homeWorkspace.indexOf("home-professional-placeholder"));
    expect(homeWorkspace).toContain('role="status"');
    expect(homeWorkspace).toContain('aria-live="polite"');
    expect(homeWorkspace).toContain('href="#home-priority-result"');
    expect(homeWorkspace).toContain('id="home-priority-result"');
    expect(homeWorkspace).toContain("查看处理建议");
    expect(homeWorkspace).toContain("三处均已检查，暂未见上述问题");
    expect(homeWorkspace).not.toMatch(/未填写区域仍保持|补充其他区域后再重新判断/);
    expect(homeWorkspace).not.toMatch(/HOME_DIRECTIONS|住宅方位|重新校准/);
  });

  it("presents timing as input, candidates, comparison, selected action and evidence", () => {
    const timingPage = readFileSync("src/app/date-selection/page.tsx", "utf8");
    const workspaces = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");
    const timingWorkspace = workspaces.slice(workspaces.indexOf("export function TimingWorkspace"));

    expect(timingPage).toContain('status="1.0 第一阶段"');
    expect(timingPage).toContain("选择事项与范围");
    expect(timingPage).toContain("比较少量候选");
    expect(timingPage).toContain("确认日期并准备");
    expect(timingWorkspace.indexOf("timing-controls")).toBeLessThan(timingWorkspace.indexOf("timing-candidates"));
    expect(timingWorkspace.indexOf("timing-candidates")).toBeLessThan(timingWorkspace.indexOf("timing-comparison"));
    expect(timingWorkspace.indexOf("timing-comparison")).toBeLessThan(timingWorkspace.indexOf("timing-selected-detail"));
    expect(timingWorkspace.indexOf("timing-selected-detail")).toBeLessThan(timingWorkspace.indexOf("timing-evidence"));
    expect(timingWorkspace).toContain("当前范围暂无候选");
    expect(timingWorkspace).toContain("不为凑数降低规则");
    expect(timingWorkspace).toContain("展开专业历法依据与方法边界");
    expect(timingWorkspace).toContain("setSelectedDate(preference.selectedDate)");
    expect(timingWorkspace).toContain("[event, range, startDate, firstCandidateDate, candidateDateKey, preferredSelectedDate, selection]");
    expect(timingWorkspace).not.toMatch(/吉凶分数|能量分数|幸运指数|成功概率|红黑榜|最佳|必选|错过/);
  });
});
