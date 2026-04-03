import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ marketId: string }> }
) {
  const apiToken = await getApiToken();
  if (!apiToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { marketId } = await params;
  const lang = await getLangCookie();
  const data = await apiGet(`/lotto/markets/${marketId}/betting-context`, apiToken, lang);
  return NextResponse.json(data);
}
