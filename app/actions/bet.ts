"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/session/auth";
import type { BillRow, BetTypeId } from "@/components/bet/types";

// Frontend BetTypeId → DB bet_type string (used in lotto_ticket_items.bet_type)
const TOP_TYPE: Partial<Record<BetTypeId, string>> = {
  "3top": "top3", "3tod": "tod3", "2top": "top2",
  "6perm": "top3", "19door": "top2", "run": "run_top", "winnum": "top2",
};
const BOT_TYPE: Partial<Record<BetTypeId, string>> = {
  "2top": "bot2", "2bot": "bot2", "19door": "bot2", "winlay": "run_bot", "winnum": "bot2",
};

// ticket bet_type → lotto_rate_plan_items.bet_type (DB uses different naming)
const RATE_TYPE: Record<string, string> = {
  top3: "top_3", tod3: "tod_3", top2: "top_2", bot2: "bottom_2",
  run_top: "run_top", run_bot: "run_bottom",
};

export type BetResult = { ok: true } | { ok: false; error: string };

export async function confirmBet(
  marketCode: string,
  bills: BillRow[],
): Promise<BetResult> {
  if (!bills.length) return { ok: false, error: "ไม่มีรายการแทง" };

  const user = await requireAuth();
  const memberCode = parseInt(user.id, 10);

  const totalAmount = bills.reduce((s, b) => s + b.top + b.bot, 0);
  if (totalAmount <= 0) return { ok: false, error: "ยอดแทงต้องมากกว่า 0" };

  // หา draw ที่ open ของ market นั้น
  const draw = await prisma.lotto_draws.findFirst({
    where: {
      status:        "open",
      lotto_markets: { code: marketCode },
    },
    orderBy: { close_at: "asc" },
  });
  if (!draw) return { ok: false, error: "ไม่พบงวดที่เปิดรับแทง" };
  if (draw.close_at < new Date()) return { ok: false, error: "งวดนี้ปิดรับแทงแล้ว" };

  // ดึง bet settings + rate plan สำหรับ market นี้
  const market = await prisma.lotto_markets.findUnique({
    where:   { code: marketCode },
    include: {
      lotto_market_bet_settings: true,
      lotto_groups: {
        include: {
          lotto_rate_plans: {
            where:   { is_enabled: true },
            take:    1,
            include: { lotto_rate_plan_items: true },
          },
        },
      },
    },
  });
  if (!market) return { ok: false, error: "ไม่พบข้อมูลหวยนี้" };

  const settingsMap = new Map(
    market.lotto_market_bet_settings.map((s) => [s.bet_type, s])
  );
  const ratePlan  = market.lotto_groups.lotto_rate_plans[0];
  // rate_plan_items ใช้ชื่อ bet_type ต่างกัน (top_3, bottom_2 ฯลฯ) → map ผ่าน RATE_TYPE
  const payoutMap = new Map(
    (ratePlan?.lotto_rate_plan_items ?? []).map((r) => [r.bet_type, Number(r.payout)])
  );
  const getPayout = (dbType: string) =>
    payoutMap.get(RATE_TYPE[dbType] ?? dbType) ?? 0;

  // ตรวจสอบทุก bill (ข้าม validation ถ้าไม่มี settings สำหรับ type นั้น)
  for (const b of bills) {
    const topDbType = TOP_TYPE[b.betType];
    const botDbType = BOT_TYPE[b.betType];

    if (topDbType && b.top > 0) {
      const setting = settingsMap.get(topDbType);
      if (setting) {
        if (!setting.is_enabled) return { ok: false, error: `ประเภท ${topDbType} ปิดรับแทง` };
        if (b.top < Number(setting.min_bet)) return { ok: false, error: `ยอดแทงขั้นต่ำ ${setting.min_bet} บาท (เลข ${b.number})` };
        if (b.top > Number(setting.max_bet)) return { ok: false, error: `ยอดแทงสูงสุด ${setting.max_bet} บาท (เลข ${b.number})` };
      }
    }
    if (botDbType && b.bot > 0) {
      const setting = settingsMap.get(botDbType);
      if (setting) {
        if (!setting.is_enabled) return { ok: false, error: `ประเภท ${botDbType} ปิดรับแทง` };
        if (b.bot < Number(setting.min_bet)) return { ok: false, error: `ยอดแทงขั้นต่ำ ${setting.min_bet} บาท (เลข ${b.number})` };
        if (b.bot > Number(setting.max_bet)) return { ok: false, error: `ยอดแทงสูงสุด ${setting.max_bet} บาท (เลข ${b.number})` };
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // ล็อคและตรวจ balance
      const freshMember = await tx.members.findUniqueOrThrow({
        where:  { code: memberCode },
        select: { balance: true },
      });
      const balance = Number(freshMember.balance);
      if (balance < totalAmount) {
        throw new Error(`ยอดเงินไม่เพียงพอ (มี ฿${balance.toLocaleString("th-TH")})`);
      }

      const now = new Date();

      // Group bills by slipNo → สร้าง lotto_ticket ต่อ slip
      const slipGroups = bills.reduce<Record<string, BillRow[]>>((acc, b) => {
        (acc[b.slipNo] ??= []).push(b);
        return acc;
      }, {});

      for (const items of Object.values(slipGroups)) {
        const slipTotal = items.reduce((s, b) => s + b.top + b.bot, 0);

        const ticket = await tx.lotto_tickets.create({
          data: {
            member_id:    memberCode,
            draw_id:      draw.id,
            total_amount: slipTotal,
            status:       "active",
            created_at:   now,
            updated_at:   now,
          },
        });

        for (const b of items) {
          const topDbType = TOP_TYPE[b.betType];
          const botDbType = BOT_TYPE[b.betType];

          if (topDbType && b.top > 0) {
            await tx.lotto_ticket_items.create({
              data: {
                ticket_id:      ticket.id,
                bet_type:       topDbType,
                number:         b.number,
                amount:         b.top,
                payout_at_time: getPayout(topDbType),
                created_at:     now,
                updated_at:     now,
              },
            });
          }
          if (botDbType && b.bot > 0) {
            await tx.lotto_ticket_items.create({
              data: {
                ticket_id:      ticket.id,
                bet_type:       botDbType,
                number:         b.number,
                amount:         b.bot,
                payout_at_time: getPayout(botDbType),
                created_at:     now,
                updated_at:     now,
              },
            });
          }
        }
      }

      // หักยอดเงิน
      await tx.members.update({
        where: { code: memberCode },
        data:  { balance: { decrement: totalAmount } },
      });
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
    return { ok: false, error: msg };
  }
}
