import { prisma } from "./prisma";

export async function getUserStats(userId: string) {
  const memberCode = parseInt(userId, 10);
  if (isNaN(memberCode)) return { totalBet: 0, totalWin: 0, referredCount: 0, monthlyReferral: 0 };

  const now           = new Date();
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);

  // ยอดแทงรวม (จาก lotto_tickets)
  const betAgg = await prisma.lotto_tickets.aggregate({
    where: { member_id: memberCode },
    _sum:  { total_amount: true },
  });

  // ยอดชนะรวม (จาก lotto_ticket_items ที่ result_status = 'win')
  const winAgg = await prisma.lotto_ticket_items.aggregate({
    where: { lotto_tickets: { member_id: memberCode }, result_status: "win" },
    _sum:  { win_amount: true },
  });

  // จำนวนที่แนะนำ (members ที่มี refer_code = memberCode)
  const referredCount = await prisma.members.count({
    where: { refer_code: memberCode },
  });

  // ยอดแนะนำเดือนนี้ (ยังไม่มีตาราง commission → 0)
  const monthlyReferral = 0;

  return {
    totalBet:        parseFloat(String(betAgg._sum.total_amount ?? 0)),
    totalWin:        parseFloat(String(winAgg._sum.win_amount ?? 0)),
    referredCount,
    monthlyReferral,
  };
}
