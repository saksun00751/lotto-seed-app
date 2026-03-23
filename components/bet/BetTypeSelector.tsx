"use client";
import { BetTypeId, BET_TYPE_BTNS } from "./types";
import type { BetRateRow } from "@/lib/db/lottery";

interface Props {
  betType:   BetTypeId;
  onChange:  (id: BetTypeId) => void;
  betRates?: BetRateRow[];
  disabled?: boolean;
}

export default function BetTypeSelector({ betType, onChange, betRates = [], disabled = false }: Props) {
  // ถ้ามี betRates จาก DB ใช้นั้น ถ้าไม่มีใช้ hardcode fallback
  const buttons = betRates.length > 0
    ? betRates.map((r) => ({ id: r.id, label: r.label, rate: r.rate }))
    : BET_TYPE_BTNS.map((b) => ({ id: b.id, label: b.label, rate: b.rate }));

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border p-4">
      <p className="text-[12px] font-semibold text-ap-secondary uppercase tracking-wider mb-3">ประเภทการแทง</p>
      <div className="grid grid-cols-3 gap-2">
        {buttons.map((bt) => {
          const active = betType === bt.id;
          return (
            <button key={bt.id} onClick={() => !disabled && onChange(bt.id)} disabled={disabled}
              className={[
                "flex items-center gap-2.5 px-3 py-3 rounded-2xl border-2 transition-all text-left",
                disabled
                  ? "border-ap-border bg-ap-bg opacity-40 cursor-not-allowed"
                  : active
                    ? "border-violet-400 bg-violet-50 active:scale-95"
                    : "border-ap-border bg-ap-bg hover:border-ap-blue/30 active:scale-95",
              ].join(" ")}>
              <span className={[
                "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all",
                active && !disabled ? "border-violet-500 bg-violet-500" : "border-ap-border bg-white",
              ].join(" ")} />
              <div>
                <p className={`text-[13px] font-bold leading-tight ${active && !disabled ? "text-violet-700" : "text-ap-primary"}`}>{bt.label}</p>
                <p className={`text-[11px] mt-0.5 ${active && !disabled ? "text-violet-500" : "text-ap-secondary"}`}>จ่าย {bt.rate}x</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
