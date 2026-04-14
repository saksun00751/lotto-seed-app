import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiPost, ApiError } from "@/lib/api/client";

interface PromotionDeselectResponse {
  success?: boolean;
  message?: string;
}

export async function POST() {
  const token = await getApiToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const lang = await getLangCookie();
  try {
    const res = await apiPost<PromotionDeselectResponse>(
      "/promotion/deselect",
      {},
      token,
      lang,
    );
    return NextResponse.json(res);
  } catch (e) {
    const message = e instanceof ApiError ? e.message : "ไม่สามารถยกเลิกโปรโมชั่นได้";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
