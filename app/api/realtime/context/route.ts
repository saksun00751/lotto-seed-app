import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { buildApiHeaders, getApiBaseUrl } from "@/lib/api/server-proxy";

export async function GET() {
  try {
    const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${getApiBaseUrl()}/member/realtime-context`, {
      method: "GET",
      headers: buildApiHeaders(token, lang),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
