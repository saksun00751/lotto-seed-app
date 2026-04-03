"use client";
import { useState, useCallback, useRef } from "react";
import { BillRow, genId, genSlipNo, permutations } from "./types";
import type { NumberLimitRow, BettingContext } from "@/lib/types/bet";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassicRow {
  id:     string;
  number: string;
  digits: 2 | 3;   // กำหนด column ที่ใช้ได้
  top:    string;
  bot:    string;   // ใช้เมื่อ digits === 2
  tod:    string;   // ใช้เมื่อ digits === 3
}

// ─── Helpers ─────────────────────────────────────────────────────────────────


function blocked(num: string, dbType: string, limits: NumberLimitRow[]): boolean {
  return limits.some(
    (l) => l.number === num && l.isClosed && (l.betType === null || l.betType === dbType)
  );
}

function makeRow(number: string): ClassicRow {
  const digits = number.length as 2 | 3;
  return { id: genId(), number, digits, top: "", bot: "", tod: "" };
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  lotteryName:     string;
  lotteryFlag?:    string;
  lotteryLogo?:    string;
  bills:           BillRow[];
  numberLimits:    NumberLimitRow[];
  bettingContext?: BettingContext;
  onAddBills:      (rows: BillRow[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BetClassicForm({ lotteryFlag, lotteryLogo, bills, numberLimits, bettingContext, onAddBills }: Props) {
  const { lang } = useLang();
  const t = useTranslation("bet");
  const localeByLang: Record<string, string> = { th: "th-TH", en: "en-US", kh: "km-KH", la: "lo-LA" };
  const dateLocale = localeByLang[lang] ?? "th-TH";
  const [rows,     setRows]     = useState<ClassicRow[]>([]);
  const [inputNum, setInputNum] = useState("");
  const [note,     setNote]     = useState("");
  const [toast,    setToast]    = useState("");
  const inputRef  = useRef<HTMLInputElement>(null);
  // ref map: `${rowId}-top` / `${rowId}-bot` / `${rowId}-tod`
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const ctx3top = bettingContext?.["3top"];
  const ctx3tod = bettingContext?.["3tod"];
  const ctx2top = bettingContext?.["2top"];
  const ctx2bot = bettingContext?.["2bot"];

  type Ctx = typeof ctx3top;
  const validateCell = (val: string, ctx: Ctx): string | null => {
    const v = parseFloat(val);
    if (!(v > 0) || !ctx) return null;
    if (v < ctx.minBet)
      return (t.amountTooLow ?? "ยอดขั้นต่ำ {min}").replace("{min}", String(ctx.minBet));
    if (v > ctx.maxBet)
      return (t.amountTooHigh ?? "ยอดสูงสุด {max}").replace("{max}", ctx.maxBet.toLocaleString());
    if (ctx.maxPerNumber && v > ctx.maxPerNumber)
      return (t.amountPerNumberExceeded ?? "ยอดต่อเลขสูงสุด {max}").replace("{max}", ctx.maxPerNumber.toLocaleString());
    return null;
  };

  // เพิ่ม row และ return id ของ row ที่เพิ่ม (หรือที่มีอยู่แล้ว)
  const addNumber = (num: string): string | null => {
    if (num.length < 2) return null;
    const dbType = num.length === 3 ? "top3" : "top2";
    if (blocked(num, dbType, numberLimits)) { showToast(`${t.numberLabel} ${num} ${t.blockedNumberShort}`); return null; }
    const existing = rows.find((r) => r.number === num);
    if (existing) return existing.id;
    const newRow = makeRow(num);
    setRows((prev) => [...prev, newRow]);
    return newRow.id;
  };

  const handleNumInput = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 3);
    setInputNum(digits);
    if (digits.length === 3) {
      const id = addNumber(digits);
      setInputNum("");
      if (id) setTimeout(() => inputRefs.current.get(`${id}-top`)?.focus(), 0);
    }
  };

  const handleNumKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "Tab") && inputNum.length >= 2) {
      e.preventDefault();
      const id = addNumber(inputNum);
      setInputNum("");
      if (id) {
        // focus บน input ของ row ที่เพิ่ง add
        setTimeout(() => inputRefs.current.get(`${id}-top`)?.focus(), 0);
      }
    }
  };

  // กลับเลข: 3 หลัก → permutations, 2 หลัก → reverse
  const handleReverse = () => {
    const toAdd: ClassicRow[] = [];
    const existing = new Set(rows.map((r) => r.number));
    rows.forEach((row) => {
      if (row.digits === 3) {
        permutations(row.number)
          .filter((n) => !existing.has(n))
          .forEach((n) => { toAdd.push(makeRow(n)); existing.add(n); });
      } else {
        const rev = row.number[1] + row.number[0];
        if (!existing.has(rev)) { toAdd.push(makeRow(rev)); existing.add(rev); }
      }
    });
    if (toAdd.length > 0) setRows((prev) => [...prev, ...toAdd]);
  };

  // คัดลอก: copy ค่าแรกที่กรอกไว้ ไปทุก row ที่ใช้ column นั้นได้
  const handleCopyCol = (col: "top" | "bot" | "tod") => {
    const applicable = rows.filter((r) =>
      col === "top" ? true : col === "bot" ? r.digits === 2 : r.digits === 3
    );
    const first = applicable.find((r) => r[col] !== "");
    if (!first) return;
    const val = first[col];
    setRows((prev) => prev.map((r) => {
      if (col === "bot" && r.digits !== 2) return r;
      if (col === "tod" && r.digits !== 3) return r;
      return { ...r, [col]: val };
    }));
  };

  // Tab navigation: right across the row → first col of next row
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowId: string,
    field: "top" | "bot" | "tod"
  ) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    const rowIndex = rows.findIndex((r) => r.id === rowId);
    const row = rows[rowIndex];
    let nextEl: HTMLInputElement | null = null;
    if (field === "top") {
      const nextKey = row.digits === 2 ? `${rowId}-bot` : `${rowId}-tod`;
      nextEl = inputRefs.current.get(nextKey) ?? null;
    } else {
      const nextRow = rows[rowIndex + 1];
      nextEl = nextRow
        ? (inputRefs.current.get(`${nextRow.id}-top`) ?? null)
        : (inputRef.current ?? null);
    }
    if (nextEl) { e.preventDefault(); nextEl.focus(); }
  };

  const updateRow = (id: string, field: "top" | "bot" | "tod", val: string) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: val.replace(/\D/g, "") } : r));

  const deleteRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const clearAll  = () => { setRows([]); setInputNum(""); setNote(""); };

  const canSubmit = rows.length > 0 && rows.some((r) =>
    r.digits === 2
      ? parseFloat(r.top) > 0 || parseFloat(r.bot) > 0
      : parseFloat(r.top) > 0 || parseFloat(r.tod) > 0
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const slipNo = genSlipNo();
    const time   = new Date().toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
    const newBills: BillRow[] = [];

    rows.forEach((row) => {
      const top = parseFloat(row.top) || 0;
      const bot = parseFloat(row.bot) || 0;
      const tod = parseFloat(row.tod) || 0;

      if (row.digits === 2) {
        if (top > 0) newBills.push({ id: genId(), slipNo, number: row.number, betType: "2top", top, bot: 0, note, time });
        if (bot > 0) newBills.push({ id: genId(), slipNo, number: row.number, betType: "2bot", top: 0, bot, note, time });
      } else {
        if (top > 0) newBills.push({ id: genId(), slipNo, number: row.number, betType: "3top", top, bot: 0, note, time });
        if (tod > 0) newBills.push({ id: genId(), slipNo, number: row.number, betType: "3tod", top: tod, bot: 0, note, time });
      }
    });

    const dupes = newBills.filter((nb) =>
      bills.some((b) => b.number === nb.number && b.betType === nb.betType &&
        ((nb.top > 0 && b.top > 0) || (nb.bot > 0 && b.bot > 0))
      )
    );
    if (dupes.length > 0) { showToast(`${t.numberLabel} ${[...new Set(dupes.map((d) => d.number))].join(", ")} ${t.duplicateSlipMessage}`); return; }

    onAddBills(newBills);
    clearAll();
  }, [canSubmit, rows, bills, note, onAddBills, dateLocale, t.numberLabel, t.blockedNumberShort, t.duplicateSlipMessage]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const inputCls = "w-full text-center text-[13px] font-bold text-ap-primary outline-none bg-transparent tabular-nums py-1.5 focus:bg-ap-blue/5 transition-colors";

  return (
    <div className="p-0">

      {/* Toast */}
      {toast && (
        <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl bg-yellow-50 border border-yellow-200 text-[12px] text-yellow-800 font-semibold flex items-center gap-2">
          <span>⚠️</span> {toast}
        </div>
      )}

      {/* Table */}
      <div className="px-3 pb-2 pt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[12px] rounded-xl overflow-hidden" style={{ minWidth: 340 }}>
          <thead>
            <tr className="bg-ap-blue text-white">
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[28%]">
                <div className="text-[12px]">{t.numberLabel}</div>
                <button
                  onClick={handleReverse}
                  tabIndex={-1}
                  className="text-[10px] text-blue-200 underline mt-0.5 hover:text-white transition-colors"
                >
                  ({t.reverseNumbers})
                </button>
              </th>
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[21%]">
                <div className="text-[12px]">{t.top}</div>
                {(ctx3top?.payout || ctx2top?.payout) && (
                  <div className="text-[10px] text-ap-green font-bold mt-0.5">
                    {ctx3top?.payout ? `×${ctx3top.payout}` : ""}{ctx3top?.payout && ctx2top?.payout ? "/" : ""}{ctx2top?.payout ? `×${ctx2top.payout}` : ""}
                  </div>
                )}
                <button onClick={() => handleCopyCol("top")} tabIndex={-1} className="text-[10px] text-blue-200 underline mt-0.5 hover:text-white transition-colors">
                  ({t.copy})
                </button>
              </th>
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[21%]">
                <div className="text-[12px]">{t.bottom}</div>
                {ctx2bot?.payout ? <div className="text-[10px] text-ap-green font-bold mt-0.5">×{ctx2bot.payout}</div> : null}
                <button onClick={() => handleCopyCol("bot")} tabIndex={-1} className="text-[10px] text-blue-200 underline mt-0.5 hover:text-white transition-colors">
                  ({t.copy})
                </button>
              </th>
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[21%]">
                <div className="text-[12px]">{t.tod}</div>
                {ctx3tod?.payout ? <div className="text-[10px] text-ap-green font-bold mt-0.5">×{ctx3tod.payout}</div> : null}
                <button onClick={() => handleCopyCol("tod")} tabIndex={-1} className="text-[10px] text-blue-200 underline mt-0.5 hover:text-white transition-colors">
                  ({t.copy})
                </button>
              </th>
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[9%] text-[12px]">{t.delete}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const is2 = row.digits === 2;
              return (
                <tr key={row.id} className={i % 2 === 0 ? "bg-white hover:bg-gray-200" : "bg-ap-bg/40 hover:bg-ap-bg"} style={{ transition: "background 0.1s" }}>
                  <td className="border border-ap-border px-2 py-1 text-center font-extrabold text-ap-blue tabular-nums text-[14px]">
                    {row.number}
                  </td>
                  {/* บน */}
                  <td className="border border-ap-border p-0">
                    <input
                      type="text" inputMode="numeric" value={row.top}
                      ref={(el) => { if (el) inputRefs.current.set(`${row.id}-top`, el); else inputRefs.current.delete(`${row.id}-top`); }}
                      onChange={(e) => updateRow(row.id, "top", e.target.value)}
                      onKeyDown={(e) => handleCellKeyDown(e, row.id, "top")}
                      onBlur={(e) => { const err = validateCell(e.target.value, is2 ? ctx2top : ctx3top); if (err) showToast(err); }}
                      placeholder={is2 ? (ctx2top ? `${ctx2top.minBet}-${ctx2top.maxBet}` : "") : (ctx3top ? `${ctx3top.minBet}-${ctx3top.maxBet}` : "")}
                      className={inputCls}
                    />
                  </td>
                  {/* ล่าง */}
                  <td className={`border border-ap-border p-0 ${!is2 ? "bg-gray-200" : ""}`}>
                    {is2
                      ? <input type="text" inputMode="numeric" value={row.bot}
                          ref={(el) => { if (el) inputRefs.current.set(`${row.id}-bot`, el); else inputRefs.current.delete(`${row.id}-bot`); }}
                          onChange={(e) => updateRow(row.id, "bot", e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, row.id, "bot")}
                          onBlur={(e) => { const err = validateCell(e.target.value, ctx2bot); if (err) showToast(err); }}
                          placeholder={ctx2bot ? `${ctx2bot.minBet}-${ctx2bot.maxBet}` : ""}
                          className={inputCls} />
                      : <div className="py-1.5 text-center text-ap-tertiary text-[11px]">—</div>
                    }
                  </td>
                  {/* โต๊ด */}
                  <td className={`border border-ap-border p-0 ${is2 ? "bg-gray-200" : ""}`}>
                    {!is2
                      ? <input type="text" inputMode="numeric" value={row.tod}
                          ref={(el) => { if (el) inputRefs.current.set(`${row.id}-tod`, el); else inputRefs.current.delete(`${row.id}-tod`); }}
                          onChange={(e) => updateRow(row.id, "tod", e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, row.id, "tod")}
                          onBlur={(e) => { const err = validateCell(e.target.value, ctx3tod); if (err) showToast(err); }}
                          placeholder={ctx3tod ? `${ctx3tod.minBet}-${ctx3tod.maxBet}` : ""}
                          className={inputCls} />
                      : <div className="py-1.5 text-center text-ap-tertiary text-[11px]">—</div>
                    }
                  </td>
                  <td className="border border-ap-border px-1 py-1 text-center">
                    <button
                      tabIndex={-1}
                      onClick={() => deleteRow(row.id)}
                      className="w-6 h-6 rounded-lg bg-ap-red/10 hover:bg-ap-red text-ap-red hover:text-white transition-colors flex items-center justify-center mx-auto text-[12px]"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Input row */}
            <tr className="bg-ap-blue/5 border-t-2 border-ap-blue/20">
              <td className="border border-ap-border p-0">
                <input
                  ref={inputRef}
                  type="text" inputMode="numeric"
                  value={inputNum}
                  onChange={(e) => handleNumInput(e.target.value)}
                  onKeyDown={handleNumKeyDown}
                  placeholder={t.inputNumberPlaceholder}
                  maxLength={3}
                  className="w-full text-center text-[13px] font-bold text-ap-blue outline-none bg-transparent tabular-nums py-2 placeholder:text-ap-tertiary placeholder:font-normal placeholder:text-[11px]"
                />
              </td>
              <td className="border border-ap-border bg-ap-bg/40" />
              <td className="border border-ap-border bg-ap-bg/40" />
              <td className="border border-ap-border bg-ap-bg/40" />
              <td className="border border-ap-border bg-ap-bg/40" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* หมายเหตุ */}
      <div className="px-4 pb-3 pt-1 flex items-center gap-2">
        <label className="text-[12px] text-ap-secondary font-semibold whitespace-nowrap">{t.note}:</label>
        <input
          type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={t.notePlaceholder}
          className="flex-1 border border-ap-border rounded-xl px-3 py-1.5 text-[12px] outline-none focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10 bg-white transition-all"
        />
        {lotteryLogo
          ? <img src={lotteryLogo} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
          : lotteryFlag ? <span className="text-[22px] leading-none">{lotteryFlag}</span> : null
        }
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={clearAll}
          className="flex-1 py-2.5 rounded-xl border border-ap-border text-[13px] font-semibold text-ap-secondary hover:bg-ap-bg active:scale-95 transition-all"
        >
          {t.clearAll}
        </button>
        <button
          onClick={handleSubmit} disabled={!canSubmit}
          className={[
            "flex-[2] py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95",
            canSubmit
              ? "bg-ap-blue text-white hover:bg-ap-blue-h shadow-md"
              : "bg-ap-bg border border-dashed border-ap-border text-ap-tertiary cursor-not-allowed",
          ].join(" ")}
        >
          + {t.addBill}
        </button>
      </div>
    </div>
  );
}
