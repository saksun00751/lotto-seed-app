"use server";

import { requireAuth } from "@/lib/session/auth";
import { getSlipDetail } from "@/lib/db/bets";
import type { BetSlipDetail } from "@/lib/db/bets";

export async function fetchSlipDetail(slipId: string): Promise<BetSlipDetail | null> {
  const user = await requireAuth();
  return getSlipDetail(slipId, user.id);
}
