"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/context";
import { getTranslation } from "@/lib/i18n/getTranslation";
import { BetTypeId, BillRow, BET_TYPE_BTNS } from "./types";
import BetLeftSidebar  from "./BetLeftSidebar";
import type { NumberLimitRow } from "@/lib/types/bet";
import BetTypeSelector from "./BetTypeSelector";
import BetQuickForm    from "./BetQuickForm";
import BetSlipSidebar  from "./BetSlipSidebar";
import YeekeeShootForm from "./YeekeeShootForm";
import YeekeeShootsList from "./YeekeeShootsList";
import { confirmBet }  from "@/app/actions/bet";
import type { BetRateRow, BettingContext } from "@/lib/types/bet";
import CountdownTimer from "@/components/ui/CountdownTimer";

export interface YeekeeInfo {
  roundId?:        number;
  roundNo?:         number;
  formulaLabel?:    string;
  drawDate?:        string;
  betOpenAt?:       string;
  betCloseAt?:      string;
  shootOpenAt?:     string;
  shootCloseAt?:    string;
  resultComputeAt?: string;
  statusLabel?:     string;
}

export interface LotteryInfo {
  drawDate?:    string;
  openAt?:      string;
  closeAt?:     string;
  statusLabel?: string;
}

function isCloseAtExpired(closeAt?: string): boolean {
  return !!closeAt && new Date(closeAt).getTime() <= Date.now();
}

type LotteryTab = "bet" | "shoot" | "rules";

function normalizeLotteryTab(tab: string | null, hasYeekee: boolean): LotteryTab {
  if (tab === "shoot" && hasYeekee) return "shoot";
  if (tab === "rules") return "rules";
  return "bet";
}

export default function LotteryLayoutPage({
  lotteryTypeId = "",
  drawId,
  lotteryName   = "",
  lotteryFlag   = "",
  lotteryLogo,
  categoryName  = "",
  categoryCode  = "",
  closeAt,
  numberLimits  = [],
  betRates      = [],
  selectedPackage,
  bettingContext,
  yeekeeInfo,
  lotteryInfo,
}: {
  lotteryTypeId?:   string;
  drawId?:          number;
  lotteryName?:     string;
  lotteryFlag?:     string;
  lotteryLogo?:     string;
  categoryName?:    string;
  categoryCode?:    string;
  closeAt?:         string;
  numberLimits?:    NumberLimitRow[];
  betRates?:        BetRateRow[];
  selectedPackage?: { id?: number; name: string; image?: string; discountPercent?: number };
  bettingContext?:  BettingContext;
  yeekeeInfo?:      YeekeeInfo;
  lotteryInfo?:     LotteryInfo;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = getTranslation(lang, "bet");
  const [bills,       setBills]       = useState<BillRow[]>([]);
  const [betType,     setBetType]     = useState<BetTypeId>("3top");
  const [selected3,   setSelected3]   = useState<BetTypeId[]>([]);
  const [selected2,   setSelected2]   = useState<BetTypeId[]>([]);
  const [selectedRun, setSelectedRun] = useState<BetTypeId[]>([]);
  const [specialMode, setSpecialMode] = useState<BetTypeId | null>(null);
  const [isClassic,   setIsClassic]   = useState(false);
  const [tripleTrigger, setTripleTrigger] = useState(0);
  const [doubleTrigger, setDoubleTrigger] = useState(0);
  const [closedModalOpen, setClosedModalOpen] = useState(() => isCloseAtExpired(closeAt));
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [activeTab, setActiveTab] = useState<LotteryTab>(() => normalizeLotteryTab(searchParams.get("tab"), Boolean(yeekeeInfo)));

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

  useEffect(() => {
    setClosedModalOpen(isCloseAtExpired(closeAt));
    setRedirectCountdown(3);
    if (!closeAt) return;

    const diff = new Date(closeAt).getTime() - Date.now();
    if (diff <= 0) return;

    const id = setTimeout(() => {
      setRedirectCountdown(3);
      setClosedModalOpen(true);
    }, diff);
    return () => clearTimeout(id);
  }, [closeAt]);

  useEffect(() => {
    if (!closedModalOpen) return;
    if (redirectCountdown <= 0) {
      router.replace(`/${lang}/bet`);
      return;
    }
    const id = setTimeout(() => setRedirectCountdown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [closedModalOpen, redirectCountdown, router, lang]);

  // effectiveBetType = โหมดพิเศษถ้าเลือกอยู่ มิฉะนั้นใช้ betType ปกติ
  const effectiveBetType: BetTypeId = specialMode ?? betType;

  const totalAmount = bills.reduce((s, b) => s + b.top + b.bot, 0);

  useEffect(() => {
    const nextTab = normalizeLotteryTab(searchParams.get("tab"), Boolean(yeekeeInfo));
    setActiveTab((current) => current === nextTab ? current : nextTab);
  }, [searchParams, yeekeeInfo]);

  const changeActiveTab = (tab: LotteryTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "bet") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

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
    // เปลี่ยนกลุ่ม: ตั้ง chip ที่กดเป็นรายการเดียวที่ถูกเลือก, ล้างกลุ่มอื่น
    if (id === "3top" || id === "3tod") {
      setSelected3([id]);
      setSelected2([]);
      setSelectedRun([]);
    } else if (id === "2top" || id === "2bot") {
      setSelected2([id]);
      setSelected3([]);
      setSelectedRun([]);
    } else if (id === "run" || id === "winlay") {
      setSelectedRun([id]);
      setSelected3([]);
      setSelected2([]);
    }
  };
  const toggle3Type = (id: BetTypeId) => {
    setSelected3((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setBetType(id);
  };
  const toggle2Type = (id: BetTypeId) => {
    setSelected2((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setBetType(id);
  };
  const toggleRunType = (id: BetTypeId) => {
    setSelectedRun((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setBetType(id);
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
  const handleClosedRedirect = () => {
    router.replace(`/${lang}/bet`);
  };
  return (
    <div className="min-h-screen bg-ap-bg">
      {closedModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-card-xl border border-ap-border overflow-hidden animate-pop-in">
            <div className="px-5 py-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-ap-red/10 border border-ap-red/15 text-ap-red flex items-center justify-center mb-4">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-[18px] font-extrabold text-ap-primary">{t.closedModalTitle}</h2>
              <p className="mt-2 text-[14px] font-medium text-ap-secondary leading-relaxed">
                {t.closedModalMessage.replace("{n}", String(redirectCountdown))}
              </p>
              <button
                type="button"
                onClick={handleClosedRedirect}
                className="mt-5 w-full rounded-2xl bg-ap-blue hover:bg-ap-blue-h text-white text-[15px] font-bold py-3 transition-colors active:scale-[0.98]"
              >
                {t.closedModalAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Breadcrumb bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ap-border px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 text-[14px] min-w-0">
          <Link href={`/${lang}/dashboard`} className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">{t.home}</Link>
          <span className="text-ap-tertiary shrink-0">›</span>
          <Link href={`/${lang}/bet`} className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0">{t.title}</Link>
          {categoryName && <>
            <span className="text-ap-tertiary shrink-0">›</span>
            <Link
              href={categoryCode ? `/${lang}/category/${categoryCode}` : `/${lang}/bet`}
              className="text-ap-secondary hover:text-ap-primary transition-colors shrink-0 hidden sm:inline"
            >
              {categoryName}
            </Link>
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

      {/* ── Yeekee round info banner ──────────────────────────────────────── */}
      {yeekeeInfo && (
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-4 py-3 overflow-x-auto">
          <div className="max-w-[1280px] mx-auto flex items-center justify-center gap-x-5 whitespace-nowrap">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[18px]" aria-label="Yeekee">⚡</span>
              {yeekeeInfo.roundNo != null && (
                <span className="text-[20px] font-extrabold">{t.yeekeeRoundFmt.replace("{n}", String(yeekeeInfo.roundNo))}</span>
              )}
            </div>
            {yeekeeInfo.drawDate && (
              <div className="flex items-center gap-2 text-[16px] shrink-0">
                <span className="text-[18px]" aria-label="วันที่">📅</span>
                <span className="font-semibold tabular-nums">{yeekeeInfo.drawDate}</span>
              </div>
            )}
            {yeekeeInfo.betCloseAt && (
              <div className="flex items-center gap-2 text-[16px] shrink-0">
                <span className="text-[18px]" aria-label="ปิดรับ">⏰</span>
                <span className="font-semibold tabular-nums">
                  {new Date(yeekeeInfo.betCloseAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
            )}
            {yeekeeInfo.formulaLabel && (
              <div className="text-[13px] bg-white/15 rounded-full px-3 py-1 font-medium shrink-0">
                {yeekeeInfo.formulaLabel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lottery (non-Yeekee) info banner ──────────────────────────────── */}
      {!yeekeeInfo && lotteryInfo && (lotteryInfo.drawDate || lotteryInfo.openAt || lotteryInfo.closeAt) && (
        <div className="bg-gradient-to-r from-ap-blue to-sky-400 text-white px-4 py-3 overflow-x-auto">
          <div className="max-w-[1280px] mx-auto flex items-center justify-center gap-x-5 whitespace-nowrap">
            {lotteryInfo.drawDate && (
              <div className="flex items-center gap-2 text-[16px] shrink-0">
                <span className="text-[18px]" aria-label="วันที่">📅</span>
                <span className="font-semibold tabular-nums">{lotteryInfo.drawDate}</span>
              </div>
            )}
            {lotteryInfo.openAt && (
              <div className="flex items-center gap-2 text-[16px] shrink-0">
                <span className="text-[18px]" aria-label="เปิดรับ">🟢</span>
                <span className="font-semibold tabular-nums">
                  {new Date(lotteryInfo.openAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
            )}
            {lotteryInfo.closeAt && (
              <div className="flex items-center gap-2 text-[16px] shrink-0">
                <span className="text-[18px]" aria-label="ปิดรับ">⏰</span>
                <span className="font-semibold tabular-nums">
                  {new Date(lotteryInfo.closeAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
            )}
            {lotteryInfo.statusLabel && (
              <div className="text-[13px] bg-white/15 rounded-full px-3 py-1 font-medium shrink-0">
                {lotteryInfo.statusLabel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-3 py-4 pb-12 space-y-4">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card p-1 flex gap-1">
          {([
            { id: "bet", label: t.tabBet },
            ...(yeekeeInfo ? [{ id: "shoot" as const, label: t.tabShoot }] : []),
            { id: "rules", label: t.tabRules },
          ] as { id: LotteryTab; label: string }[]).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeActiveTab(tab.id)}
                className={[
                  "flex-1 py-2 rounded-xl text-[14px] font-bold transition-all",
                  active
                    ? "bg-ap-blue text-white shadow-sm"
                    : "text-ap-secondary hover:bg-slate-50",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className={activeTab === "bet" ? "grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4" : "hidden"}>

          {/* Left sidebar */}
          <BetLeftSidebar lotteryName={lotteryName} numberLimits={numberLimits} selectedPackage={selectedPackage} />

          {/* Main column */}
          <div className="space-y-3">
            {!isClassic && (
              <BetTypeSelector betType={betType} onChange={changeBetType} selected3={selected3} selected2={selected2} selectedRun={selectedRun} onToggle3={toggle3Type} onToggle2={toggle2Type} onToggleRun={toggleRunType} visibleIds={selectorTypeIds} bettingContext={bettingContext} />
            )}

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

        {activeTab === "shoot" && yeekeeInfo?.roundId != null && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-ap-border bg-white shadow-card">
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-4 text-white">
                <div className="flex items-center gap-3">
                  {lotteryLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={lotteryLogo} alt={lotteryName} className="w-11 h-11 rounded-2xl object-cover bg-white/15 border border-white/25" />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-[22px]">⚡</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-extrabold leading-tight truncate">{lotteryName}</p>
                    <p className="text-[14px] text-white/75 mt-0.5">Yeekee</p>
                  </div>
                  {yeekeeInfo.shootCloseAt && (
                    <div className="shrink-0 text-right">
                      <p className="text-[14px] text-white/70 font-semibold">{t.shootCloseIn}</p>
                      <CountdownTimer
                        closeAt={yeekeeInfo.shootCloseAt}
                        className="text-[15px] font-extrabold tabular-nums text-ap-red"
                        expiredClassName="text-[15px] font-extrabold text-ap-red"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-50/60">
                {[
                  { label: t.shootDetailDate, value: yeekeeInfo.drawDate ? new Date(yeekeeInfo.drawDate).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-" },
                  { label: t.shootDetailRound, value: yeekeeInfo.roundNo != null ? t.shootDetailRoundFmt.replace("{n}", String(yeekeeInfo.roundNo)) : `#${yeekeeInfo.roundId}` },
                  { label: t.shootDetailStatus, value: yeekeeInfo.statusLabel ?? "-" },
                  { label: t.shootDetailCloseTime, value: (yeekeeInfo.shootCloseAt ?? yeekeeInfo.betCloseAt) ? new Date((yeekeeInfo.shootCloseAt ?? yeekeeInfo.betCloseAt) as string).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }) : "-" },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[14px] font-semibold text-ap-tertiary">{row.label}</p>
                    <p className="mt-1 text-[14px] font-bold text-ap-primary truncate">{row.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-5">
                <YeekeeShootForm roundId={yeekeeInfo.roundId} />
              </div>
              <div className="lg:col-span-1">
                <YeekeeShootsList roundId={yeekeeInfo.roundId} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card p-5 space-y-3 text-[14px] text-ap-secondary leading-relaxed">
            <h3 className="text-[16px] font-extrabold text-ap-primary">{t.rulesTitle}</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>{t.ruleCheckBeforeConfirm}</li>
              <li>{t.ruleCannotCancel}</li>
              <li>{t.rulePackagePrice}</li>
              <li>{t.ruleBlockedNumbers}</li>
              {yeekeeInfo && <li>{t.ruleYeekee}</li>}
              <li>{t.ruleSupport}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
