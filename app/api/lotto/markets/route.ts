import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet, ApiError } from "@/lib/api/client";
import type { MarketsLatestResponse } from "@/lib/api/lotto";

export async function GET() {
  const apiToken = await getApiToken();
  if (!apiToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const lang = await getLangCookie();
  try {
    const data = await apiGet<MarketsLatestResponse>("/lotto/markets/latest", apiToken, lang);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : "ไม่สามารถดึงข้อมูล Markets ได้";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
