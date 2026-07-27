import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("plate archive data source and copy", () => {
  const mePage = readFileSync("src/app/me/page.tsx", "utf8");
  const meActions = readFileSync("src/app/me/MeActions.tsx", "utf8");
  const detailPage = readFileSync("src/app/plate-records/[id]/page.tsx", "utf8");
  const detailComponent = readFileSync("src/components/PlateSnapshotDetail.tsx", "utf8");
  const deleteActions = readFileSync("src/app/me/PlateRecordActions.tsx", "utf8");
  const oldReportPage = readFileSync("src/app/reports/[id]/page.tsx", "utf8");
  const saveControl = readFileSync("src/components/PlateSaveControl.tsx", "utf8");

  it("uses PlateSnapshot for four-plate archive, counts, ordering, and categories", () => {
    expect(mePage).toContain("prisma.plateSnapshot.findMany");
    expect(mePage).toContain("prisma.plateSnapshot.count");
    expect(mePage).toContain("prisma.plateSnapshot.groupBy");
    expect(mePage).toContain("where: { userId: user.id }");
    expect(mePage).toContain('orderBy: { createdAt: "desc" }');
    expect(mePage).toContain("take: PLATE_ARCHIVE_LIMIT");
    expect(mePage).toContain("PLATE_ARCHIVE_LIMIT = 100");
    expect(mePage).toContain('action: { select: { id: true, status: true, createdAt: true } }');
    expect(mePage).not.toMatch(/bazi_basic|marriage_basic|home_fengshui_basic|date_selection_basic/);
    for (const plateType of ["BAZI", "RELATION", "HOME", "TIMING"]) {
      expect(mePage).toContain(`plateType: "${plateType}"`);
    }
  });

  it("keeps legacy sign query but excludes Report from four-plate counts", () => {
    expect(mePage).toContain('reportType: "daily_sign"');
    expect(mePage).toContain("plateSnapshotCount");
    expect(mePage).toContain("条四盘记录");
    expect(mePage).not.toContain("totalRecordCount");
    expect(mePage).not.toContain('href={`/reports/${record.id}`}');
  });

  it("shows all queried category records, accurate empty guidance, and action status", () => {
    expect(mePage).toContain("category.records.map");
    expect(mePage).not.toContain("category.records.slice");
    expect(mePage).toContain("还没有保存记录");
    expect(mePage).toContain("需要在对应盘明确点击“保存这次查看”");
    expect(mePage).toContain("record.actionStatus");
    expect(mePage).toContain('href={`/plate-records/${record.id}`}');
    expect(mePage).toContain("PlateRecordActions");
    expect(mePage).not.toContain("完成后会自动归档");
  });

  it("corrects same-browser and email recovery wording", () => {
    expect(meActions).toContain("当前记录通过此浏览器中的匿名身份关联");
    expect(meActions).toContain("邮箱仅作为未验证的账户资料，不是登录凭证");
    expect(meActions).toContain("不能用于找回、跨设备恢复或合并数据");
    expect(mePage).not.toContain("自动归档");
  });

  it("keeps old report detail and save entry intact", () => {
    expect(oldReportPage).toContain("prisma.report.findUnique");
    expect(oldReportPage).toContain('href={`/reports/${report.id}`}');
    expect(saveControl).toContain('fetch("/api/plate-records"');
    expect(saveControl).toContain("前往我的");
  });

  it("uses owned snapshot detail, immutable copy, and no recomputation or AI", () => {
    expect(detailPage).toContain("getCurrentUserId");
    expect(detailPage).toContain("loadPlateSnapshotDetail(userId, params.id)");
    expect(detailPage.match(/notFound\(\)/g)).toHaveLength(2);
    expect(detailPage).toContain("这是保存当时的结果，之后的规则优化不会改写它");
    expect(detailPage).toContain("记录依据");
    expect(detailPage).toContain("detail.displayable && continuation !== null");
    expect(detailPage).not.toMatch(/computeBazi|buildTimingSelection|Anthropic|OpenAI/);
    expect(detailComponent).toContain("PlateActionPanel");
  });

  it("implements two-step single deletion with duplicate protection and safe routing", () => {
    expect(deleteActions).toContain("删除这条记录");
    expect(deleteActions).toContain("删除后不能在页面中恢复");
    expect(deleteActions).toContain("deleting.current");
    expect(deleteActions).toContain("正在删除…");
    expect(deleteActions).toContain("重新尝试删除");
    expect(deleteActions).toContain('method: "DELETE"');
    expect(deleteActions).toContain("router.replace(\"/me\")");
    expect(deleteActions).toContain("router.refresh()");
    expect(deleteActions).toContain("这条记录仍然保留");
    expect(deleteActions).toContain("`/api/plate-records/${recordId}`");
    expect(deleteActions).not.toContain("/api/reports");
    expect(deleteActions).not.toMatch(/批量|deleteMany/);
  });

  it("renders four structured detail variants and graceful fallback", () => {
    for (const name of ["BaziDetail", "RelationDetail", "HomeDetail", "TimingDetail"]) {
      expect(detailComponent).toContain(name);
    }
    expect(detailComponent).toContain("这条记录暂时无法完整展示");
    expect(detailComponent).toContain("记录本身仍然保留");
    expect(detailComponent).toContain("不评分，也不判断关系好坏");
    expect(detailComponent).toContain("当时未选出候选日期");
    expect(detailComponent).toContain("合格专业人员");
  });
});
