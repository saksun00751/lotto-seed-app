import { NextRequest, NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiPost, ApiError } from "@/lib/api/client";

interface PromotionSelectRequest {
  promotion?: string;
}

interface PromotionSelectResponse {
  success?: boolean;
  message?: string;
}

export async function POST(req: NextRequest) {
  const token = await getApiToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  let body: PromotionSelectRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const promotion = typeof body.promotion === "string" ? body.promotion.trim() : "";
  if (!promotion) {
    return NextResponse.json({ success: false, message: "ไม่พบรหัสโปรโมชั่น" }, { status: 400 });
  }

  const lang = await getLangCookie();
  try {
    const res = await apiPost<PromotionSelectResponse>(
      "/promotion/select",
      { promotion },
      token,
      lang,
    );
    return NextResponse.json(res);
  } catch (e) {
    const message = e instanceof ApiError ? e.message : "ไม่สามารถรับโปรโมชั่นได้";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
