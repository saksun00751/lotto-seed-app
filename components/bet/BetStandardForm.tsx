"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Toast from "@/components/ui/Toast";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  BetTypeId, BillRow, MAX_DIGITS, DOUBLED, TRIPLED,
  genId, genSlipNo, permutations, nineteenDoor, isValid3Perm, isValid6Perm,
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

  const [inputBuf,   setInputBuf]   = useState("");
  const [toastMsg,   setToastMsg]   = useState<{ text: string; type: "warning" | "error" } | null>(null);
  const pendingAddRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitNumbers = useCallback((nums: string[]) => {
    if (nums.length === 0) return;
    if (!showTop && !showBot) return;

    const todNums = botBillType === "3tod"
      ? nums.filter((num, idx) => {
          const key = num.split("").sort().join("");
          return nums.findIndex((n) => n.split("").sort().join("") === key) === idx;
        })
      : nums;

    const dupTop = showTop
      ? nums.filter((num) => bills.some((b) => b.number === num && b.betType === topBillType))
      : [];
    const dupBot = showBot
      ? todNums.filter((num) => bills.some((b) => b.number === num && b.betType === botBillType))
      : [];
    const allDupes = Array.from(new Set([...dupTop, ...dupBot]));
    if (allDupes.length > 0) {
      setToastMsg({ text: `${t.numberLabel} ${allDupes.join(", ")} ${t.duplicateSlipMessage}`, type: "warning" });
    }

    const slipNo = genSlipNo();
    const time = new Date().toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
    const newBills: BillRow[] = [];

    if (showTop) {
      nums.forEach((num) => {
        if (!bills.some((b) => b.number === num && b.betType === topBillType)) {
          newBills.push({ id: genId(), slipNo, number: num, betType: topBillType, top: 0, bot: 0, note: "", time });
        }
      });
    }
    if (showBot) {
      todNums.forEach((num) => {
        if (!bills.some((b) => b.number === num && b.betType === botBillType)) {
          newBills.push({ id: genId(), slipNo, number: num, betType: botBillType, top: 0, bot: 0, note: "", time });
        }
      });
    }

    if (newBills.length > 0) onAddBills(newBills);
  }, [showTop, showBot, bills, topBillType, botBillType, onAddBills, dateLocale, t]);

  useEffect(() => {
    if (tripleTrigger && tripleTrigger > 0) {
      const allowed = TRIPLED.filter((n) => !isBlocked(n, topBillType, numberLimits));
      const blocked = TRIPLED.filter((n) => isBlocked(n, topBillType, numberLimits));
      if (blocked.length > 0) {
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blocked.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      }
      if (allowed.length > 0) commitNumbers(allowed);
    }
  }, [tripleTrigger]);

  useEffect(() => {
    if (doubleTrigger && doubleTrigger > 0) {
      const allowed = DOUBLED.filter((n) => !isBlocked(n, topBillType, numberLimits));
      const blocked = DOUBLED.filter((n) => isBlocked(n, topBillType, numberLimits));
      if (blocked.length > 0) {
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blocked.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      }
      if (allowed.length > 0) commitNumbers(allowed);
    }
  }, [doubleTrigger]);

  useEffect(() => {
    if (pendingAddRef.current) {
      clearTimeout(pendingAddRef.current);
      pendingAddRef.current = null;
    }
    setInputBuf("");
  }, [betType]);

  useEffect(() => {
    return () => {
      if (pendingAddRef.current) {
        clearTimeout(pendingAddRef.current);
        pendingAddRef.current = null;
      }
    };
  }, []);

  const pressDigit = (d: string) => {
    if (pendingAddRef.current) return;

    const next = inputBuf + d;
    if (next.length > maxDigits) return;
    setInputBuf(next);

    if (next.length === maxDigits) {
      pendingAddRef.current = setTimeout(() => {
        let expanded: string[];
        if (betType === "19door") {
          expanded = nineteenDoor(next);
        } else if (betType === "2perm") {
          const rev = next.split("").reverse().join("");
          expanded = rev === next ? [next] : [next, rev];
        } else if (betType === "3perm") {
          if (!isValid3Perm(next)) {
            setToastMsg({ text: `⚠️ ${next} ${t.not3permMessage}`, type: "error" });
            setInputBuf("");
            pendingAddRef.current = null;
            return;
          }
          expanded = permutations(next);
        } else if (betType === "6perm") {
          if (!isValid6Perm(next)) {
            setToastMsg({ text: `⚠️ ${next} ${t.not6permMessage}`, type: "error" });
            setInputBuf("");
            pendingAddRef.current = null;
            return;
          }
          expanded = permutations(next);
        } else {
          expanded = [next];
        }

        const blocked = expanded.filter((n) => isBlocked(n, topBillType, numberLimits));
        const allowed = expanded.filter((n) => !isBlocked(n, topBillType, numberLimits));

        if (blocked.length > 0) {
          setToastMsg({ text: `🔒 ${t.numberLabel} ${blocked.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
        }
        if (allowed.length > 0) {
          commitNumbers(allowed);
        }
        setInputBuf("");
        pendingAddRef.current = null;
      }, 250);
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

  const numpadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];

  return (
    <>
      {toastMsg && <Toast message={toastMsg.text} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
      <div className="p-4">
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
          <p className="text-center text-[14px] text-ap-secondary font-medium">
            {t.inputNumberLabel?.replace("{digits}", String(maxDigits)) ?? `ใส่เลข (${maxDigits} หลัก)`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
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
      </div>
    </>
  );
}
