import { NextRequest, NextResponse } from "next/server";
import {
  USER_IDENTITY_COOKIE_NAME,
  createUserIdentityId,
  identityCookieOptions,
  isValidUserIdentityId
} from "@/lib/identityCookie";

export function middleware(request: NextRequest) {
  const existingId = request.cookies.get(USER_IDENTITY_COOKIE_NAME)?.value;
  if (isValidUserIdentityId(existingId)) {
    return NextResponse.next();
  }

  // A deletion request without a usable identity must not bootstrap a replacement.
  if (request.method === "DELETE" && request.nextUrl.pathname === "/api/me") {
    return NextResponse.next();
  }

  const identityId = createUserIdentityId();

  // Propagate the same ID to Server Components and Route Handlers in this request.
  request.cookies.set(USER_IDENTITY_COOKIE_NAME, identityId);
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  // Persist that exact ID for the browser's following requests.
  response.cookies.set(USER_IDENTITY_COOKIE_NAME, identityId, identityCookieOptions());
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff2?|ttf|otf)$).*)"
  ]
};
