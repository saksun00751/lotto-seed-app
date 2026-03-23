/**
 * lib/db/otp.ts
 * OTP — stored in members.otp field (no separate OTP table in DB).
 */

import crypto from "crypto";
import { prisma } from "./prisma";

const OTP_TTL_SECONDS = 300; // 5 minutes

/** Generate a 6-digit OTP and store it in members.otp (temp storage) */
export async function createOtp(phone: string): Promise<string> {
  const code = String(crypto.randomInt(100_000, 999_999));
  await prisma.members.updateMany({
    where: { tel: phone },
    data:  { otp: code },
  });
  return code;
}

/** Verify OTP stored in members.otp */
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const member = await prisma.members.findFirst({
    where: { tel: phone, otp: code },
    select: { code: true },
  });
  if (!member) return false;
  // Clear OTP after successful verification
  await prisma.members.update({
    where: { code: member.code },
    data:  { otp: "" },
  });
  return true;
}
