import type { Metadata } from "next";
import DepositPage from "@/components/deposit/DepositPage";
import { requireAuth } from "@/lib/session/auth";
import { apiGet } from "@/lib/api/client";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";

export const metadata: Metadata = { title: "เติมเงิน — Lotto" };

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

interface ApiBankItem {
  code:      number;
  name_th:   string;
  shortcode: string;
  image_url: string;
}

interface BanksResponse {
  data?: { banks?: ApiBankItem[] };
}

export default async function DepositRoute() {
  await requireAuth();
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let profile: LoadBalanceProfile | null = null;
  let selectedPromotion: LoadBalancePromotion | null = null;
  try {
    const res = await apiGet<LoadBalanceResponse>("/member/loadbalance", token ?? undefined, lang);
    profile = res.profile;
    selectedPromotion = res.promotion ?? null;
  } catch {}

  let bankName: string | null = null;
  if (profile?.bank_code) {
    try {
      const res = await apiGet<BanksResponse>("/auth/register/banks");
      bankName = res.data?.banks?.find((b) => b.code === profile!.bank_code)?.name_th ?? null;
    } catch {}
  }

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <DepositPage
        displayName={profile?.name ?? "สมาชิก"}
        bankName={bankName}
        bankAccount={profile?.acc_no ?? null}
        balance={parseFloat(profile?.balance ?? "0")}
        selectedPromotion={selectedPromotion?.select ? selectedPromotion : null}
      />
    </div>
  );
}
