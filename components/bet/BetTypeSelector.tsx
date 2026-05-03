"use client";
import { BetTypeId, BET_RATE } from "./types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BettingContext } from "@/lib/types/bet";

type GroupKey = "3digit" | "2digit" | "run";

interface ChipDef {
  id:       BetTypeId;
  groupKey: GroupKey;
  labelKey: string;
  fallback: string;
}

const CHIPS: ChipDef[] = [
  { id: "3top",   groupKey: "3digit", labelKey: "betType3top",   fallback: "3 ตัวบน"   },
  { id: "3tod",   groupKey: "3digit", labelKey: "betType3tod",   fallback: "3 ตัวโต๊ด" },
  { id: "2top",   groupKey: "2digit", labelKey: "betType2top",   fallback: "2 ตัวบน"   },
  { id: "2bot",   groupKey: "2digit", labelKey: "betType2bot",   fallback: "2 ตัวล่าง" },
  { id: "run",    groupKey: "run",    labelKey: "betTypeRun",    fallback: "วิ่งบน"    },
  { id: "winlay", groupKey: "run",    labelKey: "betTypeWinlay", fallback: "วิ่งล่าง"  },
];

interface Props {
  betType:         BetTypeId;
  onChange:        (id: BetTypeId) => void;
  selected3?:      BetTypeId[];
  selected2?:      BetTypeId[];
  selectedRun?:    BetTypeId[];
  onToggle3?:      (id: BetTypeId) => void;
  onToggle2?:      (id: BetTypeId) => void;
  onToggleRun?:    (id: BetTypeId) => void;
  visibleIds?:     BetTypeId[];
  disabled?:       boolean;
  bettingContext?: BettingContext;
}

export default function BetTypeSelector({ onChange, selected3, selected2, selectedRun, onToggle3, onToggle2, onToggleRun, visibleIds, disabled = false, bettingContext }: Props) {
  const t = useTranslation("bet");

  const getPayout = (id: BetTypeId): string => {
    const p = bettingContext?.[id]?.payout ?? BET_RATE[id];
    return p ? `×${p}` : "";
  };

  const visibleChips = visibleIds ? CHIPS.filter((c) => visibleIds.includes(c.id)) : CHIPS;

  const isSelected = (chip: ChipDef): boolean => {
    if (chip.groupKey === "3digit") return selected3?.includes(chip.id) ?? false;
    if (chip.groupKey === "2digit") return selected2?.includes(chip.id) ?? false;
    return selectedRun?.includes(chip.id) ?? false;
  };

  const activeGroup: GroupKey | null =
    (selected3?.length ?? 0) > 0 ? "3digit"
    : (selected2?.length ?? 0) > 0 ? "2digit"
    : (selectedRun?.length ?? 0) > 0 ? "run"
    : null;

  const handleClick = (chip: ChipDef) => {
    if (disabled) return;
    // กดต่างกลุ่ม: รีเซ็ตกลุ่มอื่นแล้วตั้งกลุ่มใหม่ (LotteryLayoutPage จัดการให้)
    if (activeGroup && activeGroup !== chip.groupKey) {
      onChange(chip.id);
      return;
    }
    // กลุ่มเดิม (หรือยังว่าง): toggle
    if (chip.groupKey === "3digit" && onToggle3) return onToggle3(chip.id);
    if (chip.groupKey === "2digit" && onToggle2) return onToggle2(chip.id);
    if (chip.groupKey === "run"    && onToggleRun) return onToggleRun(chip.id);
    onChange(chip.id);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border">
      <div className="px-4 py-2.5 bg-gradient-to-r from-ap-blue to-sky-400 border-b border-ap-border flex items-center justify-between gap-3">
        <p className="text-[14px] font-bold text-white uppercase tracking-wider">{t.betTypeTitle}</p>
        {!activeGroup && !disabled && (
          <p className="text-[12px] font-semibold text-white/85 truncate">เลือกอย่างน้อย 1 ประเภท</p>
        )}
      </div>
      <div className={["p-3 grid grid-cols-2 sm:grid-cols-3 gap-2", disabled ? "opacity-40 pointer-events-none" : ""].join(" ")}>
        {visibleChips.map((chip) => {
          const checked = isSelected(chip);
          const payout = getPayout(chip.id);
          const label = (t as Record<string, string>)[chip.labelKey] ?? chip.fallback;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleClick(chip)}
              disabled={disabled}
              className={[
                "relative px-3 py-3 rounded-xl border-2 text-left transition-all flex flex-col gap-0.5",
                checked
                  ? "border-violet-500 bg-violet-50 shadow-sm"
                  : "border-ap-border bg-white hover:border-violet-300",
                disabled ? "cursor-not-allowed" : "cursor-pointer active:scale-[0.98]",
              ].join(" ")}
            >
              <span className={["text-[14px] font-bold", checked ? "text-violet-700" : "text-ap-primary"].join(" ")}>
                {label}
              </span>
              {payout && (
                <span className={["text-[13px] font-semibold", checked ? "text-violet-500" : "text-ap-green"].join(" ")}>
                  {payout}
                </span>
              )}
              {checked && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-md bg-violet-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
