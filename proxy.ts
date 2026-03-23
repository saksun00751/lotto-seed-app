/**
 * proxy.ts  (Next.js Proxy — previously middleware)
 *
 * Protects authenticated routes by checking for the session cookie.
 * Note: MariaDB queries cannot run in Edge runtime, so we only check
 * cookie presence here.  The Server Actions/Server Components validate
 * the session token against the DB.
 */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session/cookies";

// Routes that require a logged-in session
const PROTECTED = [
  "/",
  "/dashboard", "/bet", "/profile",
  "/history", "/transactions",
  "/deposit", "/withdraw","/spin",
  "/change-password", "/notifications", "/security",
];

// Routes that logged-in users should not see (redirect to dashboard)
const AUTH_ONLY = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // ตรวจสอบว่าเป็นหน้าที่มีการป้องกันหรือไม่ (รองรับ "/" ให้ไม่ทับซ้อนกับหน้าอื่น)
  const isProtected = PROTECTED.some((p) => 
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
  const isAuthOnly  = AUTH_ONLY.some((p)  => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ถ้ามี token แต่เข้าหน้า login/register ให้ส่งไป dashboard
  // ยกเว้นกรณีที่มีการระบุ error หรือ expired เพื่อป้องกัน redirect loop
  if (isAuthOnly && token && !request.nextUrl.searchParams.has("expired")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png).*)",
  ],
};
