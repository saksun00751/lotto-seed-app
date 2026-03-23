import { prisma } from "./prisma";

export const BET_TYPE_LABEL: Record<string, string> = {
  top3:    "3 ตัวบน",
  tod3:    "3 ตัวโต๊ด",
  top2:    "2 ตัวบน",
  bot2:    "2 ตัวล่าง",
  run_top: "วิ่งบน",
  run_bot: "วิ่งล่าง",
};

export interface BetSlipSummary {
  id:          string;
  slipNo:      string;
  lotteryName: string;
  totalAmount: number;
  totalPayout: number;
  status:      string;
  itemCount:   number;
  createdAt:   Date;
}

export interface BetItemDetail {
  id:           number;
  number:       string;
  betType:      string;
  betTypeLabel: string;
  amount:       number;
  payRate:      number;
  payout:       number;
  isWin:        boolean | null;
  actualPayout: number | null;
}

export interface BetSlipDetail extends BetSlipSummary {
  note:        string | null;
  confirmedAt: Date | null;
  items:       BetItemDetail[];
}

export interface BetHistoryFilter {
  status?:   string;
  search?:   string;
  dateFrom?: string;
  dateTo?:   string;
  skip?:     number;
  limit?:    number;
}

export async function getBetHistory(
  userId: string,
  filter: BetHistoryFilter = {},
): Promise<{ slips: BetSlipSummary[]; total: number }> {
  const memberCode = parseInt(userId, 10);
  if (isNaN(memberCode)) return { slips: [], total: 0 };

  const { status, search, dateFrom, dateTo, skip = 0, limit = 20 } = filter;

  const where = {
    member_id:   memberCode,
    ...(status && status !== "all" ? { status: status as "active" | "cancelled" } : {}),
    ...(dateFrom || dateTo ? {
      created_at: {
        ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00`) } : {}),
        ...(dateTo   ? { lte: new Date(`${dateTo}T23:59:59`)   } : {}),
      },
    } : {}),
    ...(search ? { lotto_draws: { lotto_markets: { name: { contains: search } } } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.lotto_tickets.findMany({
      where,
      orderBy: { created_at: "desc" },
      take:    limit,
      skip,
      include: {
        lotto_ticket_items: { select: { id: true, amount: true, payout_at_time: true } },
        lotto_draws: { include: { lotto_markets: { select: { name: true } } } },
      },
    }),
    prisma.lotto_tickets.count({ where }),
  ]);

  return {
    total,
    slips: rows.map((s) => ({
      id:          String(s.id),
      slipNo:      String(s.id),
      lotteryName: s.lotto_draws.lotto_markets.name,
      totalAmount: Number(s.total_amount),
      totalPayout: s.lotto_ticket_items.reduce((sum, item) => sum + Number(item.amount) * Number(item.payout_at_time), 0),
      status:      String(s.status),
      itemCount:   s.lotto_ticket_items.length,
      createdAt:   s.created_at ?? new Date(0),
    })),
  };
}

export async function getLotteryBetHistory(
  userId: string,
  marketCode: string,
  limit = 5,
): Promise<BetSlipSummary[]> {
  const memberCode = parseInt(userId, 10);
  if (isNaN(memberCode)) return [];

  const rows = await prisma.lotto_tickets.findMany({
    where: {
      member_id:  memberCode,
      lotto_draws: { lotto_markets: { code: marketCode } },
    },
    orderBy: { created_at: "desc" },
    take:    limit,
    include: {
      lotto_ticket_items: { select: { id: true, amount: true, payout_at_time: true } },
      lotto_draws: { include: { lotto_markets: { select: { name: true } } } },
    },
  });

  return rows.map((s) => ({
    id:          String(s.id),
    slipNo:      String(s.id),
    lotteryName: s.lotto_draws.lotto_markets.name,
    totalAmount: Number(s.total_amount),
    totalPayout: s.lotto_ticket_items.reduce((sum, item) => sum + Number(item.amount) * Number(item.payout_at_time), 0),
    status:      String(s.status),
    itemCount:   s.lotto_ticket_items.length,
    createdAt:   s.created_at ?? new Date(0),
  }));
}

export async function getSlipDetail(slipId: string, userId: string): Promise<BetSlipDetail | null> {
  const memberCode = parseInt(userId, 10);
  const ticketId   = BigInt(slipId);

  const s = await prisma.lotto_tickets.findFirst({
    where: { id: ticketId, member_id: memberCode },
    include: {
      lotto_ticket_items: { orderBy: { id: "asc" } },
      lotto_draws: { include: { lotto_markets: { select: { name: true } } } },
    },
  });
  if (!s) return null;

  return {
    id:          String(s.id),
    slipNo:      String(s.id),
    lotteryName: s.lotto_draws.lotto_markets.name,
    totalAmount: Number(s.total_amount),
    totalPayout: s.lotto_ticket_items.reduce((sum, i) => sum + Number(i.amount) * Number(i.payout_at_time), 0),
    status:      String(s.status),
    itemCount:   s.lotto_ticket_items.length,
    createdAt:   s.created_at ?? new Date(0),
    note:        null,
    confirmedAt: s.created_at,
    items: s.lotto_ticket_items.map((i) => ({
      id:           Number(i.id),
      number:       i.number,
      betType:      i.bet_type,
      betTypeLabel: BET_TYPE_LABEL[i.bet_type] ?? i.bet_type,
      amount:       Number(i.amount),
      payRate:      Number(i.payout_at_time),
      payout:       Number(i.amount) * Number(i.payout_at_time),
      isWin:        i.result_status === "win" ? true : i.result_status === "lose" ? false : null,
      actualPayout: i.win_amount ? Number(i.win_amount) : null,
    })),
  };
}
