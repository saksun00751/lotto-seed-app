import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet, ApiError } from "@/lib/api/client";

export async function GET() {
  const token = await getApiToken();
  if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const lang = await getLangCookie();
  try {
    const data = await apiGet("/member/loadbalance", token, lang);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof ApiError ? e.message : "ไม่สามารถโหลดข้อมูลสมาชิกได้";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
