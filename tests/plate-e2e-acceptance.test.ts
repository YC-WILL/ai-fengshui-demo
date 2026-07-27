import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("plate journey acceptance guards", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const detailLoader = readFileSync("src/lib/platePresentation.ts", "utf8");
  const continuationLoader = readFileSync("src/lib/plateContinuation.ts", "utf8");
  const recordRoute = readFileSync("src/app/api/plate-records/[id]/route.ts", "utf8");
  const actionRoute = readFileSync("src/app/api/plate-actions/[id]/route.ts", "utf8");
  const reviewRoute = readFileSync("src/app/api/plate-actions/[id]/reviews/route.ts", "utf8");
  const saveControl = readFileSync("src/components/PlateSaveControl.tsx", "utf8");
  const actionPanel = readFileSync("src/components/PlateActionPanel.tsx", "utf8");
  const deleteControl = readFileSync("src/app/me/PlateRecordActions.tsx", "utf8");

  it("rejects malformed record and action identifiers before database access", () => {
    expect(detailLoader).toContain("z.string().uuid().safeParse(id)");
    expect(continuationLoader).toContain("z.string().uuid().safeParse(snapshotId)");
    expect(recordRoute).toContain("plateRecordIdSchema.safeParse(params.id)");
    expect(actionRoute).toContain("plateActionIdSchema.safeParse(params.id)");
    expect(reviewRoute).toContain("plateActionIdSchema.safeParse(params.id)");
  });

  it("keeps all record-flow click targets at least 44px high", () => {
    for (const selector of [
      ".plate-save-action > button",
      ".plate-save-feedback a",
      ".me-archive-row-actions > a",
      ".plate-record-delete-trigger",
      ".plate-record-delete-confirm",
      ".plate-record-delete-cancel",
      ".plate-continuation-notice > div:last-child > a",
      ".plate-continuation-actions a",
      ".plate-action-panel.is-start > button",
      ".plate-action-controls button",
      ".plate-action-restart",
      ".plate-action-dismissed button",
      ".plate-review-form fieldset label",
      ".plate-review-form > button",
      ".plate-record-footer-actions > a"
    ]) {
      expect(css).toMatch(
        new RegExp(`${selector.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[^}]*min-h-11`)
      );
    }
  });

  it("keeps busy/live feedback and duplicate-request guards in every mutation control", () => {
    expect(saveControl).toContain('aria-live="polite"');
    expect(saveControl).toContain("requestInFlight.current");
    expect(actionPanel).toContain('aria-live="polite"');
    expect(actionPanel).toContain("actionBusy.current");
    expect(actionPanel).toContain("reviewBusy.current");
    expect(deleteControl).toContain('aria-live="polite"');
    expect(deleteControl).toContain("deleting.current");
  });
});
