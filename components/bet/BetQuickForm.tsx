"use client";
import { useState, useCallback, useEffect } from "react";
import Toast from "@/components/ui/Toast";
import BetClassicForm from "./BetClassicForm";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  BetTypeId, TabId, BillRow,
  MAX_DIGITS, TABS, DOUBLED, TRIPLED,
  genId, genSlipNo, permutations, nineteenDoor, addUnique,
} from "./types";
import type { NumberLimitRow, BettingContext } from "@/lib/types/bet";

const DB_BET_TYPE: Record<BetTypeId, string> = {
  "3top": "top3", "3tod": "tod3", "2top": "top2", "2bot": "bot2",
  "run": "run_top", "winlay": "run_bot", "6perm": "top3", "19door": "top2", "winnum": "top2",
};

function isBlocked(number: string, betType: BetTypeId, limits: NumberLimitRow[]): boolean {
  const db = DB_BET_TYPE[betType];
  return limits.some(
    (l) => l.number === number && l.isClosed && (l.betType === null || l.betType === db)
  );
}

// bet type ที่ตรงกับ input ล่าง/โต๊ด ของแต่ละ bet type
const BOT_BET_TYPE: Partial<Record<BetTypeId, BetTypeId>> = {
  "3top": "3tod", "6perm": "3tod",
  "2top": "2bot", "19door": "2bot", "winnum": "2bot",
  "run": "winlay",
};

interface Props {
  betType:            BetTypeId;
  baseBetType?:       BetTypeId;
  onBetTypeChange?:   (id: BetTypeId) => void;
  lotteryName:        string;
  lotteryFlag?:       string;
  lotteryLogo?:       string;
  closeAt?:           string;
  bills:              BillRow[];
  totalAmount:        number;
  numberLimits:       NumberLimitRow[];
  bettingContext?:    BettingContext;
  onAddBills:         (rows: BillRow[]) => void;
  onClearAll:         () => void;
  onTabChange?:       (tab: TabId) => void;
}

export default function BetQuickForm({
  betType,
  baseBetType,
  onBetTypeChange,
  lotteryName,
  lotteryFlag,
  lotteryLogo,
  bills,
  totalAmount,
  numberLimits,
  bettingContext,
  onAddBills,
  onClearAll,
  onTabChange,
}: Props) {
  const { lang } = useLang();
  const t = useTranslation("bet");
  const localeByLang: Record<string, string> = { th: "th-TH", en: "en-US", kh: "km-KH", la: "lo-LA" };
  const dateLocale = localeByLang[lang] ?? "th-TH";
  const today = new Date().toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" });

  const maxDigits = MAX_DIGITS[betType];
  const bottomAmountLabel = maxDigits === 3 ? t.tod : t.bottom;

  const topCtx = bettingContext?.[betType];
  const botCtx = bettingContext?.[BOT_BET_TYPE[betType] ?? betType];

  const TOP_TYPES: BetTypeId[] = ["3top", "6perm", "2top", "19door", "winnum", "run"];
  const BOT_TYPES: BetTypeId[] = ["6perm", "3tod", "19door", "winnum", "2bot", "winlay"];
  const showTop = TOP_TYPES.includes(betType);
  const showBot = BOT_TYPES.includes(betType);

  type Ctx = typeof topCtx;
  const validateAmount = (amt: number, ctx: Ctx): string | null => {
    if (!ctx || !(amt > 0)) return null;
    if (amt < ctx.minBet)
      return (t.amountTooLow ?? "ยอดขั้นต่ำ {min}").replace("{min}", String(ctx.minBet));
    if (amt > ctx.maxBet)
      return (t.amountTooHigh ?? "ยอดสูงสุด {max}").replace("{max}", ctx.maxBet.toLocaleString());
    if (ctx.maxPerNumber && amt > ctx.maxPerNumber)
      return (t.amountPerNumberExceeded ?? "ยอดต่อเลขสูงสุด {max}").replace("{max}", ctx.maxPerNumber.toLocaleString());
    return null;
  };

  const tabLabels: Record<TabId, string> = {
    quick: t.tabQuick,
    classic: t.tabClassic,
    slip: t.tabSlip,
  };

  const [activeTab,   setActiveTab]   = useState<TabId>("quick");
  const [inputBuf,    setInputBuf]    = useState("");
  const [preview,     setPreview]     = useState<string[]>([]);
  const [dupWarning,  setDupWarning]  = useState("");
  const [topAmt,      setTopAmt]      = useState("");
  const [botAmt,      setBotAmt]      = useState("");
  const [note,        setNote]        = useState("");
  const [slipText,    setSlipText]    = useState("");

  const handleSlipChange = (val: string) => {
    const hasDelimiter = /[\s,]/.test(val[val.length - 1] ?? "");
    const tokens = val.split(/[\s,]+/).map((t) => t.replace(/\D/g, "")).filter(Boolean);
    const complete = hasDelimiter ? tokens : tokens.slice(0, -1);
    const inProgress = hasDelimiter ? "" : (tokens[tokens.length - 1] ?? "");

    const valid = complete.filter((t) => t.length === maxDigits);
    if (valid.length > 0) {
      const blockedNums = valid.filter((n) => isBlocked(n, betType, numberLimits));
      const allowedNums = valid.filter((n) => !isBlocked(n, betType, numberLimits));
      if (blockedNums.length > 0)
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blockedNums.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      if (allowedNums.length > 0)
        setPreview((prev) => addUnique(prev, allowedNums));
    }
    setSlipText(inProgress);
  };

  function expandNumber(digits: string): string[] {
    if (betType === "6perm")  return permutations(digits);
    if (betType === "19door") return nineteenDoor(digits);
    return [digits];
  }

  const handleNumberInput = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, maxDigits);
    setInputBuf(digits);
    if (digits.length === maxDigits) {
      const expanded = expandNumber(digits);

      const blockedNums = expanded.filter((n) => isBlocked(n, betType, numberLimits));
      const allowedNums = expanded.filter((n) => !isBlocked(n, betType, numberLimits));
      const dups = allowedNums.filter((n) => preview.includes(n));

      if (blockedNums.length > 0) {
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blockedNums.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      } else if (dups.length > 0) {
        setDupWarning(`${t.numberLabel} ${dups.join(", ")} ${t.duplicatePreviewMessage}`);
        setTimeout(() => setDupWarning(""), 2500);
      } else {
        setDupWarning("");
      }

      if (allowedNums.length > 0)
        setPreview((prev) => addUnique(prev, allowedNums));
      setInputBuf("");
    }
  };

  const handleReverse = () => {
    if (preview.length > 0) {
      const expanded = maxDigits === 3
        ? preview.flatMap((n) => permutations(n))
        : preview.map((n) => n.split("").reverse().join(""));
      setPreview((prev) => addUnique(prev, expanded));
    }
  };

  const handleDouble = () => setPreview((prev) => addUnique(prev, DOUBLED));
  const handleTriple = () => setPreview((prev) => addUnique(prev, TRIPLED));
  const resetKey = baseBetType ?? betType;

  useEffect(() => {
    setPreview([]);
    setInputBuf("");
    setSlipText("");
    setDupWarning("");
    setTopAmt("");
    setBotAmt("");
  }, [resetKey]);

  const clearPreview = useCallback(() => {
    setPreview([]);
    setInputBuf("");
    setTopAmt("");
    setBotAmt("");
    setNote("");
  }, []);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: "warning" | "error" } | null>(null);

  const handleAmountBlur = (field: "top" | "bot", rawValue: string, ctx: Ctx, label: string) => {
    const parsed = parseFloat(rawValue);
    const err = validateAmount(parsed, ctx);
    if (err) setToastMsg({ text: err, type: "warning" });
  };

  const canAddBill = preview.length > 0 && (
    (showTop && parseFloat(topAmt) > 0) ||
    (showBot && parseFloat(botAmt) > 0)
  );

  const addBill = useCallback(() => {
    if (!canAddBill) return;
    const top = showTop ? (parseFloat(topAmt) || 0) : 0;
    const bot = showBot ? (parseFloat(botAmt) || 0) : 0;

    // validate min/max/per-number
    if (top > 0) {
      const err = validateAmount(top, topCtx);
      if (err) { setToastMsg({ text: err, type: "warning" }); return; }
      if (topCtx?.maxPerNumber) {
        const overLimit = preview.find((num) => {
          const existing = bills.filter((b) => b.number === num && b.betType === betType).reduce((s, b) => s + b.top, 0);
          return existing + top > topCtx.maxPerNumber;
        });
        if (overLimit) { setToastMsg({ text: `${t.numberLabel} ${overLimit}: ${t.amountPerNumberExceeded.replace("{max}", String(topCtx.maxPerNumber))}`, type: "warning" }); return; }
      }
    }
    if (bot > 0) {
      const err = validateAmount(bot, botCtx);
      if (err) { setToastMsg({ text: err, type: "warning" }); return; }
      const botBetType = BOT_BET_TYPE[betType] ?? betType;
      if (botCtx?.maxPerNumber) {
        const overLimit = preview.find((num) => {
          const existing = bills.filter((b) => b.number === num && b.betType === botBetType).reduce((s, b) => s + b.bot + b.top, 0);
          return existing + bot > botCtx.maxPerNumber;
        });
        if (overLimit) { setToastMsg({ text: `${t.numberLabel} ${overLimit}: ${t.amountPerNumberExceeded.replace("{max}", String(botCtx.maxPerNumber))}`, type: "warning" }); return; }
      }
    }

    // เช็ค duplicate: number + betType + บน/ล่าง ห้ามซ้ำกับที่มีในโพยแล้ว
    const dupes = preview.filter((num) =>
      bills.some((b) =>
        b.number === num && b.betType === betType &&
        ((top > 0 && b.top > 0) || (bot > 0 && b.bot > 0))
      )
    );
    if (dupes.length > 0) {
      setToastMsg({ text: `${t.numberLabel} ${dupes.join(", ")} ${t.duplicateSlipMessage}`, type: "warning" });
      return;
    }

    const slipNo = genSlipNo();
    const time   = new Date().toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
    const rows: BillRow[] = preview.map((num) => ({ id: genId(), slipNo, number: num, betType, top, bot, note, time }));
    onAddBills(rows);
    clearPreview();
  }, [canAddBill, topAmt, botAmt, preview, betType, bills, note, clearPreview, onAddBills, dateLocale, topCtx, botCtx, validateAmount, showTop, showBot]);

  return (
    <>
    {toastMsg && <Toast message={toastMsg.text} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border">

      {/* Tabs */}
      <div className="flex border-b border-ap-border">
        {TABS.map((tab, i) => (
          <button key={tab.id}
            onClick={() => {
              if (!tab.disabled && tab.id !== activeTab) {
                setActiveTab(tab.id);
                onTabChange?.(tab.id);
                setPreview([]);
                setInputBuf("");
                setSlipText("");
                setDupWarning("");
              }
            }}
            disabled={tab.disabled}
            className={["flex-1 py-2.5 text-[12px] sm:text-[13px] font-bold transition-all",
              i < TABS.length - 1 ? "border-r border-ap-border" : "",
              tab.disabled
                ? "bg-ap-bg text-ap-tertiary cursor-not-allowed"
                : activeTab === tab.id
                  ? "bg-ap-blue text-white"
                  : "bg-ap-bg text-ap-secondary hover:bg-white hover:text-ap-primary",
            ].join(" ")}>
            {tabLabels[tab.id]}
          </button>
        ))}
      </div>

      {/* Classic tab */}
      {activeTab === "classic" && (
        <BetClassicForm
          lotteryName={lotteryName}
          lotteryFlag={lotteryFlag}
          lotteryLogo={lotteryLogo}
          bills={bills}
          numberLimits={numberLimits}
          bettingContext={bettingContext}
          onAddBills={onAddBills}
        />
      )}

      {activeTab !== "classic" && <div className="p-4">
        {/* Title */}
        <div className="mb-3">
          <p className="text-[16px] font-bold text-ap-primary">{tabLabels[activeTab]}</p>
          <p className="text-[12px] text-ap-secondary mt-0.5">{lotteryName} • {today}</p>
        </div>

        {/* Input area */}
        {activeTab === "slip" ? (
          <div className="bg-ap-bg/50 rounded-2xl border border-ap-border p-4 mb-3">
            <label className="text-[11px] text-ap-secondary font-bold mb-1.5 block uppercase tracking-wide">
              {t.pasteSlipLabel.replace("{digits}", String(maxDigits))}
            </label>
            <textarea
              value={slipText}
              onChange={(e) => handleSlipChange(e.target.value)}
              placeholder={`${t.pasteSlipPlaceholder.replace("{digits}", String(maxDigits))}\n${t.exampleLabel} ${maxDigits === 3 ? t.pasteSlipExample3 : t.pasteSlipExample2}`}
              rows={4}
              className="w-full border-2 border-ap-border rounded-xl px-3 py-2.5 text-[15px] font-bold text-ap-primary outline-none focus:border-ap-blue bg-white transition-all resize-none leading-relaxed"
            />
            <p className="mt-1.5 text-[11px] text-ap-tertiary">{t.pasteSlipHint}</p>
          </div>
        ) : (
          <div className="bg-ap-bg/50 rounded-2xl border border-ap-border p-4 mb-3">
            <label className="text-[11px] text-ap-secondary font-bold mb-1 block uppercase tracking-wide">
              {t.inputNumberLabel.replace("{digits}", String(maxDigits))}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={inputBuf}
              onChange={(e) => handleNumberInput(e.target.value)}
              maxLength={maxDigits}
              placeholder={"·".repeat(maxDigits)}
              className="w-full border-2 border-ap-border rounded-xl px-3 py-2.5 text-[20px] text-center font-bold text-ap-primary outline-none focus:border-ap-blue bg-white transition-all"
            />
          </div>
        )}

        {/* Preview card */}
        <div className="rounded-2xl border border-ap-border bg-white mb-3 overflow-hidden">
          <div className="px-4 py-2 flex items-center justify-between border-b border-ap-border bg-ap-bg/60">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-ap-secondary uppercase tracking-wide">{t.previewTitle}</span>
              <span className="text-[12px] font-bold text-ap-primary tabular-nums">{preview.length} {t.countUnit}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(betType === "2top" || betType === "2bot") && (
                <button onClick={handleDouble}
                  className="text-[12px] font-bold px-2.5 py-1 rounded-lg border-2 border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 active:scale-95 transition-all">
                  + {t.doubleNumbers}
                </button>
              )}
              {(betType === "3top" || betType === "3tod") && (
                <button onClick={handleTriple}
                  className="text-[12px] font-bold px-2.5 py-1 rounded-lg border-2 border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 active:scale-95 transition-all">
                  + {t.tripleNumbers}
                </button>
              )}
              {maxDigits >= 2 && (
                <button onClick={handleReverse} disabled={preview.length === 0}
                  className="text-[12px] font-bold px-2.5 py-1 rounded-lg bg-ap-orange text-white hover:opacity-85 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  🔄 {t.reverseNumbers}
                </button>
              )}
            </div>
          </div>

          {dupWarning && (
            <div className="px-4 py-1.5 bg-yellow-50 border-b border-yellow-200 text-[12px] text-yellow-700 font-semibold">
              ⚠ {dupWarning}
            </div>
          )}

          <div className="p-3 min-h-[52px] flex flex-wrap gap-1.5">
            {preview.length === 0 ? (
              <span className="text-[13px] text-ap-tertiary self-center">— {t.previewEmpty} —</span>
            ) : (
              preview.map((n, idx) => (
                <span key={idx}
                  className="inline-flex items-center gap-1 text-white text-[14px] font-bold px-2.5 py-1 rounded-lg tabular-nums tracking-wider bg-ap-green">
                  {n}
                  <button onClick={() => setPreview((prev) => prev.filter((_, i) => i !== idx))}
                    className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-[10px] font-black transition-colors leading-none">
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          {preview.length > 0 && (
            <div className="px-3 pb-3 flex justify-center">
              <button onClick={() => { setPreview([]); setInputBuf(""); setDupWarning(""); }}
                className="text-[12px] font-bold px-4 py-1.5 rounded-lg bg-ap-red/10 border border-ap-red/30 text-ap-red hover:bg-ap-red hover:text-white active:scale-95 transition-all">
                ✕ {t.clearAll}
              </button>
            </div>
          )}
        </div>

        {/* บน / ล่าง / หมายเหตุ / เพิ่มบิล */}
        <div className="bg-ap-bg/50 rounded-2xl border border-ap-border p-4 mb-3">
          {/* บน + ล่าง/โต๊ด */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className={`text-[11px] font-bold mb-1 flex items-center gap-1 uppercase tracking-wide ${showTop ? "text-ap-secondary" : "text-ap-tertiary"}`}>
                {t.top}
                {showTop && topCtx?.payout ? <span className="text-ap-green font-bold normal-case">×{topCtx.payout}</span> : null}
              </label>
              <input
                type="number"
                value={topAmt}
                disabled={!showTop}
                onChange={(e) => setTopAmt(e.target.value)}
                onBlur={() => handleAmountBlur("top", topAmt, topCtx, t.top)}
                placeholder="—"
                min={topCtx?.minBet ?? 1}
                max={topCtx?.maxBet}
                className="w-full border-2 border-ap-border rounded-xl px-3 py-2.5 text-[15px] text-center font-bold text-ap-blue outline-none focus:border-ap-blue bg-white transition-all disabled:bg-ap-bg disabled:text-ap-tertiary disabled:cursor-not-allowed"
              />
              {showTop && topCtx && (
                <p className="mt-0.5 text-[10px] text-ap-tertiary text-center">
                  {topCtx.minBet}–{topCtx.maxBet.toLocaleString()}
                  {topCtx.maxPerNumber ? ` • /เลข ≤${topCtx.maxPerNumber.toLocaleString()}` : ""}
                </p>
              )}
            </div>
            <div>
              <label className={`text-[11px] font-bold mb-1 flex items-center gap-1 uppercase tracking-wide ${showBot ? "text-ap-secondary" : "text-ap-tertiary"}`}>
                {bottomAmountLabel}
                {showBot && botCtx?.payout ? <span className="text-ap-green font-bold normal-case">×{botCtx.payout}</span> : null}
              </label>
              <input
                type="number"
                value={botAmt}
                disabled={!showBot}
                onChange={(e) => setBotAmt(e.target.value)}
                onBlur={() => handleAmountBlur("bot", botAmt, botCtx, bottomAmountLabel)}
                placeholder="—"
                min={botCtx?.minBet ?? 1}
                max={botCtx?.maxBet}
                className="w-full border-2 border-ap-border rounded-xl px-3 py-2.5 text-[15px] text-center font-bold text-ap-green outline-none focus:border-ap-green bg-white transition-all disabled:bg-ap-bg disabled:text-ap-tertiary disabled:cursor-not-allowed"
              />
              {showBot && botCtx && (
                <p className="mt-0.5 text-[10px] text-ap-tertiary text-center">
                  {botCtx.minBet}–{botCtx.maxBet.toLocaleString()}
                  {botCtx.maxPerNumber ? ` • /เลข ≤${botCtx.maxPerNumber.toLocaleString()}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="mb-3">
            <label className="text-[11px] text-ap-secondary font-bold mb-1 block uppercase tracking-wide">{t.note}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              className="w-full border border-ap-border bg-white rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-ap-blue transition-all"
            />
          </div>

          {/* Hint */}
          {preview.length > 0 && !(showTop && parseFloat(topAmt) > 0) && !(showBot && parseFloat(botAmt) > 0) && (
            <p className="mb-2 text-[11px] text-ap-red font-medium">⚠ {t.fillAmountHint.replace("{bottom}", bottomAmountLabel)}</p>
          )}

          {/* + เพิ่มบิล */}
          <div className="flex justify-center">
            <button onClick={addBill} disabled={!canAddBill}
              className={["text-[13px] font-bold px-8 py-2 rounded-xl transition-all",
                canAddBill
                  ? "bg-ap-primary hover:bg-black text-white active:scale-95 shadow-md"
                  : "bg-ap-bg border-2 border-dashed border-ap-border text-ap-tertiary cursor-not-allowed",
              ].join(" ")}>
              + {t.addBill}
            </button>
          </div>
        </div>
      </div>}
    </div>
    </>
  );
}
