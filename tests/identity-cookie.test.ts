import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  USER_IDENTITY_COOKIE_MAX_AGE,
  USER_IDENTITY_COOKIE_NAME,
  createUserIdentityId,
  expiredIdentityCookieOptions,
  identityCookieOptions,
  isValidUserIdentityId
} from "@/lib/identityCookie";

const authSource = readFileSync("src/lib/auth.ts", "utf8");
const cookieSource = readFileSync("src/lib/identityCookie.ts", "utf8");
const meRouteSource = readFileSync("src/app/api/me/route.ts", "utf8");

describe("anonymous identity cookie", () => {
  it("uses a shared name and the established lifetime", () => {
    expect(USER_IDENTITY_COOKIE_NAME).toBe("guoxue_uid");
    expect(USER_IDENTITY_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
    expect(authSource).not.toContain("store.set(");
    expect(meRouteSource).toContain("USER_IDENTITY_COOKIE_NAME");
  });

  it("is httpOnly, lax, root scoped, and secure only in production", () => {
    expect(identityCookieOptions("production")).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: USER_IDENTITY_COOKIE_MAX_AGE,
      path: "/"
    });
    expect(identityCookieOptions("test")).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/"
    });
  });

  it("expires with compatible attributes", () => {
    const expired = expiredIdentityCookieOptions("production");
    expect(expired).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 0
    });
    expect(expired.expires.getTime()).toBe(0);
  });

  it("does not expose the identity through readable browser storage or /api/me", () => {
    expect(`${authSource}\n${cookieSource}`).not.toMatch(/localStorage|sessionStorage|document\\.cookie/);
    expect(meRouteSource).toContain("user: { email: user.email, nickname: user.nickname }");
    expect(meRouteSource).not.toContain("user: { id: user.id");
    expect(authSource).not.toMatch(/console\\.|logger\\./);
  });

  it("accepts existing Prisma CUIDs and generated UUIDs, but rejects unsafe values", () => {
    expect(isValidUserIdentityId("cm12345678901234567890123")).toBe(true);
    const generated = createUserIdentityId();
    expect(isValidUserIdentityId(generated)).toBe(true);
    for (const value of ["", " user-id ", "anonymous-user-a", "a".repeat(200), "../user"]) {
      expect(isValidUserIdentityId(value)).toBe(false);
    }
  });
});
