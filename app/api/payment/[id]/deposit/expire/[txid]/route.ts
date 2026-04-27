import { NextRequest, NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiPost, ApiError } from "@/lib/api/client";

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; txid: string }> },
) {
  void req;
  const token = await getApiToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { id, txid } = await params;
  const providerId = id.trim();
  const tx = txid.trim();
  if (!providerId || !ID_PATTERN.test(providerId)) {
    return NextResponse.json({ success: false, message: "provider id ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!tx) {
    return NextResponse.json({ success: false, message: "ไม่พบ txid" }, { status: 400 });
  }

  const lang = await getLangCookie();
  try {
    const data = await apiPost<Record<string, unknown>>(
      `/${providerId}/deposit/expire/${encodeURIComponent(tx)}`,
      {},
      token,
      lang,
    );
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.payload && typeof e.payload === "object") {
        return NextResponse.json(e.payload, { status: e.status || 400 });
      }
      return NextResponse.json({ success: false, message: e.message }, { status: e.status || 400 });
    }
    return NextResponse.json({ success: false, message: "ไม่สามารถปิดรายการฝากเงินได้" }, { status: 500 });
  }
}
