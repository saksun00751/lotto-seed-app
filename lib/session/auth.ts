import { cache } from "react";
import { getApiToken, getLangCookie, getMemberCodeCookie } from "./cookies";
import { apiGet, ApiError } from "@/lib/api/client";

export interface AuthUser {
  id:          string;        // user_name (phone)
  phone:       string;
  displayName: string;
  firstname:   string;
  lastname:    string;
  balance:     number;
  diamond:     number;
  credit:      number;
  level:       number;
  bankCode:    number | null;
  bankAccount: string | null; // non-null = bank already set
  referralCode: string | null;
  createdAt:   Date | null;
}

interface ProfileResponse {
  success: boolean;
  profile: {
    user_name:  string;
    name:       string;
    balance:    string;
    diamond:    number;
    credit:     string;
    bank_code:  number;
  };
}

export const getCurrentUser = cache(async function (): Promise<AuthUser | null> {
  try {
    const apiToken = await getApiToken();
    if (!apiToken) return null;

    const lang = await getLangCookie();
    const res  = await apiGet<ProfileResponse>("/member/profile", apiToken, lang);
    if (!res?.success || !res.profile) return null;

    const p          = res.profile;
    const memberCode = await getMemberCodeCookie();
    const nameParts  = (p.name || "").trim().split(/\s+/);

    return {
      id:          memberCode ?? p.user_name,
      phone:       p.user_name,
      displayName: p.name || p.user_name,
      firstname:   nameParts[0]              || "",
      lastname:    nameParts.slice(1).join(" ") || "",
      balance:     parseFloat(p.balance)     || 0,
      diamond:     Number(p.diamond)         || 0,
      credit:      parseFloat(p.credit)      || 0,
      level:       0,
      bankCode:    p.bank_code > 0 ? p.bank_code : null,
      bankAccount: p.bank_code > 0 ? String(p.bank_code) : null,
      referralCode: null,
      createdAt:   null,
    };
  } catch (e) {
    if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) {
      console.error("[getCurrentUser] error:", e);
    }
    return null;
  }
});

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    const lang = await getLangCookie();
    redirect(`/${lang}/login?expired=1`);
  }
  return user as AuthUser;
}
