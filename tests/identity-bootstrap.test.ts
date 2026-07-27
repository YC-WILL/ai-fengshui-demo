import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { middleware } from "@/middleware";
import {
  USER_IDENTITY_COOKIE_NAME,
  isValidUserIdentityId
} from "@/lib/identityCookie";

const middlewareSource = readFileSync("src/middleware.ts", "utf8");
const authSource = readFileSync("src/lib/auth.ts", "utf8");

describe("anonymous identity middleware", () => {
  it("does not import Prisma and excludes framework and static assets", () => {
    expect(middlewareSource).not.toMatch(/Prisma|@\/lib\/auth|@\/lib\/db/);
    for (const excluded of ["_next/static", "_next/image", "favicon.ico", "woff2?"]) {
      expect(middlewareSource).toContain(excluded);
    }
  });

  it("keeps an existing CUID without replacing it", () => {
    const existing = "cm12345678901234567890123";
    const request = new NextRequest("http://localhost/me", {
      headers: { cookie: `${USER_IDENTITY_COOKIE_NAME}=${existing}` }
    });
    const response = middleware(request);
    expect(response.cookies.get(USER_IDENTITY_COOKIE_NAME)).toBeUndefined();
    expect(request.cookies.get(USER_IDENTITY_COOKIE_NAME)?.value).toBe(existing);
  });

  it("sets one valid ID on both the downstream request and response", () => {
    const request = new NextRequest("http://localhost/me");
    const response = middleware(request);
    const requestId = request.cookies.get(USER_IDENTITY_COOKIE_NAME)?.value;
    const responseId = response.cookies.get(USER_IDENTITY_COOKIE_NAME)?.value;
    expect(isValidUserIdentityId(requestId)).toBe(true);
    expect(responseId).toBe(requestId);
  });

  it("replaces malformed and oversized IDs before database code can see them", () => {
    const malformed = "x".repeat(200);
    const request = new NextRequest("http://localhost/api/me", {
      headers: { cookie: `${USER_IDENTITY_COOKIE_NAME}=${malformed}` }
    });
    const response = middleware(request);
    const replacement = response.cookies.get(USER_IDENTITY_COOKIE_NAME)?.value;
    expect(isValidUserIdentityId(replacement)).toBe(true);
    expect(replacement).not.toBe(malformed);
    expect(request.cookies.get(USER_IDENTITY_COOKIE_NAME)?.value).toBe(replacement);
  });

  it("does not bootstrap a replacement during account deletion", () => {
    const request = new NextRequest("http://localhost/api/me", { method: "DELETE" });
    const response = middleware(request);
    expect(request.cookies.get(USER_IDENTITY_COOKIE_NAME)).toBeUndefined();
    expect(response.cookies.get(USER_IDENTITY_COOKIE_NAME)).toBeUndefined();
  });
});

describe("database identity bootstrap source boundary", () => {
  it("never creates a User without the stable cookie ID and never writes cookies in RSC", () => {
    expect(authSource).toContain("VALUES (${identityId}, CURRENT_TIMESTAMP)");
    expect(authSource).not.toContain("prisma.user.create({ data: {}");
    expect(authSource).not.toContain("cookies().set");
    expect(authSource).not.toContain("store.set(");
    expect(authSource).toContain('ON CONFLICT ("id") DO NOTHING');
  });
});
