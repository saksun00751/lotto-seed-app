import { NextRequest, NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";

export async function GET(req: NextRequest) {
  const drawDate = req.nextUrl.searchParams.get("draw_date");
  if (!drawDate) {
    return NextResponse.json({ success: false, message: "draw_date is required" }, { status: 400 });
  }

  const token = await getApiToken();
  const lang = await getLangCookie();
  if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const data = await apiGet(`/lotto/results/by-date?draw_date=${encodeURIComponent(drawDate)}`, token, lang);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "ไม่สามารถโหลดผลรางวัลได้";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

