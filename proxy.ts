import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["th", "en", "kh", "la", "my"];
const DEFAULT_LOCALE = "th";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  if (LOCALES.includes(firstSegment)) {
    const res = NextResponse.next();
    res.cookies.set("lotto_lang", firstSegment, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return res;
  }

  const cookieLang = req.cookies.get("lotto_lang")?.value;
  const locale = LOCALES.includes(cookieLang ?? "") ? cookieLang : DEFAULT_LOCALE;
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|favicon|api|.*\\..*).*)"],
};
