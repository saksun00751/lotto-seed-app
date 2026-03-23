"use client";
import { useState, useCallback, useRef } from "react";
import { BillRow, genId, genSlipNo, permutations } from "./types";
import type { NumberLimitRow } from "@/lib/db/lottery";

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
  lotteryName:  string;
  lotteryFlag?: string;
  bills:        BillRow[];
  numberLimits: NumberLimitRow[];
  onAddBills:   (rows: BillRow[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BetClassicForm({ lotteryFlag, bills, numberLimits, onAddBills }: Props) {
  const [rows,     setRows]     = useState<ClassicRow[]>([]);
  const [inputNum, setInputNum] = useState("");
  const [note,     setNote]     = useState("");
  const [toast,    setToast]    = useState("");
  const inputRef  = useRef<HTMLInputElement>(null);
  // ref map: rowId → input element ของ "บน"
  const topRefs   = useRef<Map<string, HTMLInputElement>>(new Map());

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  // เพิ่ม row และ return id ของ row ที่เพิ่ม (หรือที่มีอยู่แล้ว)
  const addNumber = (num: string): string | null => {
    if (num.length < 2) return null;
    const dbType = num.length === 3 ? "top3" : "top2";
    if (blocked(num, dbType, numberLimits)) { showToast(`เลข ${num} เป็นเลขอั้น`); return null; }
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
      addNumber(digits);
      setInputNum("");
    }
  };

  const handleNumKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "Tab") && inputNum.length >= 2) {
      e.preventDefault();
      const id = addNumber(inputNum);
      setInputNum("");
      if (id) {
        // focus บน input ของ row ที่เพิ่ง add
        setTimeout(() => topRefs.current.get(id)?.focus(), 0);
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
    const time   = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
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
    if (dupes.length > 0) { showToast(`เลข ${[...new Set(dupes.map((d) => d.number))].join(", ")} มีอยู่ในโพยแล้ว`); return; }

    onAddBills(newBills);
    clearAll();
  }, [canSubmit, rows, bills, note, onAddBills]);

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
                <div className="text-[12px]">หมายเลข</div>
                <button
                  onClick={handleReverse}
                  className="text-[10px] text-blue-200 underline mt-0.5 hover:text-white transition-colors"
                >
                  (กลับเลข)
                </button>
              </th>
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[21%]">
                <div className="text-[12px]">บน</div>
                <button
                  onClick={() => handleCopyCol("top")}
                  className="text-[10px] text-blue-200 underline mt-0.5 hover:text-white transition-colors"
                >
                  (คัดลอก)
                </button>
              </th>
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[21%]">
                <div className="text-[12px]">ล่าง</div>
                <button
                  onClick={() => handleCopyCol("bot")}
                  className="text-[10px] text-blue-200 underline mt-0.5 hover:text-white transition-colors"
                >
                  (คัดลอก)
                </button>
              </th>
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[21%]">
                <div className="text-[12px]">โต๊ด</div>
                <button
                  onClick={() => handleCopyCol("tod")}
                  className="text-[10px] text-blue-200 underline mt-0.5 hover:text-white transition-colors"
                >
                  (คัดลอก)
                </button>
              </th>
              <th className="border border-ap-blue/40 px-2 py-2.5 text-center font-bold w-[9%] text-[12px]">ลบ</th>
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
                      ref={(el) => { if (el) topRefs.current.set(row.id, el); else topRefs.current.delete(row.id); }}
                      onChange={(e) => updateRow(row.id, "top", e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  {/* ล่าง */}
                  <td className={`border border-ap-border p-0 ${!is2 ? "bg-gray-200" : ""}`}>
                    {is2
                      ? <input type="text" inputMode="numeric" value={row.bot}
                          onChange={(e) => updateRow(row.id, "bot", e.target.value)}
                          className={inputCls} />
                      : <div className="py-1.5 text-center text-ap-tertiary text-[11px]">—</div>
                    }
                  </td>
                  {/* โต๊ด */}
                  <td className={`border border-ap-border p-0 ${is2 ? "bg-gray-200" : ""}`}>
                    {!is2
                      ? <input type="text" inputMode="numeric" value={row.tod}
                          onChange={(e) => updateRow(row.id, "tod", e.target.value)}
                          className={inputCls} />
                      : <div className="py-1.5 text-center text-ap-tertiary text-[11px]">—</div>
                    }
                  </td>
                  <td className="border border-ap-border px-1 py-1 text-center">
                    <button
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
                  placeholder="พิมพ์ตัวเลข"
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
        <label className="text-[12px] text-ap-secondary font-semibold whitespace-nowrap">หมายเหตุ:</label>
        <input
          type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="ระบุหมายเหตุ (ถ้ามี)"
          className="flex-1 border border-ap-border rounded-xl px-3 py-1.5 text-[12px] outline-none focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10 bg-white transition-all"
        />
        {lotteryFlag && <span className="text-[22px] leading-none">{lotteryFlag}</span>}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={clearAll}
          className="flex-1 py-2.5 rounded-xl border border-ap-border text-[13px] font-semibold text-ap-secondary hover:bg-ap-bg active:scale-95 transition-all"
        >
          ล้างทั้งหมด
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
          + เพิ่มบิล
        </button>
      </div>
    </div>
  );
}
