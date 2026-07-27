// ============================================================
// 当前浏览器匿名身份
//
// httpOnly cookie 中保存服务端使用的 userId（首次访问自动创建匿名 User）。
// 邮箱只是未验证的账户资料，不提供登录、找回或跨设备恢复能力。
// ============================================================

import { cookies } from "next/headers";
import { prisma } from "./db";
import {
  USER_IDENTITY_COOKIE_NAME,
  expiredIdentityCookieOptions,
  identityCookieOptions,
  isValidUserIdentityId
} from "./identityCookie";

export {
  USER_IDENTITY_COOKIE_MAX_AGE,
  USER_IDENTITY_COOKIE_NAME,
  expiredIdentityCookieOptions,
  identityCookieOptions
} from "./identityCookie";

export class IdentityInitializationError extends Error {
  constructor() {
    super("当前浏览器身份尚未完成初始化，请刷新页面后重试。");
    this.name = "IdentityInitializationError";
  }
}

export async function ensureUserForIdentity(
  identityId: string,
  client: Pick<typeof prisma, "user" | "$executeRaw"> = prisma
) {
  if (!isValidUserIdentityId(identityId)) {
    throw new IdentityInitializationError();
  }

  await client.$executeRaw`
    INSERT INTO "User" ("id", "updatedAt")
    VALUES (${identityId}, CURRENT_TIMESTAMP)
    ON CONFLICT ("id") DO NOTHING
  `;
  const user = await client.user.findUnique({
    where: { id: identityId },
    include: { profile: true }
  });
  if (user) return user;
  throw new IdentityInitializationError();
}

export async function getOrCreateUser() {
  const store = cookies();
  const identityId = store.get(USER_IDENTITY_COOKIE_NAME)?.value;
  if (!isValidUserIdentityId(identityId)) throw new IdentityInitializationError();
  return ensureUserForIdentity(identityId);
}

export async function getCurrentUserId(): Promise<string | null> {
  const store = cookies();
  const identityId = store.get(USER_IDENTITY_COOKIE_NAME)?.value;
  return isValidUserIdentityId(identityId) ? identityId : null;
}

export async function bindEmail(userId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("邮箱格式不正确");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { email: normalized }
  });
}
