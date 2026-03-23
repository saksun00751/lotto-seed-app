import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/NavbarServer";
import LotteryLayoutPage from "@/components/bet/LotteryLayoutPage";
import PromoBanner from "@/components/ui/PromoBanner";
import GameGroupSlider from "@/components/ui/GameGroupSlider";
import { requireAuth } from "@/lib/session/auth";
import { getLotteryCategories, getNumberLimits, getBetRates, getPastResults } from "@/lib/db/lottery";
import { getLotteryBetHistory } from "@/lib/db/bets";
import { getPromotions } from "@/lib/db/promotions";
import { getAllGamesGrouped } from "@/lib/db/games";
import type { Category } from "@/lib/categories";

export const metadata: Metadata = { title: "แทงหวย — Lotto" };

interface Props {
  searchParams?: Promise<{ lottery?: string }>;
}

function byIds(all: Category[], ids: string[]) {
  return ids.map((id) => all.find((c) => c.id === id)!).filter(Boolean);
}

function CategoryCard({ cat }: { cat: Category }) {
  const openCount = cat.items.filter((i) => i.isOpen).length;
  return (
    <Link
      href={`/category/${cat.id}`}
      className="bg-white rounded-2xl text-ap-primary relative overflow-hidden group hover:shadow-card-hover active:scale-[0.98] transition-all shadow-card border border-ap-border p-4"
    >
      <div className="text-[28px] mb-2">{cat.emoji} </div>
      <div className="font-bold tracking-tight leading-tight text-[15px]">{cat.label}</div>
      <div className="text-ap-secondary mt-0.5 text-[11px]">{cat.badge}</div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 bg-ap-bg rounded-full px-3 py-1 text-[11px] font-semibold text-ap-secondary group-hover:bg-ap-blue group-hover:text-white transition-colors">
          เลือก →
        </span>
        {openCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium bg-ap-bg rounded-full px-2 py-0.5 text-ap-green">
            <span className="w-1.5 h-1.5 rounded-full bg-ap-green animate-pulse inline-block" />
            {openCount} Live
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function BetRoute({ searchParams }: Props) {
  const [user, params, allCategories, promotions, gameGroups] = await Promise.all([
    requireAuth(),
    searchParams,
    getLotteryCategories(),
    getPromotions(),
    getAllGamesGrouped(),
  ]);
  const lottery = params?.lottery;
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  // มี lottery param → แสดงหน้าแทงหวย
  if (lottery) {
    const lotteryItem = allCategories.flatMap((c) => c.items).find((i) => i.id === lottery);
    const categoryItem = allCategories.find((c) => c.items.some((i) => i.id === lottery));

    const [numberLimitsFromDb, betRates, myBetHistory, pastResults] = await Promise.all([
      getNumberLimits(lottery),
      getBetRates(lottery),
      getLotteryBetHistory(user.id, lottery, 5),
      getPastResults(lottery, 5),
    ]);

    // Mock เลขอั้น 20 ตัว (ทดสอบ)
    const mockLimits = [
      { number: "123", betType: "top3",    maxAmount: 500,  isClosed: false, note: null },
      { number: "456", betType: "top3",    maxAmount: null, isClosed: true,  note: "ปิดรับ" },
      { number: "789", betType: "tod3",    maxAmount: 300,  isClosed: false, note: null },
      { number: "55",  betType: "top2",    maxAmount: 200,  isClosed: false, note: null },
      { number: "77",  betType: "bot2",    maxAmount: null, isClosed: true,  note: "ปิดรับ" },
      { number: "99",  betType: "run_top", maxAmount: 100,  isClosed: false, note: null },
      { number: "11",  betType: "run_bot", maxAmount: 150,  isClosed: false, note: null },
      { number: "222", betType: "top3",    maxAmount: 400,  isClosed: false, note: null },
      { number: "333", betType: "tod3",    maxAmount: null, isClosed: true,  note: "ปิดรับ" },
      { number: "444", betType: "top3",    maxAmount: 250,  isClosed: false, note: null },
      { number: "00",  betType: "top2",    maxAmount: null, isClosed: true,  note: "ปิดรับ" },
      { number: "88",  betType: "bot2",    maxAmount: 300,  isClosed: false, note: null },
      { number: "66",  betType: "run_top", maxAmount: 200,  isClosed: false, note: null },
      { number: "44",  betType: "run_bot", maxAmount: null, isClosed: true,  note: "ปิดรับ" },
      { number: "555", betType: "top3",    maxAmount: 600,  isClosed: false, note: null },
      { number: "666", betType: "tod3",    maxAmount: 350,  isClosed: false, note: null },
      { number: "777", betType: "top3",    maxAmount: null, isClosed: true,  note: "ปิดรับ" },
      { number: "33",  betType: "top2",    maxAmount: 180,  isClosed: false, note: null },
      { number: "22",  betType: "bot2",    maxAmount: 220,  isClosed: false, note: null },
      { number: "13",  betType: "run_top", maxAmount: null, isClosed: true,  note: "ปิดรับ" },
    ];
    const numberLimits = numberLimitsFromDb.length > 0 ? numberLimitsFromDb : mockLimits;

    const lotteryName  = lotteryItem?.name ?? lottery;
    const lotteryFlag  = lotteryItem?.flag ?? "";
    const categoryName = categoryItem?.label ?? "";
    const closeAt      = lotteryItem?.closeAt;

    return (
      <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
        <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
        <LotteryLayoutPage
          lotteryTypeId={lottery}
          lotteryName={lotteryName}
          lotteryFlag={lotteryFlag}
          categoryName={categoryName}
          closeAt={closeAt}
          numberLimits={numberLimits}
          betRates={betRates}
          myBetHistory={myBetHistory}
          pastResults={pastResults}
        />
      </div>
    );
  }

  // ไม่มี lottery param → แสดงหน้าเลือกหมวดหมู่
  const lottoCategories = byIds(allCategories, ["lotto-thai", "lotto-foreign", "lotto-stock", "lotto-daily"]);

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-8">

        <PromoBanner promos={promotions} />

        {/* หวย */}
        {lottoCategories.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold text-ap-primary mb-3 tracking-tight">🎯 หวย</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {lottoCategories.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} />
              ))}
            </div>
          </section>
        )}

        {/* เกมส์ */}
        {gameGroups.map((group) => {
          return (
            <section key={group.game_type} className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ap-border">
                <h2 className="text-[15px] font-bold text-ap-primary tracking-tight">
                  {group.emoji} {group.label}
                </h2>
                <Link href={`/games/${group.game_type.toLowerCase()}`} className="text-[12px] font-semibold text-ap-blue hover:underline">
                  ดูทั้งหมด ({group.games.length}) →
                </Link>
              </div>
              <div className="px-4 py-3">
                <GameGroupSlider games={group.games} gameType={group.game_type.toLowerCase()} />
              </div>
            </section>
          );
        })}

      </div>
    </div>
  );
}
