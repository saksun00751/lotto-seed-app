import type { Metadata } from "next";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import PromotionPageClient from "@/components/promotion/PromotionPageClient";

export const metadata: Metadata = { title: "โปรโมชั่น — Lotto" };

interface ApiPromotion {
  code:           number;
  id?:            string;
  name_th:        string;
  filepic:        string;
  sort?:          number;
  bonus_percent:  string;
  bonus_max:      string;
  bonus_price:    string;
  turnpro:        string;
  content:        string;
  active:         string;
  enable:         string;
  amount_min:     string;
}

interface PromotionListResponse {
  success: boolean;
  data?: { promotions?: ApiPromotion[] };
}

interface LoadBalancePromotion {
  select: boolean;
  name: string;
  min: string;
}

interface LoadBalanceResponse {
  success: boolean;
  promotion?: LoadBalancePromotion | null;
}

export default async function PromotionPage() {
  const [apiToken, lang] = await Promise.all([
    getApiToken(),
    getLangCookie(),
  ]);

  let promotions: ApiPromotion[] = [];
  let selectedPromotion: LoadBalancePromotion | null = null;

  try {
    const res = await apiGet<PromotionListResponse>("/promotion/list", apiToken ?? undefined, lang);
    promotions = res.data?.promotions ?? [];
  } catch {}

  try {
    const res = await apiGet<LoadBalanceResponse>("/member/loadbalance", apiToken ?? undefined, lang);
    selectedPromotion = res.promotion ?? null;
  } catch {}

  return <PromotionPageClient promotions={promotions} selectedPromotion={selectedPromotion?.select ? selectedPromotion : null} />;
}
