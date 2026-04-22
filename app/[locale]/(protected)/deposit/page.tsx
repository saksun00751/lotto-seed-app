import type { Metadata } from "next";
import DepositPage from "@/components/deposit/DepositPage";
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
  return { title: await getPageMetaTitle(locale, "deposit") };
}

interface LoadBalanceProfile {
  name:    string;
  bank_code: number;
  acc_no:  string;
  balance: string;
}

interface LoadBalancePromotion {
  select: boolean;
  name: string;
  min: string;
}

interface LoadBalanceResponse {
  success: boolean;
  profile: LoadBalanceProfile;
  promotion?: LoadBalancePromotion | null;
}

export default async function DepositRoute() {
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let profile: LoadBalanceProfile | null = null;
  let selectedPromotion: LoadBalancePromotion | null = null;
  try {
    const res = await apiGet<LoadBalanceResponse>("/member/loadbalance", token ?? undefined, lang);
    profile = res.profile;
    selectedPromotion = res.promotion ?? null;
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
      <DepositPage
        displayName={profile?.name ?? "สมาชิก"}
        bankName={bankName}
        bankLogo={bankLogo}
        bankAccount={profile?.acc_no ?? null}
        balance={parseFloat(profile?.balance ?? "0")}
        selectedPromotion={selectedPromotion?.select ? selectedPromotion : null}
      />
    </div>
  );
}
