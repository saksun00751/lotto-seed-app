import type { Metadata } from "next";
import WithdrawPage from "@/components/withdraw/WithdrawPage";
import { apiGet } from "@/lib/api/client";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { getBanks } from "@/lib/api/banks";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "withdraw") };
}

interface LoadBalanceProfile {
  name:                  string;
  bank_code:             number;
  acc_no:                string;
  balance:               string;
  withdraw_min:          string;
  withdraw_max:          number;
  maxwithdraw_day:       string;
  withdraw_sum_today:    number;
  withdraw_remain_today: number;
  withdraw_limit_amount: string;
}

interface LoadBalanceResponse {
  success:   boolean;
  withdraw:  boolean;
  profile:   LoadBalanceProfile;
  system: {
    notice: string | null;
  };
}

interface MemberProfileResponse {
  success?: boolean;
  profile?: {
    getpro?: boolean;
    pro?: boolean;
    pro_name?: string;
    amount_balance?: string | number;
    withdraw_limit_amount?: string | number;
  };
}

export default async function WithdrawRoute() {
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let profile: LoadBalanceProfile | null = null;
  let canWithdraw = true;
  let notice: string | null = null;
  let promoActive = false;
  let promoName: string | null = null;
  let promoTurnover = 0;
  let promoWithdrawLimit = 0;

  try {
    const [loadBalanceRes, memberProfileRes] = await Promise.all([
      apiGet<LoadBalanceResponse>("/member/loadbalance", token ?? undefined, lang),
      apiGet<MemberProfileResponse>("/member/profile", token ?? undefined, lang),
    ]);
    profile = loadBalanceRes.profile;
    canWithdraw = loadBalanceRes.withdraw;
    notice = loadBalanceRes.system?.notice ?? null;

    const profilePromo = memberProfileRes?.profile;
    promoActive = Boolean(profilePromo?.getpro && profilePromo?.pro);
    promoName = typeof profilePromo?.pro_name === "string" ? profilePromo.pro_name : null;
    promoTurnover = Number(profilePromo?.amount_balance ?? 0) || 0;
    promoWithdrawLimit = Number(profilePromo?.withdraw_limit_amount ?? profile?.withdraw_limit_amount ?? 0) || 0;
  } catch {}

  let bankName: string | null = null;
  let bankLogo: string | null = null;
  if (profile?.bank_code) {
    const banks = await getBanks();
    const bank = banks.find((b) => b.code === profile.bank_code);
    bankName = bank?.name_th ?? null;
    bankLogo = bank?.image_url ?? null;
  }

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <WithdrawPage
        displayName={profile?.name ?? "สมาชิก"}
        bankName={bankName}
        bankLogo={bankLogo}
        bankAccount={profile?.acc_no ?? null}
        balance={parseFloat(profile?.balance ?? "0")}
        withdrawMin={parseFloat(profile?.withdraw_min ?? "100")}
        withdrawMax={profile?.withdraw_max ?? 200000}
        withdrawMaxDay={parseFloat(profile?.maxwithdraw_day ?? "200000")}
        withdrawSumToday={profile?.withdraw_sum_today ?? 0}
        withdrawRemainToday={profile?.withdraw_remain_today ?? 0}
        withdrawLimitAmount={parseFloat(profile?.withdraw_limit_amount ?? "0")}
        canWithdraw={canWithdraw}
        notice={notice}
        promoActive={promoActive}
        promoName={promoName}
        promoTurnover={promoTurnover}
        promoWithdrawLimit={promoWithdrawLimit}
      />
    </div>
  );
}
