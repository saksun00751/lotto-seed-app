"use server";

import { apiPost, ApiError } from "@/lib/api/client";
import { requireAuth } from "@/lib/session/auth";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import type { BillRow, BetTypeId } from "@/components/bet/types";

export type BetResult =
  | { ok: true; message?: string; response?: unknown }
  | { ok: false; error: string; message?: string; response?: unknown };

interface BetItemPayload {
  bet_type: "top_3" | "tod_3" | "top_2" | "bottom_2" | "run_top" | "run_bottom";
  number: string;
  amount: number;
  note?: string;
}

const TOP_SIDE_MAP: Partial<Record<BetTypeId, BetItemPayload["bet_type"]>> = {
  "3top": "top_3",
  "3tod": "tod_3",
  "2top": "top_2",
  "2bot": "bottom_2",
  "run": "run_top",
  "winlay": "run_bottom",
  "6perm": "top_3",
  "19door": "top_2",
  "winnum": "top_2",
};

const BOT_SIDE_MAP: Partial<Record<BetTypeId, BetItemPayload["bet_type"]>> = {
  "3top": "tod_3",
  "3tod": "tod_3",
  "2top": "bottom_2",
  "2bot": "bottom_2",
  "run": "run_top",
  "winlay": "run_bottom",
  "6perm": "tod_3",
  "19door": "bottom_2",
  "winnum": "bottom_2",
};

function mapBillsToItems(bills: BillRow[]): BetItemPayload[] {
  return bills.flatMap((b) => {
    const rows: BetItemPayload[] = [];
    const note = b.note?.trim();
    const notePart = note ? { note } : {};

    const topType = TOP_SIDE_MAP[b.betType];
    if (topType && b.top > 0) {
      rows.push({
        bet_type: topType,
        number: b.number,
        amount: Number(b.top),
        ...notePart,
      });
    }

    const botType = BOT_SIDE_MAP[b.betType];
    if (botType && b.bot > 0) {
      rows.push({
        bet_type: botType,
        number: b.number,
        amount: Number(b.bot),
        ...notePart,
      });
    }

    return rows;
  });
}

export async function confirmBet(
  drawId: number | null | undefined,
  packageId: number | null | undefined,
  bills: BillRow[],
): Promise<BetResult> {
  if (!bills.length) return { ok: false, error: "ไม่มีรายการแทง" };
  if (!drawId) return { ok: false, error: "ไม่พบงวดหวยสำหรับการบันทึกโพย" };

  await requireAuth();
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  if (!token) return { ok: false, error: "ไม่พบ token สำหรับส่งโพย" };

  const items = mapBillsToItems(bills);
  if (!items.length) return { ok: false, error: "ไม่มีรายการที่บันทึกได้" };

  try {
    const res = await apiPost<Record<string, unknown>>(
      "/lotto/bet",
      {
        draw_id: drawId,
        package_id: packageId ?? null,
        items,
      },
      token,
      lang,
    );
    const message = typeof res?.message === "string" ? res.message : undefined;
    return { ok: true, message, response: res };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        error: err.message,
        message: err.message,
        response: err.payload ?? { success: false, message: err.message },
      };
    }
    return {
      ok: false,
      error: "เกิดข้อผิดพลาด กรุณาลองใหม่",
      response: { success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
    };
  }
}
