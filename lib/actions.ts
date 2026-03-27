"use server";

import { redirect } from "next/navigation";

import { setApiTokenCookie, clearApiTokenCookie, setMemberCodeCookie, clearMemberCodeCookie } from "@/lib/session/cookies";
import { getCurrentUser }                                          from "@/lib/session/auth";
import { apiPost, ApiError }                                       from "@/lib/api/client";

import type { LoginState, OtpState, RegisterState, PlaceBetState, WithdrawState } from "@/types/auth";

import th from "@/lib/i18n/locales/th.json";
import en from "@/lib/i18n/locales/en.json";
import kh from "@/lib/i18n/locales/kh.json";
import la from "@/lib/i18n/locales/la.json";

const locales = { th, en, kh, la } as const;
type LangCode = keyof typeof locales;
type RegisterFieldErrors = NonNullable<RegisterState["fieldErrors"]>;

function getLang(formData: FormData): LangCode {
  const lang = formData.get("lang") as string;
  return (lang in locales ? lang : "th") as LangCode;
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}
function isValidThaiPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone);
}

function parseRegisterFieldErrorsFromApi(payload: unknown): RegisterFieldErrors {
  const out: RegisterFieldErrors = {};
  if (!payload || typeof payload !== "object") return out;

  const rawErrors = (payload as { errors?: Record<string, unknown> }).errors;
  if (!rawErrors || typeof rawErrors !== "object") return out;

  const pick = (k: string): string | undefined => {
    const v = rawErrors[k];
    if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
    if (typeof v === "string") return v;
    return undefined;
  };

  out.user_name = pick("user_name");
  out.password = pick("password");
  out.confirmPassword = pick("password_confirm") ?? pick("confirmPassword");
  out.firstname = pick("firstname");
  out.lastname = pick("lastname");
  out.bank = pick("bank");
  out.acc_no = pick("acc_no");

  return out;
}

// ─── OTP Login — Step 1: Request OTP ─────────────────────────────────────────
export async function requestOtpAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const t     = locales[getLang(formData)].login;
  const phone = normalizePhone((formData.get("user_name") as string) ?? "");

  if (!phone)                   return { error: t.errPhone };
  if (!isValidThaiPhone(phone)) return { error: t.errPhoneInvalid };

  return { success: true, phone };
}

// ─── OTP Login — Step 2: Verify OTP ──────────────────────────────────────────
export async function verifyOtpAction(
  _prevState: OtpState,
  formData: FormData
): Promise<OtpState> {
  const otp   = (formData.get("otp")       as string) ?? "";
  const phone = (formData.get("user_name") as string) ?? "";
  const lang  = getLang(formData);

  if (!/^\d{6}$/.test(otp)) return { error: "กรุณากรอก OTP 6 หลัก" };

  let apiToken: string | undefined;
  try {
    const res = await apiPost<{ access_token?: string; data?: { access_token?: string } }>(
      "/auth/login/otp", { user_name: phone, otp }, undefined, lang
    );
    apiToken = res.access_token ?? res.data?.access_token;
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message ?? "OTP ไม่ถูกต้อง" };
    return { error: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่" };
  }

  if (apiToken) await setApiTokenCookie(apiToken);
  return { success: true };
}

// ─── Login with Password ──────────────────────────────────────────────────────
export interface LoginPasswordState {
  error?: string;
  fieldErrors?: { user_name?: string; password?: string };
  success?: boolean;
  phone?: string;
}

export async function loginWithPasswordAction(
  _prevState: LoginPasswordState,
  formData: FormData
): Promise<LoginPasswordState> {
  const lang     = getLang(formData);
  const t        = locales[lang].login;
  const phone    = normalizePhone((formData.get("user_name") as string) ?? "");
  const password = (formData.get("password") as string) ?? "";

  const fieldErrors: LoginPasswordState["fieldErrors"] = {};
  if (!phone)                        fieldErrors.user_name = t.errPhone;
  else if (!isValidThaiPhone(phone)) fieldErrors.user_name = t.errPhoneInvalid;
  if (!password)                     fieldErrors.password  = t.errPassword;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  interface LoginRes {
    access_token?: string;
    member?: { code?: number };
  }
  let apiToken: string | undefined;
  let memberCode: number | undefined;
  try {
    const res = await apiPost<LoginRes>("/auth/login", { user_name: phone, password }, undefined, lang);
    apiToken   = res.access_token;
    memberCode = res.member?.code;
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401 || e.status === 400) return { error: t.errCredentials };
      return { error: e.message ?? t.errCredentials };
    }
    return { error: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่" };
  }

  if (!apiToken) return { error: t.errCredentials };
  await setApiTokenCookie(apiToken);
  if (memberCode) await setMemberCodeCookie(memberCode);
  return { success: true };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const lang            = getLang(formData);
  const t               = locales[lang].register;
  const phone           = normalizePhone((formData.get("user_name")   as string) ?? "");
  const password        = (formData.get("password")        as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";
  const firstname       = ((formData.get("firstname")      as string) ?? "").trim();
  const lastname        = ((formData.get("lastname")       as string) ?? "").trim();
  const accNo           = ((formData.get("acc_no")         as string) ?? "").replace(/\D/g, "");
  const bankRaw         = (formData.get("bank")            as string) ?? "";
  const bank            = parseInt(bankRaw, 10);
  const referRaw        = ((formData.get("referralCode")   as string) ?? "").trim();

  const fieldErrors: RegisterState["fieldErrors"] = {};
  if (!phone)                        fieldErrors.user_name = t.errPhone;
  else if (!isValidThaiPhone(phone)) fieldErrors.user_name = t.errPhoneInvalid;
  if (!password)                                              fieldErrors.password = t.errPassword;
  else if (password.length < 6 || password.length > 10)      fieldErrors.password = t.errPasswordLen;
  if (!confirmPassword)                  fieldErrors.confirmPassword = t.errConfirmPassword;
  else if (confirmPassword !== password) fieldErrors.confirmPassword = t.confirmMismatch;
  if (!firstname)                      fieldErrors.firstname = t.errFirstname;
  if (!lastname)                       fieldErrors.lastname  = t.errLastname;
  if (!bankRaw || isNaN(bank))         fieldErrors.bank      = t.errBank;
  if (!accNo)                          fieldErrors.acc_no    = t.errAccNo;
  else if (accNo.length < 10 || accNo.length > 12) fieldErrors.acc_no = t.errAccNoLen;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  // ── Register ───────────────────────────────────────────────────────────────
  try {
    await apiPost("/auth/register", {
      user_name: phone,
      tel: phone,
      wallet_id: phone,
      password,
      password_confirm: confirmPassword,
      firstname, lastname, acc_no: accNo, bank: String(bank), refer: referRaw,
    }, undefined, lang);
  } catch (e) {
    if (e instanceof ApiError) {
      const payloadFieldErrors = parseRegisterFieldErrorsFromApi(e.payload);
      if (Object.values(payloadFieldErrors).some(Boolean)) {
        return {
          error: e.message ?? "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่",
          fieldErrors: payloadFieldErrors,
        };
      }
      const msg = (e.message ?? "").toLowerCase();
      if (e.status === 409 || msg.includes("exist"))
        return { fieldErrors: { user_name: t.errPhoneExists } };
      if (
        msg.includes("acc_no") ||
        msg.includes("account") ||
        msg.includes("บัญชี") ||
        msg.includes("duplicate") ||
        msg.includes("ซ้ำ")
      ) {
        return { fieldErrors: { acc_no: (t as Record<string, string>).errAccNoDuplicate ?? "เลขบัญชีนี้ถูกใช้งานแล้วในธนาคารที่เลือก" } };
      }
      return { error: e.message ?? "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่" };
    }
    return { error: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่" };
  }

  // ── Auto-login after register ──────────────────────────────────────────────
  try {
    interface LoginRes { access_token?: string; member?: { code?: number } }
    const res = await apiPost<LoginRes>("/auth/login", { user_name: phone, password }, undefined, lang);
    if (res.access_token)  await setApiTokenCookie(res.access_token);
    if (res.member?.code)  await setMemberCodeCookie(res.member.code);
  } catch {}

  redirect(`/${lang}/dashboard`);
}

// ─── Update Profile ───────────────────────────────────────────────────────────
export interface UpdateProfileState {
  error?: string;
  fieldErrors?: { displayName?: string; bankCode?: string; bankAccount?: string };
  success?: boolean;
}

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const firstname   = (formData.get("firstname")   as string ?? "").trim();
  const lastname    = (formData.get("lastname")     as string ?? "").trim();
  const bankCodeRaw = (formData.get("bankCode")     as string ?? "").trim();
  const bankAccount = (formData.get("bankAccount")  as string ?? "").trim().replace(/\D/g, "");
  const bankCode    = parseInt(bankCodeRaw, 10);

  const fieldErrors: UpdateProfileState["fieldErrors"] = {};
  if (!firstname)                   fieldErrors.displayName = "กรุณากรอกชื่อ";
  if (!bankCodeRaw || isNaN(bankCode)) fieldErrors.bankCode = "กรุณาเลือกธนาคาร";
  if (!bankAccount)                 fieldErrors.bankAccount = "กรุณากรอกเลขบัญชี";
  else if (bankAccount.length < 10 || bankAccount.length > 12)
                                    fieldErrors.bankAccount = "เลขบัญชีต้องมี 10–12 หลัก";
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  return { error: "ระบบแก้ไขโปรไฟล์กำลังย้ายไป API" };
}

// ─── Change Password ───────────────────────────────────────────────────────────
export interface ChangePasswordState {
  error?: string;
  fieldErrors?: { oldPassword?: string; newPassword?: string; confirmPassword?: string };
  success?: boolean;
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
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
  if (!confirmPassword)                  fieldErrors.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่";
  else if (confirmPassword !== newPassword) fieldErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  return { error: "ระบบเปลี่ยนรหัสผ่านกำลังย้ายไป API" };
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const apiToken = await (await import("@/lib/session/cookies")).getApiToken();
  try { await apiPost("/auth/logout", {}, apiToken ?? undefined); } catch {}
  await clearApiTokenCookie();
  await clearMemberCodeCookie();
  redirect("/login");
}

// ─── Place Bet ────────────────────────────────────────────────────────────────
export async function placeBetAction(
  _prevState: PlaceBetState,
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
  error?:   string;
  code?:    number;
  prize?:   number;
  diamond?: number;
  title?:   string;
  msg?:     string;
  img?:     string;
}> {
  try {
    const { getApiToken, getLangCookie } = await import("@/lib/session/cookies");
    const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);

    const res = await apiPost<{
      success:  boolean;
      code?:    number;
      diamond?: number;
      message?: string;
      format?: {
        title?:   string;
        msg?:     string;
        img?:     string;
        point?:   number;
        diamond?: number;
      };
    }>("/wheel/spin", {}, apiToken ?? undefined, lang);

    const fmt    = res.format ?? {};
    const code   = res.code;
    const prize  = fmt.point;
    const diamond = fmt.diamond ?? res.diamond;

    return { code, prize, diamond, title: fmt.title, msg: fmt.msg, img: fmt.img };
  } catch (err: any) {
    return { error: err?.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }
}

// ─── Withdraw ─────────────────────────────────────────────────────────────────
export async function withdrawAction(
  _prevState: WithdrawState,
  formData: FormData,
): Promise<WithdrawState> {
  const amountRaw = (formData.get("amount") as string) ?? "";
  const amount    = parseFloat(amountRaw);

  if (!amountRaw || isNaN(amount) || amount <= 0) return { error: "จำนวนเงินไม่ถูกต้อง" };

  try {
    const { getApiToken, getLangCookie } = await import("@/lib/session/cookies");
    const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);
    if (!apiToken) return { error: "กรุณาเข้าสู่ระบบ" };

    await apiPost("/wallet/withdraw", { amount: String(amount) }, apiToken, lang);
    return { success: true, amount };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }
}

// ─── Security & Login History ─────────────────────────────────────────────────
export async function getLoginHistoryAction() {
  return [];
}
