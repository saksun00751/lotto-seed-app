"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Toast from "@/components/ui/Toast";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  BetTypeId, BillRow, MAX_DIGITS, DOUBLED, TRIPLED,
  genId, genSlipNo, addUnique, permutations, nineteenDoor, isValid3Perm, isValid6Perm,
} from "./types";
import type { NumberLimitRow, BettingContext } from "@/lib/types/bet";

const SPECIAL_FUNCTION_TYPES = ["2perm", "3perm", "6perm", "19door"] as const;
type SpecialFunctionType = (typeof SPECIAL_FUNCTION_TYPES)[number];
const isSpecialFunctionType = (id: BetTypeId): id is SpecialFunctionType =>
  (SPECIAL_FUNCTION_TYPES as readonly string[]).includes(id);

const DB_BET_TYPE: Record<string, string> = {
  "3top": "top3", "3tod": "tod3", "2top": "top2", "2bot": "bot2",
  "run": "run_top", "winlay": "run_bot",
};

function isBlocked(number: string, betType: string, limits: NumberLimitRow[]): boolean {
  const db = DB_BET_TYPE[betType];
  return limits.some(
    (l) => l.number === number && l.isClosed && (l.betType === null || l.betType === db)
  );
}

const BOT_BET_TYPE: Partial<Record<BetTypeId, BetTypeId>> = {
  "3top": "3tod", "2top": "2bot", "run": "winlay",
};

interface Props {
  betType:         BetTypeId;
  baseBetType?:    BetTypeId;
  selected3?:      BetTypeId[];
  selected2?:      BetTypeId[];
  selectedRun?:    BetTypeId[];
  bills:           BillRow[];
  numberLimits:    NumberLimitRow[];
  bettingContext?: BettingContext;
  tripleTrigger?:  number;
  doubleTrigger?:  number;
  onAddBills:      (rows: BillRow[]) => void;
}

export default function BetStandardForm({ betType, baseBetType, selected3, selected2, selectedRun, bills, numberLimits, bettingContext, tripleTrigger, doubleTrigger, onAddBills }: Props) {
  const { lang } = useLang();
  const t = useTranslation("bet");
  const localeByLang: Record<string, string> = { th: "th-TH", en: "en-US", kh: "km-KH", la: "lo-LA" };
  const dateLocale = localeByLang[lang] ?? "th-TH";

  const maxDigits = MAX_DIGITS[betType];
  const pairingType: BetTypeId = (() => {
    if (isSpecialFunctionType(betType) && baseBetType) return baseBetType;
    if (betType === "3perm" || betType === "6perm") return "3top";
    if (betType === "2perm" || betType === "19door") return "2top";
    return betType;
  })();

  const is3DigitPair = pairingType === "3top" || pairingType === "3tod";
  const is2DigitPair = pairingType === "2top" || pairingType === "2bot";
  const isRunPair    = pairingType === "run"  || pairingType === "winlay";

  const topBillType: BetTypeId = is3DigitPair ? "3top" : is2DigitPair ? "2top" : isRunPair ? "run"    : pairingType;
  const botBillType: BetTypeId = is3DigitPair ? "3tod" : is2DigitPair ? "2bot" : isRunPair ? "winlay" : (BOT_BET_TYPE[pairingType] ?? pairingType);

  const topCtx = is3DigitPair
    ? bettingContext?.["3top"]
    : is2DigitPair
    ? bettingContext?.["2top"]
    : isRunPair
    ? bettingContext?.["run"]
    : bettingContext?.[topBillType];
  const botCtx = is3DigitPair
    ? bettingContext?.["3tod"]
    : is2DigitPair
    ? bettingContext?.["2bot"]
    : isRunPair
    ? bettingContext?.["winlay"]
    : bettingContext?.[botBillType];

  const showTop = is3DigitPair
    ? (selected3?.includes("3top") ?? true)
    : is2DigitPair
      ? (selected2?.includes("2top") ?? true)
    : isRunPair
      ? (selectedRun?.includes("run") ?? true)
    : true;
  const showBot = is3DigitPair
    ? (selected3?.includes("3tod") ?? true)
    : is2DigitPair
      ? (selected2?.includes("2bot") ?? true)
    : isRunPair
      ? (selectedRun?.includes("winlay") ?? true)
    : (is2DigitPair || isRunPair);

  const bottomAmountLabel = (is3DigitPair || maxDigits === 3) ? t.tod : t.bottom;

  const [inputBuf,   setInputBuf]   = useState("");
  const [preview,    setPreview]    = useState<string[]>([]);
  const [topAmt,     setTopAmt]     = useState("");
  const [botAmt,     setBotAmt]     = useState("");
  const [toastMsg,   setToastMsg]   = useState<{ text: string; type: "warning" | "error" } | null>(null);
  const pendingAddRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tripleTrigger && tripleTrigger > 0) {
      setPreview((prev) => addUnique(prev, TRIPLED));
      setToastMsg({ text: `✅ ${t.tripleNumbers} ${TRIPLED.join(", ")}`, type: "warning" });
    }
  }, [tripleTrigger]);

  useEffect(() => {
    if (doubleTrigger && doubleTrigger > 0) {
      setPreview((prev) => addUnique(prev, DOUBLED));
      setToastMsg({ text: `✅ ${t.doubleNumbers} ${DOUBLED.join(", ")}`, type: "warning" });
    }
  }, [doubleTrigger]);

  // reset เมื่อเปลี่ยน betType
  useEffect(() => {
    if (pendingAddRef.current) {
      clearTimeout(pendingAddRef.current);
      pendingAddRef.current = null;
    }
    setPreview([]);
    setInputBuf("");
    setTopAmt("");
    setBotAmt("");
  }, [betType]);

  useEffect(() => {
    return () => {
      if (pendingAddRef.current) {
        clearTimeout(pendingAddRef.current);
        pendingAddRef.current = null;
      }
    };
  }, []);

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

  // ── Numpad handlers ─────────────────────────────────────────────────────────
  const pressDigit = (d: string) => {
    if (pendingAddRef.current) return;

    const next = inputBuf + d;
    if (next.length > maxDigits) return;
    setInputBuf(next);

    if (next.length === maxDigits) {
      if (betType === "19door") {
        pendingAddRef.current = setTimeout(() => {
          const expanded = nineteenDoor(next);
          const blocked = expanded.filter((n) => isBlocked(n, topBillType, numberLimits));
          const allowed = expanded.filter((n) => !isBlocked(n, topBillType, numberLimits));

          if (blocked.length > 0) {
            setToastMsg({ text: `🔒 ${t.numberLabel} ${blocked.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
          }
          if (allowed.length > 0) {
            setPreview((prev) => addUnique(prev, allowed));
          }
          setInputBuf("");
          pendingAddRef.current = null;
        }, 500);
        return;
      }

      // expand ตาม special mode
      let expanded: string[];
      if (betType === "2perm") {
        const rev = next.split("").reverse().join("");
        expanded = rev === next ? [next] : [next, rev];
      } else if (betType === "3perm") {
        if (!isValid3Perm(next)) {
          setToastMsg({ text: `⚠️ ${next} ${t.not3permMessage}`, type: "error" });
          setInputBuf("");
          return;
        }
        expanded = permutations(next);
      } else if (betType === "6perm") {
        if (!isValid6Perm(next)) {
          setToastMsg({ text: `⚠️ ${next} ${t.not6permMessage}`, type: "error" });
          setInputBuf("");
          return;
        }
        expanded = permutations(next);
      } else if (betType === "19door") {
        expanded = nineteenDoor(next);
      } else {
        expanded = [next];
      }

      const blocked = expanded.filter((n) => isBlocked(n, topBillType, numberLimits));
      const allowed = expanded.filter((n) => !isBlocked(n, topBillType, numberLimits));

      if (blocked.length > 0) {
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blocked.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      }
      if (allowed.length > 0) {
        setPreview((prev) => addUnique(prev, allowed));
      }
      setInputBuf("");
    }
  };

  const pressBackspace = () => {
    if (pendingAddRef.current) {
      clearTimeout(pendingAddRef.current);
      pendingAddRef.current = null;
    }
    setInputBuf((prev) => prev.slice(0, -1));
  };
  const pressClear = () => {
    if (pendingAddRef.current) {
      clearTimeout(pendingAddRef.current);
      pendingAddRef.current = null;
    }
    setInputBuf("");
  };
  const removePreview = (idx: number) => setPreview((prev) => prev.filter((_, i) => i !== idx));

  // ── Add bill ────────────────────────────────────────────────────────────────
  const top = showTop ? (parseFloat(topAmt) || 0) : 0;
  const bot = showBot ? (parseFloat(botAmt) || 0) : 0;

  const canAddBill = preview.length > 0 && (top > 0 || bot > 0);

  const addBill = useCallback(() => {
    if (!canAddBill) return;

    if (top > 0) {
      const err = validateAmount(top, topCtx);
      if (err) { setToastMsg({ text: err, type: "warning" }); return; }
    }
    if (bot > 0) {
      const err = validateAmount(bot, botCtx);
      if (err) { setToastMsg({ text: err, type: "warning" }); return; }
    }

    // check duplicates
    if (top > 0) {
      const dupes = preview.filter((num) => bills.some((b) => b.number === num && b.betType === topBillType && b.top > 0));
      if (dupes.length > 0) { setToastMsg({ text: `${t.numberLabel} ${dupes.join(", ")} ${t.duplicateSlipMessage}`, type: "warning" }); return; }
    }
    if (bot > 0) {
      // 3 ตัวโต๊ด: dedup กลุ่ม permutation
      const botNums = botBillType === "3tod"
        ? preview.filter((num, idx) => {
            const key = num.split("").sort().join("");
            return preview.findIndex((n) => n.split("").sort().join("") === key) === idx;
          })
        : preview;
      const dupes = botNums.filter((num) => bills.some((b) => b.number === num && b.betType === botBillType && b.top > 0));
      if (dupes.length > 0) { setToastMsg({ text: `${t.numberLabel} ${dupes.join(", ")} ${t.duplicateSlipMessage}`, type: "warning" }); return; }
    }

    const slipNo = genSlipNo();
    const time = new Date().toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
    const newBills: BillRow[] = [];

    // 3 ตัวโต๊ด dedup
    const botNums = botBillType === "3tod"
      ? preview.filter((num, idx) => {
          const key = num.split("").sort().join("");
          return preview.findIndex((n) => n.split("").sort().join("") === key) === idx;
        })
      : preview;

    preview.forEach((num) => {
      if (top > 0) newBills.push({ id: genId(), slipNo, number: num, betType: topBillType, top, bot: 0, note: "", time });
    });
    botNums.forEach((num) => {
      if (bot > 0) newBills.push({ id: genId(), slipNo, number: num, betType: botBillType, top: bot, bot: 0, note: "", time });
    });

    onAddBills(newBills);
    setPreview([]);
    setTopAmt("");
    setBotAmt("");
  }, [canAddBill, top, bot, preview, bills, topBillType, botBillType, onAddBills, dateLocale, topCtx, botCtx, t, validateAmount]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const numpadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];

  return (
    <>
      {toastMsg && <Toast message={toastMsg.text} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
      <div className="p-4">

        {/* ── Number display ─────────────────────────────────────────────── */}
        <div className="bg-ap-bg/70 rounded-2xl border border-ap-border p-4 mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {Array.from({ length: maxDigits }).map((_, i) => (
              <div
                key={i}
                className={[
                  "w-14 h-16 rounded-xl border-2 flex items-center justify-center text-[28px] font-extrabold tabular-nums transition-all",
                  inputBuf[i]
                    ? "border-ap-blue bg-white text-ap-blue shadow-md"
                    : i === inputBuf.length
                      ? "border-ap-blue/50 bg-blue-50/50 text-ap-tertiary animate-pulse"
                      : "border-ap-border bg-white text-ap-tertiary/30",
                ].join(" ")}
              >
                {inputBuf[i] ?? "·"}
              </div>
            ))}
          </div>
          <p className="text-center text-[12px] text-ap-secondary font-medium">
            {t.inputNumberLabel?.replace("{digits}", String(maxDigits)) ?? `ใส่เลข (${maxDigits} หลัก)`}
          </p>
        </div>

        {/* ── Numpad ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {numpadKeys.map((key) => {
            if (key === "clear") {
              return (
                <button
                  key={key}
                  onClick={pressClear}
                  className="py-3.5 rounded-xl bg-ap-red/10 border border-ap-red/30 text-ap-red text-[14px] font-bold hover:bg-ap-red hover:text-white active:scale-95 transition-all"
                >
                  C
                </button>
              );
            }
            if (key === "del") {
              return (
                <button
                  key={key}
                  onClick={pressBackspace}
                  className="py-3.5 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-700 text-[14px] font-bold hover:bg-yellow-100 active:scale-95 transition-all"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => pressDigit(key)}
                className="py-3.5 rounded-xl bg-white border-2 border-ap-border text-[20px] font-extrabold text-ap-primary hover:border-ap-blue hover:bg-blue-50 active:scale-95 active:bg-ap-blue active:text-white transition-all shadow-sm"
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* ── Preview ────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-ap-border bg-white mb-4 overflow-hidden">
          <div className="px-4 py-2 flex items-center justify-between border-b border-ap-border bg-ap-bg/80">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-ap-primary uppercase tracking-wide">{t.previewTitle}</span>
              <span className="text-[13px] font-bold text-ap-blue tabular-nums">{preview.length} {t.countUnit}</span>
            </div>
            {preview.length > 0 && (
              <button
                onClick={() => setPreview([])}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-ap-red/10 border border-ap-red/30 text-ap-red hover:bg-ap-red hover:text-white active:scale-95 transition-all"
              >
                ✕ {t.clearAll}
              </button>
            )}
          </div>
          <div className="p-3 min-h-[52px] flex flex-wrap gap-1.5">
            {preview.length === 0 ? (
              <span className="text-[13px] text-ap-secondary font-medium self-center">— {t.previewEmpty} —</span>
            ) : (
              preview.map((n, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-white text-[14px] font-bold px-2.5 py-1 rounded-lg tabular-nums tracking-wider bg-ap-green"
                >
                  {n}
                  <button
                    onClick={() => removePreview(idx)}
                    className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-[10px] font-black transition-colors leading-none"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* ── Amount inputs ──────────────────────────────────────────────── */}
        <div className="bg-ap-bg/70 rounded-2xl border border-ap-border p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* บน */}
            <div>
              <label className={`text-[12px] font-bold mb-1 flex items-center gap-1 uppercase tracking-wide ${showTop ? "text-ap-primary" : "text-ap-tertiary"}`}>
                {t.top}
                {showTop && topCtx?.payout ? <span className="text-ap-green font-bold normal-case">×{topCtx.payout}</span> : null}
              </label>
              <input
                type="number"
                value={topAmt}
                disabled={!showTop}
                onChange={(e) => setTopAmt(e.target.value)}
                placeholder="—"
                min={topCtx?.minBet ?? 1}
                max={topCtx?.maxBet}
                className="w-full border-2 border-ap-blue/30 rounded-xl px-3 py-3 text-[16px] text-center font-extrabold text-ap-blue outline-none focus:border-ap-blue focus:ring-4 focus:ring-ap-blue/15 bg-blue-50/40 shadow-sm transition-all disabled:bg-ap-bg disabled:text-ap-tertiary disabled:cursor-not-allowed disabled:border-ap-border disabled:shadow-none"
              />
              {showTop && topCtx && (
                <p className="mt-0.5 text-[11px] text-ap-secondary font-medium text-center">
                  {topCtx.minBet}–{topCtx.maxBet.toLocaleString()}
                  {topCtx.maxPerNumber ? ` • /เลข ≤${topCtx.maxPerNumber.toLocaleString()}` : ""}
                </p>
              )}
            </div>

            {/* ล่าง / โต๊ด */}
            <div>
              <label className={`text-[12px] font-bold mb-1 flex items-center gap-1 uppercase tracking-wide ${showBot ? "text-ap-primary" : "text-ap-tertiary"}`}>
                {bottomAmountLabel}
                {showBot && botCtx?.payout ? <span className="text-ap-green font-bold normal-case">×{botCtx.payout}</span> : null}
              </label>
              <input
                type="number"
                value={botAmt}
                disabled={!showBot}
                onChange={(e) => setBotAmt(e.target.value)}
                placeholder="—"
                min={botCtx?.minBet ?? 1}
                max={botCtx?.maxBet}
                className="w-full border-2 border-green-400/40 rounded-xl px-3 py-3 text-[16px] text-center font-extrabold text-ap-green outline-none focus:border-ap-green focus:ring-4 focus:ring-green-500/15 bg-green-50/40 shadow-sm transition-all disabled:bg-ap-bg disabled:text-ap-tertiary disabled:cursor-not-allowed disabled:border-ap-border disabled:shadow-none"
              />
              {showBot && botCtx && (
                <p className="mt-0.5 text-[11px] text-ap-secondary font-medium text-center">
                  {botCtx.minBet}–{botCtx.maxBet.toLocaleString()}
                  {botCtx.maxPerNumber ? ` • /เลข ≤${botCtx.maxPerNumber.toLocaleString()}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Hint */}
          {preview.length > 0 && !canAddBill && (
            <p className="mb-2 text-[11px] text-ap-red font-medium">
              ⚠ {(t.fillAmountHint ?? "กรุณากรอกยอด บน หรือ {bottom} ก่อนเพิ่มบิล").replace("{bottom}", bottomAmountLabel)}
            </p>
          )}

          {/* + เพิ่มบิล */}
          <div className="flex justify-center">
            <button
              onClick={addBill}
              disabled={!canAddBill}
              className={[
                "text-[13px] font-bold px-8 py-2 rounded-xl transition-all",
                canAddBill
                  ? "bg-ap-primary hover:bg-black text-white active:scale-95 shadow-md"
                  : "bg-ap-bg border-2 border-dashed border-ap-border text-ap-tertiary cursor-not-allowed",
              ].join(" ")}
            >
              + {t.addBill}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
