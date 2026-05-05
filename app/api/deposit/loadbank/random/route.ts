import { NextRequest, NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiPost, ApiError } from "@/lib/api/client";
import type { LoadBankResponse } from "../route";

export async function POST(req: NextRequest) {
  const token = await getApiToken();
  if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  let body: { method: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const lang = await getLangCookie();
  try {
    const data = await apiPost<LoadBankResponse>(
      "/deposit/loadbank/random",
      { method: body.method },
      token,
      lang,
    );
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof ApiError ? e.message : "ไม่สามารถโหลดบัญชีรับเงินได้";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
