import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const panel = readFileSync("src/components/PlateActionPanel.tsx", "utf8");
const detail = readFileSync("src/components/PlateSnapshotDetail.tsx", "utf8");
const presentation = readFileSync("src/lib/platePresentation.ts", "utf8");
const mePage = readFileSync("src/app/me/page.tsx", "utf8");
const actionDto = presentation.slice(
  presentation.indexOf("export interface PlateActionDetail"),
  presentation.indexOf("export function presentPlateArchive")
);

describe("plate action UI", () => {
  it("only offers explicit action creation when actionAvailable is true", () => {
    expect(detail).toContain("actionAvailable={detail.actionAvailable}");
    expect(panel).toContain("if (!actionAvailable) return null");
    expect(panel).toContain("开始这个行动");
    expect(panel).toContain("只有你明确开始后，它才会成为待进行的行动");
    expect(panel).toContain("onClick={createAction}");
    expect(panel).not.toContain("useEffect");
  });

  it("creates from the snapshot with a strict empty body and duplicate protection", () => {
    expect(panel).toContain("actionBusy.current");
    expect(panel).toContain("if (actionBusy.current) return");
    expect(panel).toContain("`/api/plate-records/${snapshotId}/action`");
    expect(panel).toContain('method: "POST"');
    expect(panel).toContain("body: JSON.stringify({})");
    expect(panel).not.toMatch(/actionData\s*:/);
    expect(panel).toContain("router.refresh()");
    expect(panel).toContain("body.error");
  });

  it("supports the three status paths without an action deletion request", () => {
    expect(panel).toContain('updateStatus("completed")');
    expect(panel).toContain('updateStatus("dismissed")');
    expect(panel.match(/updateStatus\("pending"\)/g)).toHaveLength(2);
    expect(panel).toContain("标记为已完成");
    expect(panel).toContain("暂不进行");
    expect(panel).toContain("这不是失败，只表示现在不准备继续");
    expect(panel).not.toContain('method: "DELETE"');
  });

  it("presents only validated action fields and degrades damaged data", () => {
    expect(presentation).toContain("actionDataSchema.safeParse");
    expect(presentation).toContain('actionVersion === "plate-action-v1"');
    expect(presentation).toContain('status: "pending" | "completed" | "dismissed" | "unsupported"');
    expect(actionDto).not.toContain("snapshotId:");
    expect(actionDto).not.toContain("userId:");
    expect(actionDto).not.toContain("requestId:");
    expect(panel).toContain("这条行动暂时无法操作");
  });

  it("keeps HOME safety and TIMING source-date context", () => {
    expect(panel).toContain("action.requiresProfessional");
    expect(panel).toContain("合格专业人员处理");
    expect(panel).toContain("对应当时选中的日期");
    expect(panel).toContain("action.sourceDate");
  });

  it("keeps archive status read-only and sourced from the latest server render", () => {
    expect(mePage).toContain("record.actionStatus");
    expect(mePage).toContain("action: { select: { id: true, status: true, createdAt: true } }");
    expect(mePage).not.toContain("PlateActionPanel");
  });
});
