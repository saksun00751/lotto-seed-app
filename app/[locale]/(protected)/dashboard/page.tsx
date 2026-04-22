import LotteryCategories from "@/components/dashboard/LotteryCategories";
import BalanceCard from "@/components/dashboard/BalanceCard";
import type { Metadata } from "next";
import PromoBanner from "@/components/ui/PromoBanner";
import { Suspense } from "react";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import { mapMarketsToCategories } from "@/lib/api/lotto";
import type { MarketsLatestResponse } from "@/lib/api/lotto";
import type { Category } from "@/lib/categories";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "dashboard") };
}

async function DashboardLotterySection() {
  const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);
  let categories: Category[] = [];
  try {
    const res = await apiGet<MarketsLatestResponse>("/lotto/markets/latest", apiToken ?? undefined, lang);
    if (res?.data?.groups) {
      categories = mapMarketsToCategories(res.data.groups);
    }
  } catch {}

  return <LotteryCategories initialCategories={categories} />;
}

function DashboardLotteryFallback() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-ap-border overflow-hidden animate-pulse bg-white shadow-card">
          <div className="h-11 bg-sky-200/70" />
          <div className="h-10 px-4 bg-sky-50 border-b border-slate-200" />
          <div className="bg-white divide-y divide-slate-200/80">
            {[1, 2, 3].map((j, idx) => (
              <div key={j} className={`h-12 px-4 flex items-center gap-2 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}`}>
                <div className="w-6 h-6 rounded-full bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen bg-ap-bg pb-20 sm:pb-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-16 w-[360px] h-[360px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-[340px] h-[340px] rounded-full bg-blue-200/25 blur-3xl" />
      </div>
      <div className="relative max-w-5xl mx-auto px-5 pt-6 space-y-8">
        <BalanceCard phone="" displayName="" />
        <PromoBanner />
        <Suspense fallback={<DashboardLotteryFallback />}>
          <DashboardLotterySection />
        </Suspense>
      </div>
    </div>
  );
}
