import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";

export async function GET() {
  const token = await getApiToken();
  const lang  = await getLangCookie();

  if (!token) return NextResponse.json({ success: false }, { status: 401 });

  try {
    let data: unknown;
    try {
      data = await apiGet("/member/balance", token, lang);
    } catch {
      data = await apiGet("/member/loadbalance", token, lang);
    }
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
