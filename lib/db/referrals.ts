/**
 * lib/db/referrals.ts
 * Referral-related operations — using members.refer_code (Int).
 * referrer.code → referee.refer_code
 */

import { prisma } from "./prisma";

/** Record that referrerCode referred a new member (set refer_code on the new member) */
export async function createReferral(referrerId: string, refereeId: string): Promise<void> {
  const refereeCode = parseInt(refereeId, 10);
  const referrerCode = parseInt(referrerId, 10);
  if (isNaN(refereeCode) || isNaN(referrerCode)) return;

  await prisma.members.update({
    where: { code: refereeCode },
    data:  { refer_code: referrerCode },
  });
}

/** Get referral stats for a member */
export async function getReferralStats(userId: string): Promise<{
  referredCount: number;
  totalEarned:   number;
}> {
  const referrerCode = parseInt(userId, 10);
  if (isNaN(referrerCode)) return { referredCount: 0, totalEarned: 0 };

  const count = await prisma.members.count({
    where: { refer_code: referrerCode },
  });

  return { referredCount: count, totalEarned: 0 };
}

/** ยอดค่าแนะนำที่ได้รับในเดือนปัจจุบัน (ยังไม่มีตาราง transaction → คืน 0) */
export async function getMonthlyReferralEarning(_userId: string): Promise<number> {
  return 0;
}

/** Get list of referred members */
export async function getReferralList(userId: string) {
  const referrerCode = parseInt(userId, 10);
  if (isNaN(referrerCode)) return [];

  const referees = await prisma.members.findMany({
    where:   { refer_code: referrerCode },
    orderBy: { date_create: "desc" },
    select: {
      code:        true,
      name:        true,
      tel:         true,
      date_create: true,
    },
  });

  return referees.map((r) => ({
    id:          String(r.code),
    totalEarned: 0,
    createdAt:   r.date_create ?? new Date(0),
    referee: {
      displayName: r.name || null,
      phone:       r.tel,
      createdAt:   r.date_create ?? new Date(0),
    },
  }));
}
