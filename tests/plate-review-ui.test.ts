import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  buildReviewSubmission,
  normalizeReviewNote,
  type ReviewIntent
} from "@/components/PlateActionPanel";

const panel = readFileSync("src/components/PlateActionPanel.tsx", "utf8");
const UUID_A = "e0000000-0000-4000-8000-000000000001";
const UUID_B = "e0000000-0000-4000-8000-000000000002";

describe("plate review request lifecycle", () => {
  it("trims note, omits an empty note, and maps all three outcomes", () => {
    expect(normalizeReviewNote("  一句话  ")).toBe("一句话");
    expect(normalizeReviewNote("   ")).toBeUndefined();
    for (const outcome of ["helpful", "mixed", "not_helpful"] as const) {
      const result = buildReviewSubmission(null, outcome, "  ", () => UUID_A);
      expect(result.payload).toEqual({ requestId: UUID_A, outcome });
    }
  });

  it("creates a stable UUID for a new review intent and reuses it after failure", () => {
    const createUuid = vi.fn(() => UUID_A);
    const first = buildReviewSubmission(null, "helpful", "有用", createUuid);
    expect(first.intent.requestId).toBe(UUID_A);
    expect(createUuid).toHaveBeenCalledOnce();

    const retryUuid = vi.fn(() => UUID_B);
    const retry = buildReviewSubmission(first.intent, "helpful", " 有用 ", retryUuid);
    expect(retry.intent).toEqual(first.intent);
    expect(retry.payload.requestId).toBe(UUID_A);
    expect(retryUuid).not.toHaveBeenCalled();
  });

  it("creates a new UUID when outcome or note changes", () => {
    const current: ReviewIntent = {
      requestId: UUID_A,
      signature: JSON.stringify({ outcome: "helpful", note: "原备注" })
    };
    expect(buildReviewSubmission(current, "mixed", "原备注", () => UUID_B).payload.requestId).toBe(UUID_B);
    expect(buildReviewSubmission(current, "helpful", "新备注", () => UUID_B).payload.requestId).toBe(UUID_B);
  });

  it("clears the successful intent and input while keeping failed input", () => {
    expect(panel).toContain("reviewIntent.current = null");
    expect(panel).toContain("setOutcome(null)");
    expect(panel).toContain('setNote("")');
    expect(panel).toContain("复盘内容仍保留在这里");
    expect(panel).toContain("reviewIntent.current = submission.intent");
  });
});

describe("plate review UI", () => {
  it("only shows the form for completed actions and remains append-only", () => {
    expect(panel).toContain('action.status === "completed"');
    expect(panel).toContain("这个行动对你有帮助吗？");
    expect(panel).toContain("补充一句（可选）");
    expect(panel).toContain("maxLength={300}");
    expect(panel).toContain("保存这次复盘");
    expect(panel).not.toContain('method: "DELETE"');
    expect(panel).not.toContain('method: "PUT"');
  });

  it("guards duplicate submission and reports busy and live states accessibly", () => {
    expect(panel).toContain("if (!action || !outcome || reviewBusy.current) return");
    expect(panel).toContain('aria-busy={busyKind === "review"}');
    expect(panel).toContain('aria-live="polite"');
    expect(panel).toContain("正在保存复盘…");
    expect(panel).toContain('type="radio"');
  });

  it("renders ordered history without edit or delete controls", () => {
    expect(panel).toContain("action.reviews");
    expect(panel).toContain("<ol>");
    expect(panel).toContain("review.outcome");
    expect(panel).toContain("review.note");
    expect(panel).toContain("review.createdAt");
    expect(panel).not.toMatch(/编辑复盘|删除复盘/);
  });
});
