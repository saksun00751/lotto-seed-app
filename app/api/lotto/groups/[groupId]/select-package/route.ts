import { NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiPost } from "@/lib/api/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const apiToken = await getApiToken();
  if (!apiToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const lang = await getLangCookie();
  const body = await req.json();
  const data = await apiPost(`/lotto/groups/${groupId}/select-package`, body, apiToken, lang);
  return NextResponse.json(data);
}
