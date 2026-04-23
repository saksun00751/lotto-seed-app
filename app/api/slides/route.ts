import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";

export async function GET() {
  const token = await getApiToken();
  const lang  = await getLangCookie();

  try {
    const data = await apiGet("/slides", token ?? undefined, lang);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
