import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet, ApiError } from "@/lib/api/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const apiToken = await getApiToken();
  if (!apiToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const lang = await getLangCookie();
  try {
    const data = await apiGet(`/lotto/groups/${groupId}/selected-package`, apiToken, lang);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : "ไม่สามารถดึงข้อมูล Package ได้";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
