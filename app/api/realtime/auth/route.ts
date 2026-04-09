import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { buildApiHeaders, getApiBaseUrl } from "@/lib/api/server-proxy";

export async function POST(req: Request) {
  try {
    const [token, lang, body] = await Promise.all([
      getApiToken(),
      getLangCookie(),
      req.text(),
    ]);

    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") ?? "application/x-www-form-urlencoded; charset=UTF-8";
    const res = await fetch(`${getApiBaseUrl()}/realtime/auth`, {
      method: "POST",
      headers: buildApiHeaders(token, lang, { "Content-Type": contentType }),
      body,
      cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
