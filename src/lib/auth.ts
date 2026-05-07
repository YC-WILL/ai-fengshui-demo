// ============================================================
// 匿名/邮箱用户会话
//
// MVP 简化方案：cookie 中保存 userId（首次访问自动创建匿名 User）。
// 用户可在「我的」页面绑定邮箱。生产请替换为真实鉴权（NextAuth、邮箱验证码等）。
// ============================================================

import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "guoxue_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 年

export async function getOrCreateUser() {
  const store = cookies();
  const existingId = store.get(COOKIE_NAME)?.value;

  if (existingId) {
    const user = await prisma.user.findUnique({
      where: { id: existingId },
      include: { profile: true }
    });
    if (user) return user;
  }

  const user = await prisma.user.create({ data: {}, include: { profile: true } });
  // Next.js 14: cookies() 在 Server Action / Route Handler 中可写
  try {
    store.set(COOKIE_NAME, user.id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/"
    });
  } catch {
    // 在 RSC 渲染阶段写 cookie 会抛错；MVP 阶段忽略，下个请求会重新尝试
  }
  return user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const store = cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
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
