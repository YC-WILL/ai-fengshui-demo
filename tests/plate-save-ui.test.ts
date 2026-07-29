import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  buildPlateSavePayload,
  INITIAL_PLATE_SAVE_STATE,
  nextPlateSaveRequestId,
  PlateSaveControl,
  plateSaveReducer,
  stablePlateSaveKey
} from "@/components/PlateSaveControl";

const UUID_A = "a0000000-0000-4000-8000-000000000001";
const UUID_B = "a0000000-0000-4000-8000-000000000002";

describe("PlateSaveControl request lifecycle", () => {
  it("creates a UUID only for a new explicit save intent", () => {
    const createUuid = vi.fn(() => crypto.randomUUID());
    const requestId = nextPlateSaveRequestId(INITIAL_PLATE_SAVE_STATE, createUuid);
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(createUuid).toHaveBeenCalledOnce();
  });

  it("blocks a second request while saving and after success", () => {
    const saving = plateSaveReducer(INITIAL_PLATE_SAVE_STATE, {
      type: "start",
      requestId: UUID_A
    });
    expect(nextPlateSaveRequestId(saving, () => UUID_B)).toBeNull();
    const success = plateSaveReducer(saving, { type: "success" });
    expect(nextPlateSaveRequestId(success, () => UUID_B)).toBeNull();
    expect(success).toMatchObject({
      phase: "success",
      requestId: UUID_A,
      message: "这次查看已保存为独立快照"
    });
  });

  it("reuses requestId after failure and creates a new one after resetKey reset", () => {
    const saving = plateSaveReducer(INITIAL_PLATE_SAVE_STATE, {
      type: "start",
      requestId: UUID_A
    });
    const failed = plateSaveReducer(saving, {
      type: "error",
      message: "网络暂时没有连上，这次查看还没有保存。"
    });
    const createUuid = vi.fn(() => UUID_B);
    expect(nextPlateSaveRequestId(failed, createUuid)).toBe(UUID_A);
    expect(createUuid).not.toHaveBeenCalled();

    const reset = plateSaveReducer(failed, { type: "reset" });
    expect(nextPlateSaveRequestId(reset, createUuid)).toBe(UUID_B);
    expect(createUuid).toHaveBeenCalledOnce();
  });

  it("builds the exact POST envelope without trusted server fields", () => {
    const payload = buildPlateSavePayload(UUID_A, "BAZI", {});
    expect(payload).toEqual({
      requestId: UUID_A,
      plateType: "BAZI",
      input: {}
    });
    expect(payload).not.toHaveProperty("resultSnapshot");
    expect(payload).not.toHaveProperty("actionData");
    expect(payload).not.toHaveProperty("userId");
    expect(payload).not.toHaveProperty("protocolVersion");
    expect(payload).not.toHaveProperty("profile");
  });

  it("uses stable serialization for HOME object and issue ordering", () => {
    const first = {
      areas: {
        rest: { reviewed: true, issues: ["rest_persistent_noise"] },
        entry: { reviewed: true, issues: ["entry_dim", "entry_clutter"] }
      }
    };
    const second = {
      areas: {
        entry: { issues: ["entry_clutter", "entry_dim"], reviewed: true },
        rest: { issues: ["rest_persistent_noise"], reviewed: true }
      }
    };
    expect(stablePlateSaveKey(first)).toBe(stablePlateSaveKey(second));
  });

  it("renders disabled reason and accessibility status without sending a request", () => {
    const markup = renderToStaticMarkup(
      createElement(PlateSaveControl, {
        plateType: "HOME",
        input: { areas: {} },
        resetKey: "empty-home",
        disabled: true,
        disabledReason: "至少确认一处真实空间情况后才能保存"
      })
    );
    expect(markup).toContain("保存这次查看");
    expect(markup).toContain("至少确认一处真实空间情况后才能保存");
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-busy="false"');
    expect(markup).toContain("disabled");
  });
});

describe("four plate save integration", () => {
  const source = readFileSync("src/components/MethodWorkspaces.tsx", "utf8");
  const controlSource = readFileSync("src/components/PlateSaveControl.tsx", "utf8");
  const bazi = source.slice(
    source.indexOf("export function BaziWorkspace"),
    source.indexOf("export function RelationWorkspace")
  );
  const relation = source.slice(
    source.indexOf("export function RelationWorkspace"),
    source.indexOf("const ROOMS")
  );
  const home = source.slice(
    source.indexOf("export function HomeWorkspace"),
    source.indexOf("export function TimingWorkspace")
  );
  const timing = source.slice(source.indexOf("export function TimingWorkspace"));

  it("mounts exactly one save control after each plate's result content", () => {
    expect(source.match(/<PlateSaveControl/g)).toHaveLength(4);
    expect(bazi.indexOf("<ProfessionalBaziPanel")).toBeLessThan(bazi.indexOf("<PlateSaveControl"));
    expect(relation.indexOf("relationship-method")).toBeLessThan(relation.indexOf("<PlateSaveControl"));
    expect(home.indexOf("home-professional-placeholder")).toBeLessThan(home.indexOf("<PlateSaveControl"));
    expect(timing.indexOf("timing-selected-detail")).toBeLessThan(timing.indexOf("<PlateSaveControl"));
  });

  it("submits empty BAZI input and resets from visible profile fields", () => {
    expect(bazi).toContain('plateType="BAZI"');
    expect(bazi).toContain("input={{}}");
    for (const field of [
      "gender",
      "birthDate",
      "birthTime",
      "birthLocation",
      "timezone",
      "unknownTime"
    ]) {
      expect(bazi).toContain(`${field}: profile.${field}`);
    }
  });

  it("normalizes optional relationship nickname and shows the privacy boundary", () => {
    expect(relation).toContain("称呼或昵称（可选）");
    expect(relation).toContain("maxLength={40}");
    expect(relation).not.toContain("姓名");
    expect(relation).toContain("otherNickname.trim()");
    expect(relation).toContain('disabled={!facts}');
    expect(relation).toContain("填写有效的另一人出生日期并生成互动结果后才能保存");
    expect(relation).toContain("只有点击保存后，另一人的出生日期和可选昵称才会保存到当前浏览器对应的账号记录中。");
  });

  it("sends current HOME areas and disables saving before any area is confirmed", () => {
    expect(home).toContain('plateType="HOME"');
    expect(home).toContain("input={{ areas: input }}");
    expect(home).toContain("stablePlateSaveKey({ areas: input })");
    expect(home).toContain("assessment.reviewedAreas.length === 0");
    expect(home).toContain("至少确认一处真实空间情况后才能保存");
  });

  it("keeps original TIMING startDate/range and only sends a real selected date", () => {
    expect(timing).toContain('plateType="TIMING"');
    expect(timing).toContain("const startDate = continuation?.startDate ?? today");
    expect(timing).toContain("startDate,");
    expect(timing).toContain("rangeDays: range");
    expect(timing).toContain("selected?.date ? { selectedDate: selected.date } : {}");
    expect(timing).toContain('disabled={!profile || !selection}');
    expect(timing).not.toContain("new Date()");
  });

  it("has no automatic save and calls only the snapshot API", () => {
    expect(controlSource.match(/fetch\("/g)).toHaveLength(1);
    expect(controlSource).toContain('fetch("/api/plate-records"');
    expect(controlSource).toContain("onClick={save}");
    expect(controlSource).not.toContain("/api/plate-actions");
    expect(controlSource).not.toContain("/api/reports");
    expect(source).not.toContain("/api/plate-actions");
    expect(source).not.toContain("/api/reports");
  });

  it("keeps current input in place and reports save state accessibly", () => {
    expect(controlSource).toContain('aria-busy={isSaving}');
    expect(controlSource).toContain('aria-live="polite"');
    expect(controlSource).toContain("正在保存…");
    expect(controlSource).toContain("重新尝试");
    expect(controlSource).toContain("body.error");
    expect(controlSource).toContain("前往我的");
    expect(controlSource).not.toMatch(/永久保存|云端同步|跨设备恢复|生成报告/);
  });
});
