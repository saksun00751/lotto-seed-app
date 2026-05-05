import LotteryCategories from "@/components/dashboard/LotteryCategories";
import BalanceCard from "@/components/dashboard/BalanceCard";
import LotteryGroups from "@/components/dashboard/LotteryGroups";
import GameGroupSlider from "@/components/ui/GameGroupSlider";
import Link from "next/link";
import type { Metadata } from "next";
import PromoBanner from "@/components/ui/PromoBanner";
import { Suspense } from "react";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import { mapMarketsToCategories } from "@/lib/api/lotto";
import type { MarketsLatestResponse } from "@/lib/api/lotto";
import { getAllGamesGroupedFromApi } from "@/lib/api/games";
import type { Category } from "@/lib/categories";
import { getTranslation } from "@/lib/i18n/getTranslation";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";
import { getCurrentUser } from "@/lib/session/auth";

type DashboardMode = "lotto" | "game";

function getDashboardMode(): DashboardMode {
  const raw = (process.env.DASHBOARD_MODE ?? process.env.NEXT_PUBLIC_DASHBOARD_MODE ?? "lotto")
    .trim()
    .toLowerCase();

  if (["game", "games"].includes(raw)) return "game";
  return "lotto";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "dashboard") };
}

async function DashboardLotterySection({ locale }: { locale: string }) {
  const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);
  let categories: Category[] = [];
  try {
    const res = await apiGet<MarketsLatestResponse>("/lotto/markets/latest", apiToken ?? undefined, lang);
    if (res?.data?.groups) {
      categories = mapMarketsToCategories(res.data.groups, lang);
    }
  } catch {}

  return <LotteryCategories initialCategories={categories} locale={locale} />;
}

async function DashboardGamesSection({ locale }: { locale: string }) {
  const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);
  const t = getTranslation(lang, "bet");
  let gameGroups: Awaited<ReturnType<typeof getAllGamesGroupedFromApi>> = [];
  try {
    gameGroups = await getAllGamesGroupedFromApi(apiToken ?? undefined, lang);
  } catch {}

  const headerGradient: Record<string, string> = {
    SLOT:      "from-rose-500 to-pink-400",
    CASINO:    "from-amber-500 to-yellow-400",
    SPORT:     "from-green-600 to-lime-400",
    CARDGROUP: "from-violet-600 to-purple-400",
    COCK:      "from-orange-600 to-red-400",
    FISH:      "from-cyan-500 to-teal-400",
  };

  return (
    <div className="space-y-5">
      {gameGroups.map((group) => {
        const gradient = headerGradient[group.game_type] ?? "from-gray-500 to-gray-400";
        return (
          <section key={group.game_type} className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
            <div className={`bg-gradient-to-r ${gradient} flex items-center justify-between px-4 py-3`}>
              <h2 className="text-[15px] font-bold text-white tracking-tight">
                {group.emoji} {(t as Record<string, string>)[group.game_type] ?? group.label}
              </h2>
              <Link href={`/${locale}/games/${group.game_type.toLowerCase()}`} className="text-[14px] font-semibold text-white/80 hover:text-white">
                {t.viewAll} ({group.providers.length}) →
              </Link>
            </div>
            <div className="px-4 py-3">
              <GameGroupSlider games={group.providers} gameType={group.game_type.toLowerCase()} />
            </div>
          </section>
        );
      })}
    </div>
  );
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

function DashboardGamesFallback() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-ap-border overflow-hidden animate-pulse bg-white shadow-card">
          <div className="h-11 bg-rose-200/70" />
          <div className="h-32 bg-slate-50" />
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const mode = getDashboardMode();
  const user = await getCurrentUser();

  return (
    <div className="relative min-h-screen bg-ap-bg pb-20 sm:pb-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-16 w-[360px] h-[360px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-[340px] h-[340px] rounded-full bg-blue-200/25 blur-3xl" />
      </div>
      <div className="relative max-w-5xl mx-auto px-5 pt-6 space-y-8">
        <BalanceCard
          phone={user?.phone ?? ""}
          displayName={user?.displayName ?? ""}
          initialData={user ? { balance: user.balance, diamond: user.diamond } : undefined}
        />
        <PromoBanner />
        {mode === "game" ? (
          <>
            <Suspense fallback={<DashboardGamesFallback />}>
              <DashboardGamesSection locale={locale} />
            </Suspense>
            <LotteryGroups />
          </>
        ) : (
          <Suspense fallback={<DashboardLotteryFallback />}>
            <DashboardLotterySection locale={locale} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
