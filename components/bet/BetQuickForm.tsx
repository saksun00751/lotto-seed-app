"use client";
import { useState, useCallback } from "react";
import Toast from "@/components/ui/Toast";
import BetClassicForm from "./BetClassicForm";
import {
  BetTypeId, TabId, BillRow,
  MAX_DIGITS, TABS, DOUBLED, TRIPLED,
  genId, genSlipNo, permutations, nineteenDoor, addUnique,
} from "./types";
import type { NumberLimitRow } from "@/lib/db/lottery";

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

interface Props {
  betType:       BetTypeId;
  lotteryName:   string;
  lotteryFlag?:  string;
  closeAt?:      string;
  bills:         BillRow[];
  totalAmount:   number;
  numberLimits:  NumberLimitRow[];
  onAddBills:    (rows: BillRow[]) => void;
  onClearAll:    () => void;
  onTabChange?:  (tab: TabId) => void;
}

export default function BetQuickForm({
  betType,
  lotteryName,
  lotteryFlag,
  bills,
  totalAmount,
  numberLimits,
  onAddBills,
  onClearAll,
  onTabChange,
}: Props) {
  const today = new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });

  const maxDigits = MAX_DIGITS[betType];

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
      const blocked = valid.filter((n) => isBlocked(n, betType, numberLimits));
      const allowed = valid.filter((n) => !isBlocked(n, betType, numberLimits));
      if (allowed.length > 0) setPreview((prev) => addUnique(prev, allowed));
      if (blocked.length > 0) {
        setDupWarning(`🔒 เลข ${blocked.join(", ")} เป็นเลขอั้น ไม่สามารถแทงได้`);
        setTimeout(() => setDupWarning(""), 3000);
      }
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

      const blocked = expanded.filter((n) => isBlocked(n, betType, numberLimits));
      const allowed = expanded.filter((n) => !isBlocked(n, betType, numberLimits));

      if (blocked.length > 0) {
        setDupWarning(`🔒 เลข ${blocked.join(", ")} เป็นเลขอั้น ไม่สามารถแทงได้`);
        setTimeout(() => setDupWarning(""), 3000);
      } else {
        const dups = allowed.filter((n) => preview.includes(n));
        if (dups.length > 0) {
          setDupWarning(`เลข ${dups.join(", ")} ซ้ำใน preview`);
          setTimeout(() => setDupWarning(""), 2500);
        } else {
          setDupWarning("");
        }
      }

      if (allowed.length > 0) setPreview((prev) => addUnique(prev, allowed));
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

  const clearPreview = useCallback(() => {
    setPreview([]);
    setInputBuf("");
    setTopAmt("");
    setBotAmt("");
    setNote("");
  }, []);

  const [toastMsg, setToastMsg] = useState("");

  const canAddBill = preview.length > 0 && (parseFloat(topAmt) > 0 || parseFloat(botAmt) > 0);

  const addBill = useCallback(() => {
    if (!canAddBill) return;
    const top = parseFloat(topAmt) || 0;
    const bot = parseFloat(botAmt) || 0;

    // เช็ค duplicate: number + betType + บน/ล่าง ห้ามซ้ำกับที่มีในโพยแล้ว
    const dupes = preview.filter((num) =>
      bills.some((b) =>
        b.number === num && b.betType === betType &&
        ((top > 0 && b.top > 0) || (bot > 0 && b.bot > 0))
      )
    );
    if (dupes.length > 0) {
      setToastMsg(`เลข ${dupes.join(", ")} มีอยู่ในโพยแล้ว`);
      return;
    }

    const slipNo = genSlipNo();
    const time   = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const rows: BillRow[] = preview.map((num) => ({ id: genId(), slipNo, number: num, betType, top, bot, note, time }));
    onAddBills(rows);
    clearPreview();
  }, [canAddBill, topAmt, botAmt, preview, betType, bills, note, clearPreview, onAddBills]);

  return (
    <>
    {toastMsg && <Toast message={toastMsg} type="warning" onClose={() => setToastMsg("")} />}
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Classic tab */}
      {activeTab === "classic" && (
        <BetClassicForm
          lotteryName={lotteryName}
          lotteryFlag={lotteryFlag}
          bills={bills}
          numberLimits={numberLimits}
          onAddBills={onAddBills}
        />
      )}

      {activeTab !== "classic" && <div className="p-4">
        {/* Title */}
        <div className="mb-3">
          <p className="text-[16px] font-bold text-ap-primary">{TABS.find((t) => t.id === activeTab)?.label ?? activeTab}</p>
          <p className="text-[12px] text-ap-secondary mt-0.5">{lotteryName} • {today}</p>
        </div>

        {/* Input area */}
        {activeTab === "slip" ? (
          <div className="bg-ap-bg/50 rounded-2xl border border-ap-border p-4 mb-3">
            <label className="text-[11px] text-ap-secondary font-bold mb-1.5 block uppercase tracking-wide">
              วางโพย — พิมพ์เลข {maxDigits} หลัก คั่นด้วยช่องว่าง
            </label>
            <textarea
              value={slipText}
              onChange={(e) => handleSlipChange(e.target.value)}
              placeholder={`พิมพ์เลข ${maxDigits} หลัก แล้วกด Space เพื่อเพิ่ม\nเช่น ${maxDigits === 3 ? "123 456 789" : "12 34 56"}`}
              rows={4}
              className="w-full border-2 border-ap-border rounded-xl px-3 py-2.5 text-[15px] font-bold text-ap-primary outline-none focus:border-ap-blue bg-white transition-all resize-none leading-relaxed"
            />
            <p className="mt-1.5 text-[11px] text-ap-tertiary">กด Space หรือ Enter หลังแต่ละเลขเพื่อเพิ่มอัตโนมัติ</p>
          </div>
        ) : (
          <div className="bg-ap-bg/50 rounded-2xl border border-ap-border p-4 mb-3">
            <label className="text-[11px] text-ap-secondary font-bold mb-1 block uppercase tracking-wide">
              ใส่เลข ({maxDigits} หลัก)
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
              <span className="text-[12px] font-semibold text-ap-secondary uppercase tracking-wide">เลข Preview</span>
              <span className="text-[12px] font-bold text-ap-primary tabular-nums">{preview.length} ตัว</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(betType === "2top" || betType === "2bot") && (
                <button onClick={handleDouble}
                  className="text-[12px] font-bold px-2.5 py-1 rounded-lg border-2 border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 active:scale-95 transition-all">
                  + เลขเบิล
                </button>
              )}
              {(betType === "3top" || betType === "3tod") && (
                <button onClick={handleTriple}
                  className="text-[12px] font-bold px-2.5 py-1 rounded-lg border-2 border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 active:scale-95 transition-all">
                  + เลขตอง
                </button>
              )}
              {maxDigits >= 2 && (
                <button onClick={handleReverse} disabled={preview.length === 0}
                  className="text-[12px] font-bold px-2.5 py-1 rounded-lg bg-ap-orange text-white hover:opacity-85 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  🔄 เลขกลับ
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
              <span className="text-[13px] text-ap-tertiary self-center">— ยังไม่มีเลข กรอกด้านบนเพื่อเพิ่ม —</span>
            ) : (
              preview.map((n, idx) => (
                <span key={idx}
                  className="inline-flex items-center gap-1 bg-ap-green text-white text-[14px] font-bold px-2.5 py-1 rounded-lg tabular-nums tracking-wider">
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
                ✕ ยกเลิกทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* บน / ล่าง / หมายเหตุ / เพิ่มบิล */}
        <div className="bg-ap-bg/50 rounded-2xl border border-ap-border p-4 mb-3">
          {/* บน + ล่าง */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-[11px] text-ap-secondary font-bold mb-1 block uppercase tracking-wide">บน</label>
              <input
                type="number"
                value={topAmt}
                onChange={(e) => setTopAmt(e.target.value)}
                placeholder="—"
                min="1"
                className="w-full border-2 border-ap-border rounded-xl px-3 py-2.5 text-[15px] text-center font-bold text-ap-blue outline-none focus:border-ap-blue bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] text-ap-secondary font-bold mb-1 block uppercase tracking-wide">ล่าง</label>
              <input
                type="number"
                value={botAmt}
                onChange={(e) => setBotAmt(e.target.value)}
                placeholder="—"
                min="1"
                className="w-full border-2 border-ap-border rounded-xl px-3 py-2.5 text-[15px] text-center font-bold text-ap-green outline-none focus:border-ap-green bg-white transition-all"
              />
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="mb-3">
            <label className="text-[11px] text-ap-secondary font-bold mb-1 block uppercase tracking-wide">หมายเหตุ</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ระบุหมายเหตุ (ถ้ามี)"
              className="w-full border border-ap-border bg-white rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-ap-blue transition-all"
            />
          </div>

          {/* Hint */}
          {preview.length > 0 && !parseFloat(topAmt) && !parseFloat(botAmt) && (
            <p className="mb-2 text-[11px] text-ap-red font-medium">⚠ กรุณากรอกยอด บน หรือ ล่าง ก่อนเพิ่มบิล</p>
          )}

          {/* + เพิ่มบิล */}
          <div className="flex justify-center">
            <button onClick={addBill} disabled={!canAddBill}
              className={["text-[13px] font-bold px-8 py-2 rounded-xl transition-all",
                canAddBill
                  ? "bg-ap-primary hover:bg-black text-white active:scale-95 shadow-md"
                  : "bg-ap-bg border-2 border-dashed border-ap-border text-ap-tertiary cursor-not-allowed",
              ].join(" ")}>
              + เพิ่มบิล
            </button>
          </div>
        </div>
      </div>}
    </div>
    </>
  );
}
