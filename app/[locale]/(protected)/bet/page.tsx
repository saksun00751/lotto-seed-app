import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import LotteryLayoutPage from "@/components/bet/LotteryLayoutPage";
import BetToastNotice from "@/components/bet/BetToastNotice";
import PromoBanner from "@/components/ui/PromoBanner";
import GameGroupSlider from "@/components/ui/GameGroupSlider";
import { getBetPageData } from "@/lib/server/bet";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import { mapMarketsToCategories } from "@/lib/api/lotto";
import type { MarketsLatestResponse } from "@/lib/api/lotto";
import { getAllGamesGroupedFromApi } from "@/lib/api/games";
import { getTranslation } from "@/lib/i18n/getTranslation";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";
import type { Category } from "@/lib/categories";
import type { BetRateRow, BettingContext, BettingContextItem, NumberLimitRow } from "@/lib/types/bet";
import type { BetTypeId } from "@/components/bet/types";
import { Suspense } from "react";


interface SelectedPackageResponse {
  success: boolean;
  selected: boolean;
  message?: string;
  data?: {
    group_id?: number;
    package_id?: number;
    name?: string;
    image?: string;
    discount_percent?: number;
    bet_settings?: Array<{
      bet_type: string;
      payout?: number;
      discount_percent?: number;
    }>;
  };
}

interface Props {
  params?: Promise<{ locale: string }>;
  searchParams?: Promise<{ lottery?: string; draw_id?: string; toast?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params)?.locale ?? "th";
  return { title: await getPageMetaTitle(locale, "bet") };
}

interface DrawDetailResponse {
  success: boolean;
  data?: {
    id?: number;
    draw_id?: number;
    draw_date?: string;
    open_at?: string;
    close_at?: string;
    status?: string;
    market_id?: number | string;
    market_code?: string;
    market?: {
      id?: number | string;
      name?: string;
      group_id?: number;
      logo?: string;
      icon?: string;
      group_name?: string;
    } | null;
    bet_settings?: Array<{
      bet_type: string;
      bet_type_label: string;
      is_enabled: boolean;
      min_bet: number;
      max_bet: number;
      max_per_number: number;
    }>;
  } | null;
}

type DrawBetSetting = {
  bet_type: string;
  bet_type_label: string;
  is_enabled: boolean;
  min_bet: number;
  max_bet: number;
  max_per_number: number;
};

function bkkToIso(dt?: string): string | undefined {
  if (!dt) return undefined;
  return new Date(dt.replace(" ", "T") + "+07:00").toISOString();
}

const API_BET_TYPE_TO_ID: Record<string, BetTypeId> = {
  top_3: "3top",   tod_3: "3tod",
  top_2: "2top",   bottom_2: "2bot",
  run_top: "run",  run_bottom: "winlay",
  // direct naming fallback
  "3top": "3top", "3tod": "3tod", "2top": "2top", "2bot": "2bot",
  "run": "run",   "winlay": "winlay",
};

interface BettingContextApiItem {
  bet_type:        string;
  payout?:         number;
  pay_rate?:       number;
  min_bet?:        number;
  max_bet?:        number;
  max_per_number?: number;
  discount_percent?: number;
}
interface BlockedNumberItem {
  bet_type:   string;
  number:     string;
  mode:       string;   // "block" | "limit"
  reason?:    string;
  max_amount?: number;
}
interface BettingContextApiResponse {
  success: boolean;
  data?: (BettingContextApiItem[] | {
    bet_types?:       BettingContextApiItem[];
    limits?: {
      min_bet?: number;
      max_bet?: number;
      max_per_number?: number;
      bet_types?: BettingContextApiItem[];
    };
    blocked_numbers?: { count?: number; items?: BlockedNumberItem[] };
  }) | null;
}

// API bet_type → NumberLimitRow.betType (DB format)
const API_BET_TYPE_TO_DB: Record<string, string> = {
  top_3:    "top3",
  tod_3:    "tod3",
  top_2:    "top2",
  bottom_2: "bot2",
  run_top:  "run_top",
  run_bottom: "run_bot",
};

function mapBlockedNumbers(res: BettingContextApiResponse | null): NumberLimitRow[] {
  if (!res?.success || !res.data || Array.isArray(res.data)) return [];
  const items = res.data.blocked_numbers?.items ?? [];
  return items.map((item): NumberLimitRow => ({
    number:    item.number,
    betType:   API_BET_TYPE_TO_DB[item.bet_type] ?? item.bet_type,
    maxAmount: item.mode === "limit" ? (item.max_amount ?? null) : null,
    isClosed:  item.mode === "block",
    note:      item.reason ?? null,
  }));
}

function mapBettingContext(res: BettingContextApiResponse | null): BettingContext {
  if (!res?.success || !res.data) return {};
  const items: BettingContextApiItem[] = Array.isArray(res.data)
    ? res.data
    : (res.data.bet_types ?? res.data.limits?.bet_types ?? []);
  const ctx: BettingContext = {};
  for (const item of items) {
    const id = API_BET_TYPE_TO_ID[item.bet_type];
    if (!id) continue;
    ctx[id] = {
      payout:       item.payout ?? item.pay_rate ?? 0,
      minBet:       Number(item.min_bet ?? 0),
      maxBet:       Number(item.max_bet ?? 0),
      maxPerNumber: Number(item.max_per_number ?? 0),
      discountPercent: item.discount_percent ?? 0,
    } satisfies BettingContextItem;
  }
  return ctx;
}

function mapDrawSettingsToBetRates(settings?: DrawBetSetting[]): BetRateRow[] {
  if (!settings || !Array.isArray(settings)) return [];
  return settings
    .filter((s) => s?.is_enabled)
    .map((s) => {
      const id = API_BET_TYPE_TO_ID[s.bet_type];
      if (!id) return null;
      return {
        id,
        label: s.bet_type_label,
        rate: "0",
        minAmount: Number(s.min_bet ?? 1),
        maxAmount: Number(s.max_bet ?? 0),
        isActive: true,
      } satisfies BetRateRow;
    })
    .filter(Boolean) as BetRateRow[];
}

function applyPackageBetSettings(
  base: BettingContext,
  selectedPkgRes: SelectedPackageResponse | null,
  drawSettings?: DrawBetSetting[],
): BettingContext {
  const packageSettings = selectedPkgRes?.selected ? (selectedPkgRes.data?.bet_settings ?? []) : [];
  if (!packageSettings.length) return base;

  const next: BettingContext = { ...base };
  const drawSettingMap = new Map<BetTypeId, DrawBetSetting>();
  for (const s of drawSettings ?? []) {
    const id = API_BET_TYPE_TO_ID[(s.bet_type ?? "").toLowerCase()];
    if (!id) continue;
    drawSettingMap.set(id, s);
  }

  for (const row of packageSettings) {
    const id = API_BET_TYPE_TO_ID[(row.bet_type ?? "").toLowerCase()];
    if (!id) continue;
    const current = next[id];
    const seed = drawSettingMap.get(id);
    next[id] = {
      payout: Number(row.payout ?? current?.payout ?? 0),
      minBet: Number(current?.minBet ?? seed?.min_bet ?? 1),
      maxBet: Number(current?.maxBet ?? seed?.max_bet ?? 0),
      maxPerNumber: Number(current?.maxPerNumber ?? seed?.max_per_number ?? 0),
      discountPercent: Number(row.discount_percent ?? current?.discountPercent ?? 0),
    };
  }
  return next;
}

const LOTTO_BG_GRADIENTS = [
  "from-blue-700 to-red-600",
  "from-emerald-600 to-teal-400",
  "from-sky-600 to-cyan-400",
  "from-yellow-500 to-orange-500",
  "from-violet-600 to-purple-400",
  "from-rose-500 to-pink-400",
];

function CategoryCard({
  cat,
  playLabel,
  liveLabel,
  emptyDescription,
  locale,
  gradientClass,
}: {
  cat: Category;
  playLabel: string;
  liveLabel: string;
  emptyDescription: string;
  locale: string;
  gradientClass: string;
}) {
  const code = cat.code ?? cat.id;
  const openCount = cat.items.filter((i) => i.isOpen).length;
  return (
    <Link
      href={`/${locale}/category/${code}`}
      className={`bg-gradient-to-br ${gradientClass} rounded-2xl relative overflow-hidden group active:scale-[0.98] transition-all shadow-card p-4 min-h-[170px] flex flex-col justify-between`}
    >
      <span className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      <span className="absolute -bottom-6 -right-2 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

      <div>
        <div className="font-bold tracking-tight leading-tight text-[15px] text-white flex items-center gap-2">
          {cat.groupLogo ? (
            <img src={cat.groupLogo} alt={cat.label} className="w-6 h-6 object-cover shrink-0" />
          ) : null}
          <span className="truncate">{cat.label}</span>
        </div>
        <div className="text-white/70 mt-0.5 text-[14px] leading-snug ">{cat.description || emptyDescription}</div>
      </div>

      <div className="mt-3 h-[24px] flex items-center gap-2">
        <span className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-1 text-[14px] font-semibold text-white">
          {playLabel}
        </span>
        {openCount > 0 && (
          <span className="flex items-center gap-1 text-[14px] font-medium bg-white/20 rounded-full px-2 py-0.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block" />
            {openCount} {liveLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function BetRoute({ params, searchParams }: Props) {
  const [{ locale }, sp, apiToken, lang] = await Promise.all([
    params ?? Promise.resolve({ locale: "th" }),
    searchParams,
    getApiToken(),
    getLangCookie(),
  ]);

  const token = apiToken ?? undefined;
  const t = getTranslation(lang, "bet");

  let allCategories: Category[] = [];
  let gameGroups: Awaited<ReturnType<typeof getAllGamesGroupedFromApi>> = [];
  const drawIdFromQuery = sp?.draw_id ? Number(sp.draw_id) : undefined;
  let drawDetail: DrawDetailResponse["data"] | null = null;
  try {
    const drawReq = Number.isFinite(drawIdFromQuery)
      ? apiGet<DrawDetailResponse>(`/lotto/draws/${drawIdFromQuery}`, token, lang)
      : Promise.resolve(null);
    const [marketsRes, groups, drawRes] = await Promise.all([
      apiGet<MarketsLatestResponse>("/lotto/markets/latest", token, lang),
      getAllGamesGroupedFromApi(token, lang),
      drawReq,
    ]);
    if (marketsRes?.data?.groups) allCategories = mapMarketsToCategories(marketsRes.data.groups);
    gameGroups = groups;
    drawDetail = drawRes?.data ?? null;
  } catch {}

  const lotteryFromDrawApi =
    drawDetail?.market?.id !== undefined && drawDetail?.market?.id !== null
      ? String(drawDetail.market.id)
      : drawDetail?.market_id !== undefined && drawDetail?.market_id !== null
      ? String(drawDetail.market_id)
      : (drawDetail?.market_code ? String(drawDetail.market_code) : undefined);
  const lotteryFromDraw = Number.isFinite(drawIdFromQuery)
    ? allCategories
        .flatMap((c) => c.items)
        .find((i) => i.drawId === drawIdFromQuery)?.id
    : undefined;
  const lottery = sp?.lottery ?? lotteryFromDrawApi ?? lotteryFromDraw;

  // มี lottery param → แสดงหน้าแทงหวย
  if (lottery) {
    const lotteryItem = allCategories.flatMap((c) => c.items).find((i) => i.id === lottery);
    const categoryItem = allCategories.find((c) => c.items.some((i) => i.id === lottery));

    const groupId = drawDetail?.market?.group_id;
    const [{ drawId, numberLimits, betRates }, selectedPkgRes, bettingCtxRes] = await Promise.all([
      getBetPageData(lottery, token, lang),
      groupId
        ? apiGet<SelectedPackageResponse>(`/lotto/groups/${groupId}/selected-package`, token, lang).catch(() => null)
        : Promise.resolve(null),
      apiGet<BettingContextApiResponse>(`/lotto/markets/${lottery}/betting-context`, token, lang).catch(() => null),
    ]);
    const baseBettingContext = mapBettingContext(bettingCtxRes);
    const bettingContext = applyPackageBetSettings(baseBettingContext, selectedPkgRes, drawDetail?.bet_settings);

    // merge blocked numbers จาก betting-context เข้ากับ numberLimits
    const ctxBlocked = mapBlockedNumbers(bettingCtxRes);
    const mergedLimits: NumberLimitRow[] = [
      ...ctxBlocked,
      // เก็บ numberLimits เดิมที่ไม่ซ้ำกับ ctxBlocked
      ...numberLimits.filter(
        (r) => !ctxBlocked.some((c) => c.number === r.number && c.betType === r.betType)
      ),
    ];

    // ต้องมี package ที่เลือกแล้วเท่านั้น ถึงจะเข้าหน้าแทงได้
    const hasSelectedPackage =
      selectedPkgRes?.success === true &&
      selectedPkgRes?.selected === true &&
      Number.isFinite(selectedPkgRes?.data?.package_id);
    if (!hasSelectedPackage) {
      const toastMsg = encodeURIComponent(t.noPackageToast ?? "กรุณาเลือก Package ก่อนแทงหวย");
      const backTo = categoryItem?.code
        ? `/${locale}/category/${categoryItem.code}`
        : `/${locale}/bet`;
      redirect(`${backTo}?toast=${toastMsg}`);
    }

    const finalDrawId = Number.isFinite(drawIdFromQuery)
      ? drawIdFromQuery
      : (drawDetail?.id ?? drawDetail?.draw_id ?? drawId ?? undefined);
    const drawBetRates = mapDrawSettingsToBetRates(drawDetail?.bet_settings);
    const finalBetRates = drawBetRates.length > 0 ? drawBetRates : betRates;

    const lotteryName  = lotteryItem?.name ?? drawDetail?.market?.name ?? lottery;
    const lotteryFlag  = lotteryItem?.flag ?? "";
    const lotteryLogo  = lotteryItem?.logo ?? drawDetail?.market?.logo ?? drawDetail?.market?.icon;
    const categoryName = categoryItem?.label ?? drawDetail?.market?.group_name ?? "";
    const closeAt      = lotteryItem?.closeAt ?? bkkToIso(drawDetail?.close_at);

    const selectedPackage = selectedPkgRes?.selected && selectedPkgRes.data
      ? {
          id: selectedPkgRes.data.package_id,
          name: selectedPkgRes.data.name ?? "",
          image: selectedPkgRes.data.image,
          discountPercent: selectedPkgRes.data.discount_percent,
        }
      : undefined;

    return (
      <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
        <LotteryLayoutPage
          lotteryTypeId={lottery}
          drawId={finalDrawId}
          lotteryName={lotteryName}
          lotteryFlag={lotteryFlag}
          lotteryLogo={lotteryLogo}
          categoryName={categoryName}
          closeAt={closeAt}
          numberLimits={mergedLimits}
          betRates={finalBetRates}
          selectedPackage={selectedPackage}
          bettingContext={bettingContext}
        />
      </div>
    );
  }

  // ไม่มี lottery param → แสดงหน้าเลือกหมวดหมู่
  const lottoCategories = allCategories;

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Suspense fallback={null}>
        <BetToastNotice />
      </Suspense>
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-8">

        <PromoBanner  />

        {/* หวย */}
        {lottoCategories.length > 0 && (
          <section className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
            <div className="bg-gradient-to-r from-ap-blue to-sky-400 px-4 py-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-white tracking-tight">{t.lotto}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
             

              {lottoCategories.map((cat, idx) => (
                
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  playLabel={t.play}
                  liveLabel={t.live}
                  emptyDescription={t.emptyDescription}
                  locale={locale}
                  gradientClass={LOTTO_BG_GRADIENTS[idx % LOTTO_BG_GRADIENTS.length]}
                />
              ))}
            </div>
          </section>
        )}

        {/* เกมส์ */}
        {gameGroups.map((group) => {
          const headerGradient: Record<string, string> = {
            SLOT:      "from-rose-500 to-pink-400",
            CASINO:    "from-amber-500 to-yellow-400",
            SPORT:     "from-green-600 to-lime-400",
            CARDGROUP: "from-violet-600 to-purple-400",
            COCK:      "from-orange-600 to-red-400",
            FISH:      "from-cyan-500 to-teal-400",
          };
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
    </div>
  );
}
