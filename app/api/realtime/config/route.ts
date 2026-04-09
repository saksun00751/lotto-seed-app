import { NextResponse } from "next/server";
import { getLangCookie } from "@/lib/session/cookies";
import { buildApiHeaders, getApiBaseUrl } from "@/lib/api/server-proxy";

export async function GET() {
  try {
    const lang = await getLangCookie();
    const res = await fetch(`${getApiBaseUrl()}/realtime/config`, {
      method: "GET",
      headers: buildApiHeaders(undefined, lang),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
