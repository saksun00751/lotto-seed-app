"use server";

/**
 * lib/actions.ts
 * Next.js Server Actions — auth & betting, powered by Prisma + MariaDB (members table).
 */

import bcrypt         from "bcryptjs";
import { redirect }   from "next/navigation";
import { headers }    from "next/headers";

import { findUserByPhone, createUser, phoneExists, updateUserProfile, updatePasswordHash, findUserById, findUserByReferralCode } from "@/lib/db/users";
import { createReferral } from "@/lib/db/referrals";
import { createOtp, verifyOtp }                     from "@/lib/db/otp";
import { createSession, destroySession }            from "@/lib/db/sessions";
import { setSessionCookie, getSessionToken, clearSessionCookie } from "@/lib/session/cookies";
import { sendOtpSms }                               from "@/lib/otp-sender";

import { getCurrentUser }                             from "@/lib/session/auth";

import type {
  LoginState, OtpState, RegisterState, PlaceBetState,
} from "@/types/auth";
import type { members } from "@prisma/client";
import { prisma } from "./db/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-]/g, "");
}
function isValidThaiPhone(phone: string): boolean {
  return /^0[6-9]\d{8}$/.test(phone);
}

async function getSessionMetadata() {
  const head = await headers();
  const userAgent = head.get("user-agent");
  const ipAddress = head.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
  return { userAgent, ipAddress };
}

/**
 * Ensures a member has a referral code (members.refer).
 * If not, generates a unique one and assigns it.
 */
async function assignReferralCodeOnLogin(member: members) {
  if (member.refer) return;

  let isUnique = false;
  while (!isUnique) {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await findUserByReferralCode(newCode);
    if (!existing) {
      isUnique = true;
      await prisma.members.update({
        where: { code: member.code },
        data:  { refer: newCode },
      });
    }
  }
}

// ─── OTP Login — Step 1: Request OTP ─────────────────────────────────────────
export async function requestOtpAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const phone = normalizePhone((formData.get("phone") as string) ?? "");

  if (!phone)                   return { error: "กรุณากรอกเบอร์โทรศัพท์" };
  if (!isValidThaiPhone(phone)) return { error: "เบอร์โทรศัพท์ไม่ถูกต้อง (06–09, ครบ 10 หลัก)" };

  const member = await findUserByPhone(phone);
  if (!member) return { error: "ไม่พบบัญชีนี้ กรุณาสมัครสมาชิกก่อน" };

  // const code = await createOtp(phone, "login");
  // await sendOtpSms(phone, code);

  return { success: true, phone };
}

// ─── OTP Login — Step 2: Verify OTP ──────────────────────────────────────────
export async function verifyOtpAction(
  prevState: OtpState,
  formData: FormData
): Promise<OtpState> {
  const otp   = (formData.get("otp")   as string) ?? "";
  const phone = (formData.get("phone") as string) ?? "";

  if (!/^\d{6}$/.test(otp)) return { error: "กรุณากรอก OTP 6 หลัก" };

  // const valid = await verifyOtp(phone, otp, "login");
  // if (!valid) return { error: "รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่" };

  const member = await findUserByPhone(phone);
  if (!member) return { error: "ไม่พบบัญชีในระบบ" };

  await assignReferralCodeOnLogin(member);

  const { userAgent, ipAddress } = await getSessionMetadata();
  const token = await createSession(String(member.code), userAgent, ipAddress);
  await setSessionCookie(token);

  return { success: true };
}

// ─── Login with Password ──────────────────────────────────────────────────────
export interface LoginPasswordState {
  error?: string;
  fieldErrors?: { phone?: string; password?: string };
  success?: boolean;
  phone?: string;
}

export async function loginWithPasswordAction(
  prevState: LoginPasswordState,
  formData: FormData
): Promise<LoginPasswordState> {
  const phone    = normalizePhone((formData.get("phone")    as string) ?? "");
  const password = (formData.get("password") as string) ?? "";

  const fieldErrors: LoginPasswordState["fieldErrors"] = {};
  if (!phone)                    fieldErrors.phone    = "กรุณากรอกเบอร์โทรศัพท์";
  else if (!isValidThaiPhone(phone)) fieldErrors.phone = "เบอร์ไม่ถูกต้อง (06–09, ครบ 10 หลัก)";
  if (!password)                 fieldErrors.password = "กรุณากรอกรหัสผ่าน";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const member = await findUserByPhone(phone);

  // Constant-time comparison even when member not found (prevent timing attacks)
  const hashToCheck = member?.password ?? "$2b$10$invalidhashforcomparisononlyXXXXXXXXXXXX";
  const match = await bcrypt.compare(password, hashToCheck);

  if (!member || !match) return { error: "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง" };
  if (!member.password)  return { error: "บัญชีนี้ไม่มีรหัสผ่าน กรุณาใช้ OTP แทน" };

  await assignReferralCodeOnLogin(member);

  const { userAgent, ipAddress } = await getSessionMetadata();
  const token = await createSession(String(member.code), userAgent, ipAddress);
  await setSessionCookie(token);

  return { success: true, phone };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function registerAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const phone           = normalizePhone((formData.get("phone")           as string) ?? "");
  const password        = (formData.get("password")        as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";
  const refCode         = ((formData.get("referralCode")   as string) ?? "").trim().toUpperCase();

  const fieldErrors: RegisterState["fieldErrors"] = {};

  if (!phone)                        fieldErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
  else if (!isValidThaiPhone(phone)) fieldErrors.phone = "เบอร์ไม่ถูกต้อง (06–09, ครบ 10 หลัก)";

  if (!password)                fieldErrors.password = "กรุณากรอกรหัสผ่าน";
  else if (password.length < 8) fieldErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
                                fieldErrors.password = "ต้องมีทั้งตัวอักษรและตัวเลข";

  if (!confirmPassword)                        fieldErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
  else if (confirmPassword !== password)       fieldErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  if (await phoneExists(phone)) return { fieldErrors: { phone: "เบอร์นี้ถูกใช้งานแล้ว" } };

  // Resolve referrer
  let referrer: members | null = null;
  if (refCode) {
    referrer = await findUserByReferralCode(refCode);
  }

  const hash    = await bcrypt.hash(password, 12);
  const newMember = await createUser(phone, hash, undefined, referrer ? refCode : undefined);

  // Link referral record (sets refer_code on newMember)
  if (referrer) {
    await createReferral(String(referrer.code), String(newMember.code));
  }

  await assignReferralCodeOnLogin(newMember);

  const { userAgent, ipAddress } = await getSessionMetadata();
  const token = await createSession(String(newMember.code), userAgent, ipAddress);
  await setSessionCookie(token);

  return { success: true, phone };
}

// ─── Update Profile ───────────────────────────────────────────────────────────
export interface UpdateProfileState {
  error?: string;
  fieldErrors?: { displayName?: string; bankCode?: string; bankAccount?: string };
  success?: boolean;
}

export async function updateProfileAction(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const firstname    = (formData.get("firstname")     as string ?? "").trim();
  const lastname     = (formData.get("lastname")      as string ?? "").trim();
  const displayName  = [firstname, lastname].filter(Boolean).join(" ");
  const bankCodeRaw  = (formData.get("bankCode")      as string ?? "").trim();
  const bankAccount  = (formData.get("bankAccount")   as string ?? "").trim().replace(/\D/g, "");

  const bankCode = parseInt(bankCodeRaw, 10);

  const fieldErrors: UpdateProfileState["fieldErrors"] = {};
  if (!firstname)                            fieldErrors.displayName = "กรุณากรอกชื่อ";
  if (!bankCodeRaw || isNaN(bankCode))       fieldErrors.bankCode    = "กรุณาเลือกธนาคาร";
  if (!bankAccount)                          fieldErrors.bankAccount = "กรุณากรอกเลขบัญชี";
  else if (bankAccount.length < 10 || bankAccount.length > 12)
                                             fieldErrors.bankAccount = "เลขบัญชีต้องมี 10–12 หลัก";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  await updateUserProfile(user.id, { firstname, lastname, bankCode, bankAccount });
  return { success: true };
}

// ─── Change Password ───────────────────────────────────────────────────────────
export interface ChangePasswordState {
  error?: string;
  fieldErrors?: { oldPassword?: string; newPassword?: string; confirmPassword?: string };
  success?: boolean;
}

export async function changePasswordAction(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const oldPassword     = (formData.get("oldPassword")     as string) ?? "";
  const newPassword     = (formData.get("newPassword")     as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  const fieldErrors: ChangePasswordState["fieldErrors"] = {};
  if (!oldPassword) fieldErrors.oldPassword = "กรุณากรอกรหัสผ่านเดิม";
  if (!newPassword) fieldErrors.newPassword = "กรุณากรอกรหัสผ่านใหม่";
  else if (newPassword.length < 8) fieldErrors.newPassword = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword))
    fieldErrors.newPassword = "ต้องมีทั้งตัวอักษรและตัวเลข";
  if (!confirmPassword) fieldErrors.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่";
  else if (confirmPassword !== newPassword) fieldErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const fullMember = await findUserById(user.id);
  if (!fullMember?.password) return { error: "บัญชีนี้ไม่มีรหัสผ่าน กรุณาใช้ OTP แทน" };

  const match = await bcrypt.compare(oldPassword, fullMember.password);
  if (!match) return { fieldErrors: { oldPassword: "รหัสผ่านเดิมไม่ถูกต้อง" } };

  if (oldPassword === newPassword) return { fieldErrors: { newPassword: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม" } };

  const hash = await bcrypt.hash(newPassword, 12);
  await updatePasswordHash(user.id, hash);
  return { success: true };
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await destroySession(token);
    await clearSessionCookie();
  }
  redirect("/login");
}

// ─── Place Bet ────────────────────────────────────────────────────────────────

const BET_TYPE_MAP: Record<string, "top3" | "tod3" | "top2" | "bot2" | "run_top" | "run_bot"> = {
  "3top":    "top3",
  "3tod":    "tod3",
  "2top":    "top2",
  "2bot":    "bot2",
  "run_top": "run_top",
  "run_bot": "run_bot",
};

export async function placeBetAction(
  prevState: PlaceBetState,
  formData: FormData
): Promise<PlaceBetState> {
  const betsJson  = formData.get("bets")      as string;
  const lotteryId = formData.get("lotteryId") as string;

  if (!betsJson || !lotteryId) return { error: "ข้อมูลไม่ครบ" };

  let bets: Array<{ number: string; type: string; amount: number }>;
  try { bets = JSON.parse(betsJson); }
  catch { return { error: "ข้อมูลโพยไม่ถูกต้อง" }; }

  if (!bets.length) return { error: "กรุณาเพิ่มตัวเลขก่อนส่งโพย" };

  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };

  const total = bets.reduce((s, b) => s + b.amount, 0);
  if (user.balance < total) return { error: `ยอดเงินไม่เพียงพอ (มี ฿${user.balance.toFixed(2)})` };

  return { error: "ระบบแทงหวยอยู่ระหว่างอัปเดต กรุณาลองใหม่อีกครั้ง" };
}

// ─── Spin Wheel ──────────────────────────────────────────────────────────────
export async function spinWheelAction(): Promise<{
  error?: string;
  prize?: number;
  diamond?: number;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบ" };
  if (user.diamond < 1) return { error: "Diamond ไม่เพียงพอ" };

  const PRIZES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  const prize  = PRIZES[Math.floor(Math.random() * PRIZES.length)];
  const memberCode = parseInt(user.id, 10);

  const updated = await prisma.members.update({
    where: { code: memberCode },
    data: {
      diamond: { decrement: 1 },
      balance: { increment: prize },
    },
    select: { diamond: true },
  });

  return { prize, diamond: parseFloat(String(updated.diamond)) };
}

// ─── Security & Login History ────────────────────────────────────────────────
export async function getLoginHistoryAction() {
  // sessions are stored in members.session_id (single session) — no history table
  return [];
}
