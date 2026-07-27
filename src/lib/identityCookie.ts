// Edge-safe anonymous identity cookie helpers.
// Keep this module free of Prisma and other Node-only dependencies so middleware can use it.

export const USER_IDENTITY_COOKIE_NAME = "guoxue_uid";
export const USER_IDENTITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const CUID_PATTERN = /^c[a-z0-9]{24}$/;
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUserIdentityId(value: string | null | undefined): value is string {
  if (!value) return false;
  return CUID_PATTERN.test(value) || UUID_V4_PATTERN.test(value);
}

export function createUserIdentityId(): string {
  return crypto.randomUUID();
}

export function identityCookieOptions(nodeEnv: string | undefined = process.env.NODE_ENV) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: nodeEnv === "production",
    maxAge: USER_IDENTITY_COOKIE_MAX_AGE,
    path: "/"
  };
}

export function expiredIdentityCookieOptions(nodeEnv: string | undefined = process.env.NODE_ENV) {
  return {
    ...identityCookieOptions(nodeEnv),
    maxAge: 0,
    expires: new Date(0)
  };
}
