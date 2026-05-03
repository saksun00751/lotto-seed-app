import type { Metadata } from "next";
import { headers } from "next/headers";
import ReferralPage from "@/components/referral/ReferralPage";
import { requireAuth } from "@/lib/session/auth";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import { getRegisterPagePath } from "@/lib/config/register";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "referral") };
}

interface ReferralItem {
  id: string;
  totalEarned: number;
  createdAt: string;
  referee: {
    displayName: string | null;
    phone: string;
    createdAt: string;
  };
}

interface ReferralApiResponse {
  success: boolean;
  summary?: {
    referred_members?: number;
    referral_code?: string;
    referral_income?: number;
    promotion_bonus_income?: number;
    promotion_bonus_count?: number;
  };
  rule?: {
    promotion_id?: string;
    length_type?: string;
    bonus_percent?: number;
    bonus_price?: number;
    display_value?: string;
  };
  referrals?: ReferralItem[];
  data?: {
    summary?: ReferralApiResponse["summary"];
    rule?: ReferralApiResponse["rule"];
    referrals?: ReferralItem[];
  };
}

export default async function ReferralRoute({ params }: Props) {
  const user = await requireAuth();
  const { locale } = await params;
  const headersList = await headers();
  const host  = headersList.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let referralCode: string = user.referralCode ?? "";
  let referredCount = 0;
  let totalEarned = 0;
  let promotionBonusIncome = 0;
  let promotionBonusCount = 0;
  let rule: NonNullable<ReferralApiResponse["rule"]> | null = null;
  let referrals: ReferralItem[] = [];

  try {
    const data = await apiGet<ReferralApiResponse>("/member/contributor", token ?? undefined, lang);
    const summary = data.summary ?? data.data?.summary;
    const ruleData = data.rule ?? data.data?.rule;
    const referralRows = data.referrals ?? data.data?.referrals ?? [];
    referralCode = summary?.referral_code || referralCode;
    referredCount = Number(summary?.referred_members ?? 0);
    totalEarned = Number(summary?.referral_income ?? 0);
    promotionBonusIncome = Number(summary?.promotion_bonus_income ?? 0);
    promotionBonusCount = Number(summary?.promotion_bonus_count ?? 0);
    rule = ruleData ?? null;
    referrals = referralRows;
  } catch {}

  const registerPath = getRegisterPagePath(locale);
  const referralLink = `${proto}://${host}${registerPath}?ref=${encodeURIComponent(referralCode)}`;

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <ReferralPage
        referralCode={referralCode}
        referralLink={referralLink}
        displayName={user.displayName ?? "สมาชิก"}
        referredCount={referredCount}
        totalEarned={totalEarned}
        promotionBonusIncome={promotionBonusIncome}
        promotionBonusCount={promotionBonusCount}
        rule={rule}
        referrals={referrals}
      />
    </div>
  );
}
