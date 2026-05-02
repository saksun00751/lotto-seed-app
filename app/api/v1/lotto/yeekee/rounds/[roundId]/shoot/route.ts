import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiPost, ApiError } from "@/lib/api/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roundId: string }> },
) {
  const apiToken = await getApiToken();
  if (!apiToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { roundId } = await params;
  const lang = await getLangCookie();
  const body = await req.json();

  try {
    const data = await apiPost(`/lotto/yeekee/rounds/${roundId}/shoot`, body, apiToken, lang);
    return NextResponse.json(data);
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500;
    const payload = e instanceof ApiError ? e.payload : undefined;
    const message = e instanceof ApiError ? e.message : "ยิงเลขไม่สำเร็จ";
    return NextResponse.json(payload ?? { success: false, message }, { status });
  }
}
