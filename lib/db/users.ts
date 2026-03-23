/**
 * lib/db/users.ts
 * User-related database operations using Prisma — mapped to `members` table.
 */

import type { members } from "@prisma/client";
import { prisma } from "./prisma";

export type User = members;

/** Find active member by phone (tel) */
export async function findUserByPhone(phone: string): Promise<members | null> {
  return prisma.members.findFirst({
    where: { tel: phone, enable: "Y" },
  });
}

/** Find active member by id (members.code as string) */
export async function findUserById(id: string): Promise<members | null> {
  const code = parseInt(id, 10);
  if (isNaN(code)) return null;
  return prisma.members.findFirst({
    where: { code, enable: "Y" },
  });
}

/** Check whether a phone is already registered */
export async function phoneExists(phone: string): Promise<boolean> {
  const count = await prisma.members.count({ where: { tel: phone } });
  return count > 0;
}

/** Find member by referral code (members.refer) */
export async function findUserByReferralCode(referCode: string): Promise<members | null> {
  return prisma.members.findFirst({
    where: { refer: referCode, enable: "Y" },
  });
}

/** Generate a unique referral code (LT + 6 uppercase alphanumeric) */
export async function generateUniqueReferralCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "LT";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const exists = await prisma.members.count({ where: { refer: code } });
    if (exists === 0) return code;
  }
  return "LT" + Date.now().toString(36).toUpperCase().slice(-6);
}

/** Create a new member, returns the created record */
export async function createUser(
  phone: string,
  passwordHash: string | null,
  displayName?: string,
  referredByCode?: string
): Promise<members> {
  const referralCode = await generateUniqueReferralCode();

  // Resolve upline code (Int) from referral code string
  let referCode = 0;
  if (referredByCode) {
    const referrer = await prisma.members.findFirst({
      where: { refer: referredByCode },
      select: { code: true },
    });
    referCode = referrer?.code ?? 0;
  }

  return prisma.members.create({
    data: {
      tel:             phone,
      password:        passwordHash ?? "",
      user_name:       phone,
      user_pass:       passwordHash ?? "",
      name:            displayName ?? "",
      confirm:         "Y",
      refer:           referralCode,
      refer_code:      referCode,
      point_deposit:   0,
      diamond:         0,
      credit:          0,
      balance:         0,
      balance_free:    0,
      allget_downline: 0,
      payment_balance: 0,
      payment_amount:  0,
      remark:          "",
      date_create:     new Date(),
    },
  });
}

/** Fetch enabled banks for registration/profile forms */
export async function getBanks() {
  return prisma.banks.findMany({
    where:   { enable: "Y", show_regis: "Y", code: { not: 0 } },
    orderBy: { code: "asc" },
    select:  { code: true, name_th: true, shortcode: true, bg_color: true, filepic: true },
  });
}

/** Update name fields, bank code, and bank account */
export async function updateUserProfile(
  userId: string,
  data: { firstname?: string; lastname?: string; bankCode?: number; bankAccount?: string }
): Promise<void> {
  const code = parseInt(userId, 10);
  if (isNaN(code)) return;
  const displayName = [data.firstname, data.lastname].filter(Boolean).join(" ");
  await prisma.members.update({
    where: { code },
    data: {
      ...(data.firstname   !== undefined ? { firstname: data.firstname }      : {}),
      ...(data.lastname    !== undefined ? { lastname:  data.lastname  }      : {}),
      ...(displayName                    ? { name: displayName }              : {}),
      ...(data.bankCode    !== undefined ? { bank_code: data.bankCode }       : {}),
      ...(data.bankAccount !== undefined ? { acc_no: data.bankAccount }       : {}),
    },
  });
}

/** Update bcrypt password hash */
export async function updatePasswordHash(userId: string, hash: string): Promise<void> {
  const code = parseInt(userId, 10);
  if (isNaN(code)) return;
  await prisma.members.update({
    where: { code },
    data:  { password: hash },
  });
}
