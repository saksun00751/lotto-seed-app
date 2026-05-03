"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Toast from "@/components/ui/Toast";
import BetClassicForm  from "./BetClassicForm";
import BetStandardForm from "./BetStandardForm";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  BetTypeId, TabId, BillRow,
  MAX_DIGITS, TABS, DOUBLED, TRIPLED,
  genId, genSlipNo, permutations, nineteenDoor, isValid3Perm, isValid6Perm,
} from "./types";
import type { NumberLimitRow, BettingContext } from "@/lib/types/bet";

const SPECIAL_FUNCTION_TYPES = ["2perm", "3perm", "6perm", "19door"] as const;
type SpecialFunctionType = (typeof SPECIAL_FUNCTION_TYPES)[number];
const isSpecialFunctionType = (id: BetTypeId): id is SpecialFunctionType =>
  (SPECIAL_FUNCTION_TYPES as readonly string[]).includes(id);

const DB_BET_TYPE: Record<BetTypeId, string> = {
  "3top": "top3", "3tod": "tod3", "2top": "top2", "2bot": "bot2",
  "run": "run_top", "winlay": "run_bot", "2perm": "top2", "3perm": "top3", "6perm": "top3", "19door": "top2", "winnum": "top2",
};

function isBlocked(number: string, betType: BetTypeId, limits: NumberLimitRow[]): boolean {
  const db = DB_BET_TYPE[betType];
  return limits.some(
    (l) => l.number === number && l.isClosed && (l.betType === null || l.betType === db)
  );
}

const BOT_BET_TYPE: Partial<Record<BetTypeId, BetTypeId>> = {
  "3top": "3tod", "3perm": "3tod", "6perm": "3tod",
  "2top": "2bot", "2perm": "2bot", "19door": "2bot",
  "run": "winlay",
};

interface Props {
  betType:            BetTypeId;
  baseBetType?:       BetTypeId;
  selected3?:         BetTypeId[];
  selected2?:         BetTypeId[];
  selectedRun?:       BetTypeId[];
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
  tripleTrigger?:     number;
  doubleTrigger?:     number;
  onTabChange?:       (tab: TabId) => void;
}

export default function BetQuickForm({
  betType,
  baseBetType,
  selected3,
  selected2,
  selectedRun,
  lotteryName,
  lotteryFlag,
  lotteryLogo,
  bills,
  totalAmount,
  numberLimits,
  bettingContext,
  onAddBills,
  onClearAll,
  tripleTrigger,
  doubleTrigger,
  onTabChange,
}: Props) {
  const { lang } = useLang();
  const t = useTranslation("bet");
  const localeByLang: Record<string, string> = { th: "th-TH", en: "en-US", kh: "km-KH", la: "lo-LA" };
  const dateLocale = localeByLang[lang] ?? "th-TH";
  const today = new Date().toLocaleDateString(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" });

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

  const TOP_TYPES: BetTypeId[] = ["3top", "3perm", "6perm", "2top", "2perm", "19door", "run"];
  const BOT_TYPES: BetTypeId[] = ["3perm", "6perm", "3tod", "2perm", "19door", "2bot", "winlay"];
  const showTop = is3DigitPair
    ? (selected3?.includes("3top") ?? false)
    : is2DigitPair
      ? (selected2?.includes("2top") ?? false)
    : isRunPair
      ? (selectedRun?.includes("run") ?? false)
    : TOP_TYPES.includes(betType);
  const showBot = is3DigitPair
    ? (selected3?.includes("3tod") ?? false)
    : is2DigitPair
      ? (selected2?.includes("2bot") ?? false)
    : isRunPair
      ? (selectedRun?.includes("winlay") ?? false)
    : BOT_TYPES.includes(betType);
  const hasSelection = showTop || showBot;

  const tabLabels: Record<TabId, string> = {
    standard: t.tabStandard,
    quick: t.tabQuick,
    classic: t.tabClassic,
    slip: t.tabSlip,
  };

  const [activeTab,   setActiveTab]   = useState<TabId>("standard");
  const [inputBuf,    setInputBuf]    = useState("");
  const [slipText,    setSlipText]    = useState("");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "warning" | "error" } | null>(null);
  const pendingAddRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitNumbers = useCallback((nums: string[]) => {
    if (nums.length === 0) return;
    if (!showTop && !showBot) return;

    const todNums = botBillType === "3tod"
      ? nums.filter((num, idx) => {
          if (showTop && new Set(num).size === 1) return false;
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
    const time   = new Date().toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
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
      if (blocked.length > 0)
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blocked.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      if (allowed.length > 0) commitNumbers(allowed);
    }
  }, [tripleTrigger]);

  useEffect(() => {
    if (doubleTrigger && doubleTrigger > 0) {
      const allowed = DOUBLED.filter((n) => !isBlocked(n, topBillType, numberLimits));
      const blocked = DOUBLED.filter((n) => isBlocked(n, topBillType, numberLimits));
      if (blocked.length > 0)
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blocked.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      if (allowed.length > 0) commitNumbers(allowed);
    }
  }, [doubleTrigger]);

  const handleSlipChange = (val: string) => {
    const hasDelimiter = /[\s,]/.test(val[val.length - 1] ?? "");
    const tokens = val.split(/[\s,]+/).map((t) => t.replace(/\D/g, "")).filter(Boolean);
    const complete = hasDelimiter ? tokens : tokens.slice(0, -1);
    const inProgress = hasDelimiter ? "" : (tokens[tokens.length - 1] ?? "");

    const valid = complete.filter((t) => t.length === maxDigits);

    const processNumbers = (allowed: string[]) => {
      if (allowed.length === 0) return;
      commitNumbers(allowed);
    };

    if (betType === "3perm") {
      const invalid3p = valid.filter((n) => !isValid3Perm(n));
      if (invalid3p.length > 0)
        setToastMsg({ text: `⚠️ ${invalid3p.join(", ")} ${t.not3permMessage}`, type: "error" });
      const valid3p = valid.filter((n) => isValid3Perm(n));
      if (valid3p.length > 0) {
        const expanded = Array.from(new Set(valid3p.flatMap((n) => permutations(n))));
        const blockedNums = expanded.filter((n) => isBlocked(n, topBillType, numberLimits));
        const allowedNums = expanded.filter((n) => !isBlocked(n, topBillType, numberLimits));
        if (blockedNums.length > 0)
          setToastMsg({ text: `🔒 ${t.numberLabel} ${blockedNums.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
        processNumbers(allowedNums);
      }
      setSlipText(inProgress);
      return;
    }
    if (betType === "6perm") {
      const invalid6p = valid.filter((n) => !isValid6Perm(n));
      if (invalid6p.length > 0)
        setToastMsg({ text: `⚠️ ${invalid6p.join(", ")} ${t.not6permMessage}`, type: "error" });
      const valid6p = valid.filter((n) => isValid6Perm(n));
      if (valid6p.length > 0) {
        const expanded = Array.from(new Set(valid6p.flatMap((n) => permutations(n))));
        const blockedNums = expanded.filter((n) => isBlocked(n, topBillType, numberLimits));
        const allowedNums = expanded.filter((n) => !isBlocked(n, topBillType, numberLimits));
        if (blockedNums.length > 0)
          setToastMsg({ text: `🔒 ${t.numberLabel} ${blockedNums.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
        processNumbers(allowedNums);
      }
      setSlipText(inProgress);
      return;
    }
    if (betType === "2perm") {
      const expanded = Array.from(new Set(valid.flatMap((n) => {
        const rev = n.split("").reverse().join("");
        return rev === n ? [n] : [n, rev];
      })));
      const blockedNums = expanded.filter((n) => isBlocked(n, topBillType, numberLimits));
      const allowedNums = expanded.filter((n) => !isBlocked(n, topBillType, numberLimits));
      if (blockedNums.length > 0)
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blockedNums.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      processNumbers(allowedNums);
      setSlipText(inProgress);
      return;
    }
    if (betType === "19door") {
      const expanded = Array.from(new Set(valid.flatMap((n) => nineteenDoor(n))));
      const blockedNums = expanded.filter((n) => isBlocked(n, topBillType, numberLimits));
      const allowedNums = expanded.filter((n) => !isBlocked(n, topBillType, numberLimits));
      if (blockedNums.length > 0)
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blockedNums.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      processNumbers(allowedNums);
      setSlipText(inProgress);
      return;
    }
    if (valid.length > 0) {
      const blockedNums = valid.filter((n) => isBlocked(n, topBillType, numberLimits));
      const allowedNums = valid.filter((n) => !isBlocked(n, topBillType, numberLimits));
      if (blockedNums.length > 0)
        setToastMsg({ text: `🔒 ${t.numberLabel} ${blockedNums.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
      processNumbers(allowedNums);
    }
    setSlipText(inProgress);
  };

  function expandNumber(digits: string): string[] {
    if (betType === "2perm") {
      const rev = digits.split("").reverse().join("");
      return rev === digits ? [digits] : [digits, rev];
    }
    if (betType === "3perm") {
      return permutations(digits);
    }
    if (betType === "6perm")  return permutations(digits);
    if (betType === "19door") return nineteenDoor(digits);
    return [digits];
  }

  const handleNumberInput = (val: string) => {
    if (pendingAddRef.current) return;

    const digits = val.replace(/\D/g, "").slice(0, maxDigits);
    setInputBuf(digits);
    if (digits.length === maxDigits) {
      if (betType === "3perm" && !isValid3Perm(digits)) {
        setToastMsg({ text: `⚠️ ${digits} ${t.not3permMessage}`, type: "error" });
        setInputBuf("");
        return;
      }
      if (betType === "6perm" && !isValid6Perm(digits)) {
        setToastMsg({ text: `⚠️ ${digits} ${t.not6permMessage}`, type: "error" });
        setInputBuf("");
        return;
      }

      const expanded = expandNumber(digits);
      const commitExpanded = () => {
        const blockedNums = expanded.filter((n) => isBlocked(n, topBillType, numberLimits));
        const allowedNums = expanded.filter((n) => !isBlocked(n, topBillType, numberLimits));

        if (blockedNums.length > 0) {
          setToastMsg({ text: `🔒 ${t.numberLabel} ${blockedNums.join(", ")} ${t.blockedNumberMessage}`, type: "error" });
        }
        if (allowedNums.length > 0) {
          commitNumbers(allowedNums);
        }
        setInputBuf("");
      };

      if (betType === "19door") {
        pendingAddRef.current = setTimeout(() => {
          commitExpanded();
          pendingAddRef.current = null;
        }, 250);
        return;
      }

      commitExpanded();
    }
  };

  const resetKey = baseBetType ?? betType;

  useEffect(() => {
    if (pendingAddRef.current) {
      clearTimeout(pendingAddRef.current);
      pendingAddRef.current = null;
    }
    setInputBuf("");
    setSlipText("");
  }, [resetKey]);

  useEffect(() => {
    return () => {
      if (pendingAddRef.current) {
        clearTimeout(pendingAddRef.current);
        pendingAddRef.current = null;
      }
    };
  }, []);

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
                setInputBuf("");
                setSlipText("");
              }
            }}
            disabled={tab.disabled}
            className={["flex-1 py-2.5 text-[14px] sm:text-[14px] font-bold transition-all",
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

      {/* Standard tab */}
      {activeTab === "standard" && (
        <BetStandardForm
          betType={betType}
          baseBetType={baseBetType}
          selected3={selected3}
          selected2={selected2}
          selectedRun={selectedRun}
          bills={bills}
          numberLimits={numberLimits}
          bettingContext={bettingContext}
          tripleTrigger={tripleTrigger}
          doubleTrigger={doubleTrigger}
          onAddBills={onAddBills}
        />
      )}

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

      {activeTab !== "classic" && activeTab !== "standard" && <div className="p-4">
        {/* Title */}
        <div className="mb-3">
          <p className="text-[16px] font-bold text-ap-primary">{tabLabels[activeTab]}</p>
          <p className="text-[14px] text-ap-primary font-medium mt-0.5">{lotteryName} • {today}</p>
        </div>

        {!hasSelection && (
          <div className="mb-3 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/60 px-4 py-3 text-center">
            <p className="text-[14px] font-bold text-violet-700">เลือกประเภทการแทงด้านบนก่อนเริ่มใส่เลข</p>
          </div>
        )}

        {/* Input area */}
        {activeTab === "slip" ? (
          <div className={["bg-ap-bg/70 rounded-2xl border-2 border-ap-blue p-4 transition-opacity", hasSelection ? "" : "opacity-50 pointer-events-none"].join(" ")}>
            <label className="text-[14px] text-ap-primary font-bold mb-1.5 block uppercase tracking-wide">
              {t.pasteSlipLabel.replace("{digits}", String(maxDigits))}
            </label>
            <textarea
              value={slipText}
              onChange={(e) => handleSlipChange(e.target.value)}
              placeholder={`${t.pasteSlipPlaceholder.replace("{digits}", String(maxDigits))}\n${t.exampleLabel} ${maxDigits === 3 ? t.pasteSlipExample3 : t.pasteSlipExample2}`}
              rows={4}
              className="w-full border-2 border-ap-blue rounded-xl px-3 py-3 text-[15px] font-bold text-ap-primary outline-none focus:border-ap-blue focus:ring-4 focus:ring-ap-blue/15 bg-white shadow-sm transition-all resize-none leading-relaxed"
            />
            <p className="mt-1.5 text-[14px] text-ap-secondary font-medium">{t.pasteSlipHint}</p>
          </div>
        ) : (
          <div className={["bg-ap-bg/70 rounded-2xl border-2 border-ap-blue p-4 transition-opacity", hasSelection ? "" : "opacity-50 pointer-events-none"].join(" ")}>
            <label className="text-[14px] text-ap-primary font-bold mb-1 block uppercase tracking-wide">
              {t.inputNumberLabel.replace("{digits}", String(maxDigits))}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={inputBuf}
              onChange={(e) => handleNumberInput(e.target.value)}
              maxLength={maxDigits}
              placeholder={"·".repeat(maxDigits)}
              className="w-full border-2 border-ap-blue rounded-xl px-3 py-3 text-[22px] text-center font-extrabold text-ap-primary outline-none focus:border-ap-blue focus:ring-4 focus:ring-ap-blue/15 bg-white shadow-sm transition-all placeholder:text-ap-tertiary/40"
            />
          </div>
        )}
      </div>}
    </div>
    </>
  );
}
