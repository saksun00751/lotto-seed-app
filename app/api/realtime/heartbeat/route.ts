import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { buildApiHeaders, getApiBaseUrl } from "@/lib/api/server-proxy";

export async function POST() {
  try {
    const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${getApiBaseUrl()}/member/heartbeat`, {
      method: "POST",
      headers: buildApiHeaders(token, lang, { "Content-Type": "application/json" }),
      body: "{}",
      cache: "no-store",
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") ?? "application/json";
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": contentType } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
