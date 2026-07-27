import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteUser: vi.fn(),
  getCurrentUserId: vi.fn(),
  getOrCreateUser: vi.fn(),
  bindEmail: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      delete: mocks.deleteUser,
      update: vi.fn()
    },
    report: { findMany: vi.fn() },
    signDraw: { findMany: vi.fn() }
  }
}));

vi.mock("@/lib/auth", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    getCurrentUserId: mocks.getCurrentUserId,
    getOrCreateUser: mocks.getOrCreateUser,
    bindEmail: mocks.bindEmail
  };
});

import { DELETE } from "@/app/api/me/route";

const routeSource = readFileSync("src/app/api/me/route.ts", "utf8");
const deleteUi = readFileSync("src/app/me/DeleteAccountButton.tsx", "utf8");
const drawer = readFileSync("src/app/me/AccountDrawer.tsx", "utf8");

describe("account deletion route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUserId.mockResolvedValue("anonymous-user-a");
    mocks.deleteUser.mockResolvedValue({ id: "anonymous-user-a" });
  });

  it("clears identity and membership cookies only after database deletion succeeds", async () => {
    const response = await DELETE();
    expect(response.status).toBe(200);
    expect(mocks.deleteUser).toHaveBeenCalledWith({ where: { id: "anonymous-user-a" } });
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("guoxue_uid=");
    expect(setCookie).toContain("guaan_membership=");
    expect(setCookie.toLowerCase()).toContain("path=/");
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
    expect(setCookie.toLowerCase()).toContain("max-age=0");
    expect(mocks.getOrCreateUser).not.toHaveBeenCalled();
  });

  it("keeps both cookies when database deletion fails", async () => {
    mocks.deleteUser.mockRejectedValueOnce(new Error("database details must stay private"));
    const response = await DELETE();
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({
      ok: false,
      error: "账户数据暂时无法删除，请稍后重试。"
    });
  });

  it("does not create a replacement user when no current identity exists", async () => {
    mocks.getCurrentUserId.mockResolvedValueOnce(null);
    const response = await DELETE();
    expect(response.status).toBe(404);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.getOrCreateUser).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("account deletion UI", () => {
  it("keeps confirmation, duplicate protection, loading, failure retry, and redirect", () => {
    expect(deleteUi).toContain("deleting.current");
    expect(deleteUi).toContain("if (deleting.current || !confirmed) return");
    expect(deleteUi).toContain("正在删除…");
    expect(deleteUi).toContain("数据和当前身份仍然保留，请稍后重试");
    expect(deleteUi).toContain('window.location.replace("/")');
    expect(deleteUi).toContain('aria-busy={busy}');
    expect(deleteUi).toContain('aria-live="polite"');
  });

  it("names every account-owned record category without calling it a four-plate report", () => {
    for (const phrase of ["生辰资料", "四盘记录", "行动与复盘", "求签记录", "旧报告"]) {
      expect(deleteUi).toContain(phrase);
      expect(drawer).toContain(phrase);
    }
    expect(deleteUi).not.toContain("四盘报告");
    expect(drawer).not.toContain("四盘报告");
    expect(routeSource).not.toContain("getOrCreateUser();\n    await prisma.user.delete");
  });
});
