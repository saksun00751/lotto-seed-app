import { NextRequest, NextResponse } from "next/server";
import { getTransactionsByTab } from "@/lib/server/transactions";

const ALLOWED_TYPES = new Set([
  "deposit",
  "withdraw",
  "transfer",
  "spin",
  "money",
  "cashback",
  "memberic",
  "bonus",
  "other",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ success: false, message: "invalid type" }, { status: 400 });
  }

  const dateStart = req.nextUrl.searchParams.get("date_start") ?? undefined;
  const dateStop = req.nextUrl.searchParams.get("date_stop") ?? undefined;

  try {
    const rows = await getTransactionsByTab("", type, { dateStart, dateStop });
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

