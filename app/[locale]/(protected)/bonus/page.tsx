import type { Metadata } from "next";
import BonusPage from "@/components/bonus/BonusPage";
import { requireAuth } from "@/lib/session/auth";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "bonus") };
}

interface LoadBalanceProfile {
  balance?: string | number;
  diamond?: string | number;
  bonus?: string | number;
  cashback?: string | number;
  faststart?: string | number;
  downline?: string | number;
  winlost?: string | number;
  ic?: string | number;
  referral_income?:   string | number;
  referralIncome?:    string | number;
  referral_balance?:  string | number;
}

interface LoadBalanceResponse {
  success?: boolean;
  profile?: LoadBalanceProfile;
  data?:    LoadBalanceProfile;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export default async function BonusRoute({ params }: Props) {
  const [{ locale }] = await Promise.all([params, requireAuth()]);
  const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let bonus = 0;
  let cashback = 0;
  let faststart = 0;
  let ic = 0;

  try {
    const res = await apiGet<LoadBalanceResponse>("/member/loadbalance", apiToken ?? undefined, lang);
    const p = (res?.profile ?? res?.data ?? res ?? {}) as LoadBalanceProfile;
    bonus = toNumber(p.bonus);
    cashback = toNumber(p.cashback);
    faststart = toNumber(p.faststart);
    ic = toNumber(p.ic ?? p.winlost);
  } catch {}

  return (
    <BonusPage
      locale={locale}
      bonus={bonus}
      cashback={cashback}
      faststart={faststart}
      ic={ic}
    />
  );
}
