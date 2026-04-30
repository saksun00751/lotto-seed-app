"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/context";
import { getTranslation } from "@/lib/i18n/getTranslation";
import { BetTypeId, BillRow, BET_TYPE_BTNS } from "./types";
import BetLeftSidebar  from "./BetLeftSidebar";
import type { NumberLimitRow } from "@/lib/types/bet";
import BetTypeSelector from "./BetTypeSelector";
import BetQuickForm    from "./BetQuickForm";
import BetSlipSidebar  from "./BetSlipSidebar";
import { confirmBet }  from "@/app/actions/bet";
import type { BetRateRow, BettingContext } from "@/lib/types/bet";
import CountdownTimer from "@/components/ui/CountdownTimer";

export default function LotteryLayoutPage({
  lotteryTypeId = "",
  drawId,
  lotteryName   = "",
  lotteryFlag   = "",
  lotteryLogo,
  categoryName  = "",
  closeAt,
  numberLimits  = [],
  betRates      = [],
  selectedPackage,
  bettingContext,
}: {
  lotteryTypeId?:   string;
  drawId?:          number;
  lotteryName?:     string;
  lotteryFlag?:     string;
  lotteryLogo?:     string;
  categoryName?:    string;
  closeAt?:         string;
  numberLimits?:    NumberLimitRow[];
  betRates?:        BetRateRow[];
  selectedPackage?: { id?: number; name: string; image?: string; discountPercent?: number };
  bettingContext?:  BettingContext;
}) {
  const { lang } = useLang();
  const t = getTranslation(lang, "bet");
  const [bills,       setBills]       = useState<BillRow[]>([]);
  const [betType,     setBetType]     = useState<BetTypeId>("3top");
  const [selected3,   setSelected3]   = useState<BetTypeId[]>(["3top"]);
  const [selected2,   setSelected2]   = useState<BetTypeId[]>(["2top"]);
  const [selectedRun, setSelectedRun] = useState<BetTypeId[]>(["run"]);
  const [specialMode, setSpecialMode] = useState<BetTypeId | null>(null);
  const [isClassic,   setIsClassic]   = useState(false);
  const [tripleTrigger, setTripleTrigger] = useState(0);
  const [doubleTrigger, setDoubleTrigger] = useState(0);

  const availableBetTypeIds = betRates.map((r) => r.id);
  // เพิ่ม run/winlay อัตโนมัติถ้า API ไม่ส่งมา แต่มี 2top อยู่
  const enrichedIds: BetTypeId[] = [...availableBetTypeIds];
  if (availableBetTypeIds.includes("2top")) {
    if (!enrichedIds.includes("run"))    enrichedIds.push("run");
    if (!enrichedIds.includes("winlay")) enrichedIds.push("winlay");
  }
  const specialTypes: BetTypeId[] = ["2perm", "3perm", "6perm", "19door"];
  const selectorTypeIds = enrichedIds.length
    ? enrichedIds.filter((id) => !specialTypes.includes(id))
    : BET_TYPE_BTNS.map((b) => b.id).filter((id) => !specialTypes.includes(id));

  useEffect(() => {
    if (!availableBetTypeIds.length) return;
    if (!enrichedIds.includes(betType)) {
      setBetType(enrichedIds[0] ?? availableBetTypeIds[0]);
    }
  }, [availableBetTypeIds, betType]);

  // effectiveBetType = โหมดพิเศษถ้าเลือกอยู่ มิฉะนั้นใช้ betType ปกติ
  const effectiveBetType: BetTypeId = specialMode ?? betType;

  const totalAmount = bills.reduce((s, b) => s + b.top + b.bot, 0);

  const handleAddBills = (rows: BillRow[]) => setBills((prev) => [...prev, ...rows]);
  const handleDelete   = (id: string)      => setBills((prev) => prev.filter((b) => b.id !== id));
  const handleClearAll = ()                => setBills([]);
  const handleUpdateAmount = (id: string, amount: number) =>
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, top: amount } : b)));
  const handleSetAllAmount = (amount: number) =>
    setBills((prev) => prev.map((b) => ({ ...b, top: amount })));

  const changeBetType = (id: BetTypeId) => {
    setBetType(id);
    setSpecialMode(null);
    // reset selected3 เมื่อเข้ากลุ่ม 3 ตัว
    if (id === "3top" || id === "3tod") setSelected3(["3top"]);
    if (id === "2top" || id === "2bot") setSelected2(["2top"]);
    if (id === "run" || id === "winlay") setSelectedRun(["run"]);
  };
  const toggle3Type = (id: BetTypeId) => {
    setSelected3((prev) => {
      const has = prev.includes(id);
      if (has && prev.length <= 1) return prev; // ห้ามปิดทั้งคู่
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };
  const toggle2Type = (id: BetTypeId) => {
    setSelected2((prev) => {
      const has = prev.includes(id);
      if (has && prev.length <= 1) return prev; // ห้ามปิดทั้งคู่
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };
  const toggleRunType = (id: BetTypeId) => {
    setSelectedRun((prev) => {
      const has = prev.includes(id);
      if (has && prev.length <= 1) return prev; // ห้ามปิดทั้งคู่
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };
  const changeSpecialMode = (id: BetTypeId) => {
    setSpecialMode((prev) => (prev === id ? null : id)); // toggle
  };

  const handleConfirm = async () => {
    return confirmBet(drawId, selectedPackage?.id, bills);
  };
  const handleConfirmSuccess = () => {
    setBills([]);
  };

  return (
    <div className="min-h-screen bg-ap-bg">

      {/* ── Breadcrumb bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ap-border px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 text-[14px] min-w-0">
          <Link href={`/${lang}/dashboard`} className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">{t.home}</Link>
          <span className="text-ap-tertiary shrink-0">›</span>
          <Link href={`/${lang}/bet`} className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">{t.title}</Link>
          {categoryName && <>
            <span className="text-ap-tertiary shrink-0">›</span>
            <Link href={`/${lang}/bet`} className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0 hidden sm:inline">{categoryName}</Link>
          </>}
          <span className="text-ap-tertiary shrink-0">›</span>
          <span className="font-bold text-ap-primary truncate flex items-center gap-1.5 min-w-0">
            {lotteryLogo
              ? <img src={lotteryLogo} alt={lotteryName} className="w-6 h-6 rounded-full object-cover shrink-0" />
              : lotteryFlag ? <span className="shrink-0">{lotteryFlag}</span> : null
            }
            <span className="truncate">{lotteryName}</span>
          </span>
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
          <BetLeftSidebar lotteryName={lotteryName} numberLimits={numberLimits} selectedPackage={selectedPackage} />

          {/* Main column */}
          <div className="space-y-3">
            <BetTypeSelector betType={betType} onChange={changeBetType} selected3={selected3} selected2={selected2} selectedRun={selectedRun} onToggle3={toggle3Type} onToggle2={toggle2Type} onToggleRun={toggleRunType} visibleIds={selectorTypeIds} disabled={isClassic} bettingContext={bettingContext} />

            {/* โหมดพิเศษ */}
            {(() => {
              const specialModes: { id: BetTypeId; label: string }[] = [
                { id: "2perm",  label: t.betType2perm },
                { id: "3perm",  label: t.betType3perm },
                { id: "6perm",  label: t.betType6perm },
                { id: "19door", label: t.betType19door },
              ];
              const visible = specialModes.filter((m) => {
                if (m.id === "2perm")  return betType === "2top" || betType === "2bot";
                if (m.id === "3perm")  return betType === "3top" || betType === "3tod";
                if (m.id === "6perm")  return betType === "3top" || betType === "3tod";
                if (m.id === "19door") return betType === "2top" || betType === "2bot";
                return false;
              });
              const show3Tong = betType === "3top" || betType === "3tod";
              const show2Double = betType === "2top" || betType === "2bot";
              if ((!visible.length && !show3Tong && !show2Double) || isClassic) return null;
              return (
                <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
                  <div className="px-4 py-2.5 bg-gradient-to-r from-ap-blue to-sky-400 border-b border-ap-border">
                    <p className="text-[14px] text-white font-bold uppercase tracking-wide">{t.specialModeTitle}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {visible.map((mode) => {
                      const active = specialMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => changeSpecialMode(mode.id)}
                          className={[
                            "py-2 rounded-xl text-[14px] font-bold border transition-all",
                            active
                              ? "bg-violet-50 border-violet-300 text-violet-700"
                              : "bg-white border-ap-border text-ap-primary hover:border-ap-blue/30",
                          ].join(" ")}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                    {show3Tong && (
                      <button
                        type="button"
                        onClick={() => setTripleTrigger((n) => n + 1)}
                        className="py-2 rounded-xl text-[14px] font-bold border transition-all bg-white border-ap-border text-ap-primary hover:border-yellow-400 hover:bg-yellow-50 active:scale-95"
                      >
                        {t.tripleNumbers}
                      </button>
                    )}
                    {show2Double && (
                      <button
                        type="button"
                        onClick={() => setDoubleTrigger((n) => n + 1)}
                        className="py-2 rounded-xl text-[14px] font-bold border transition-all bg-white border-ap-border text-ap-primary hover:border-yellow-400 hover:bg-yellow-50 active:scale-95"
                      >
                        {t.doubleNumbers}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <BetQuickForm
              betType={effectiveBetType}
              baseBetType={betType}
              selected3={selected3}
              selected2={selected2}
              selectedRun={selectedRun}
              lotteryName={lotteryName}
              lotteryFlag={lotteryFlag}
              lotteryLogo={lotteryLogo}
              closeAt={closeAt}
              bills={bills}
              totalAmount={totalAmount}
              numberLimits={numberLimits}
              bettingContext={bettingContext}
              onAddBills={handleAddBills}
              onClearAll={handleClearAll}
              tripleTrigger={tripleTrigger}
              doubleTrigger={doubleTrigger}
              onTabChange={(tab) => setIsClassic(tab === "classic")}
            />
          </div>

          {/* Right sidebar */}
          <BetSlipSidebar
            bills={bills}
            drawId={drawId}
            packageId={selectedPackage?.id}
            bettingContext={bettingContext}
            lotteryName={lotteryName}
            lotteryFlag={lotteryFlag}
            lotteryLogo={lotteryLogo}
            closeAt={closeAt}
            totalAmount={totalAmount}
            onDelete={handleDelete}
            onUpdateAmount={handleUpdateAmount}
            onSetAllAmount={handleSetAllAmount}
            onClearAll={handleClearAll}
            onConfirm={handleConfirm}
            onConfirmSuccess={handleConfirmSuccess}
          />

        </div>
      </div>
    </div>
  );
}
