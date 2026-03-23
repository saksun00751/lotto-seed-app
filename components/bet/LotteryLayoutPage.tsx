"use client";

import { useState } from "react";
import Link from "next/link";
import { BetTypeId, BillRow, BET_RATE } from "./types";
import BetLeftSidebar  from "./BetLeftSidebar";
import type { NumberLimitRow } from "@/lib/db/lottery";
import BetTypeSelector from "./BetTypeSelector";
import BetQuickForm    from "./BetQuickForm";
import BetSlipSidebar  from "./BetSlipSidebar";
import { confirmBet }  from "@/app/actions/bet";
import type { BetRateRow, PastResultRow } from "@/lib/db/lottery";
import type { BetSlipSummary } from "@/lib/db/bets";
import CountdownTimer from "@/components/ui/CountdownTimer";

export default function LotteryLayoutPage({
  lotteryTypeId = "",
  lotteryName   = "หวยรัฐบาล",
  lotteryFlag   = "",
  categoryName  = "",
  closeAt,
  numberLimits  = [],
  betRates      = [],
  myBetHistory  = [],
  pastResults   = [],
}: {
  lotteryTypeId?: string;
  lotteryName?:  string;
  lotteryFlag?:  string;
  categoryName?: string;
  closeAt?:      string;
  numberLimits?: NumberLimitRow[];
  betRates?:     BetRateRow[];
  myBetHistory?: BetSlipSummary[];
  pastResults?:  PastResultRow[];
}) {
  const [bills,     setBills]     = useState<BillRow[]>([]);
  const [betType,   setBetType]   = useState<BetTypeId>("3top");
  const [isClassic, setIsClassic] = useState(false);

  const rateMap = betRates.length
    ? Object.fromEntries(betRates.map((r) => [r.id, parseFloat(r.rate)])) as Partial<Record<BetTypeId, number>>
    : {} as Partial<Record<BetTypeId, number>>;
  const getRate = (id: BetTypeId) => rateMap[id] ?? BET_RATE[id];

  const totalAmount = bills.reduce((s, b) => s + b.top + b.bot, 0);
  const totalMaxWin = bills.reduce((s, b) => s + (b.top + b.bot) * getRate(b.betType), 0);

  const handleAddBills = (rows: BillRow[]) => setBills((prev) => [...prev, ...rows]);
  const handleDelete   = (id: string)      => setBills((prev) => prev.filter((b) => b.id !== id));
  const handleClearAll = ()                => setBills([]);
  const changeBetType  = (t: BetTypeId)   => setBetType(t);

  const handleConfirm = async () => {
    const result = await confirmBet(lotteryTypeId, bills);
    if (result.ok) setBills([]);
    return result;
  };

  return (
    <div className="min-h-screen bg-ap-bg">

      {/* ── Breadcrumb bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ap-border px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 text-[14px] min-w-0">
          <Link href="/dashboard" className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">หน้าหลัก</Link>
          <span className="text-ap-tertiary shrink-0">›</span>
          <Link href="/bet" className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">แทงหวย</Link>
          {categoryName && <>
            <span className="text-ap-tertiary shrink-0">›</span>
            <Link href="/bet" className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0 hidden sm:inline">{categoryName}</Link>
          </>}
          <span className="text-ap-tertiary shrink-0">›</span>
          <span className="font-bold text-ap-primary truncate">{lotteryFlag && <span className="mr-1">{lotteryFlag}</span>}{lotteryName}</span>
        </div>
        {closeAt && (
          <div className="flex items-center gap-1.5 text-ap-red font-bold text-[15px] shrink-0 ml-3">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            <CountdownTimer closeAt={closeAt} />
          </div>
        )}
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-3 py-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4">

          {/* Left sidebar */}
          <BetLeftSidebar lotteryName={lotteryName} numberLimits={numberLimits} myBetHistory={myBetHistory} pastResults={pastResults} />

          {/* Main column */}
          <div className="space-y-3">
            <BetTypeSelector betType={betType} onChange={changeBetType} betRates={betRates} disabled={isClassic} />
            <BetQuickForm
              betType={betType}
              lotteryName={lotteryName}
              lotteryFlag={lotteryFlag}
              closeAt={closeAt}
              bills={bills}
              totalAmount={totalAmount}
              numberLimits={numberLimits}
              onAddBills={handleAddBills}
              onClearAll={handleClearAll}
              onTabChange={(tab) => setIsClassic(tab === "classic")}
            />
          </div>

          {/* Right sidebar */}
          <BetSlipSidebar
            bills={bills}
            lotteryName={lotteryName}
            closeAt={closeAt}
            totalAmount={totalAmount}
            totalMaxWin={totalMaxWin}
            betRates={betRates}
            onDelete={handleDelete}
            onClearAll={handleClearAll}
            onConfirm={handleConfirm}
          />

        </div>
      </div>
    </div>
  );
}
