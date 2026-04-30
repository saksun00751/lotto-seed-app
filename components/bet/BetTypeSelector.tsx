"use client";
import { BetTypeId, BET_RATE } from "./types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BettingContext } from "@/lib/types/bet";

interface GroupDef {
  key: string;
  labelKey: string;
  fallback: string;
  types: { id: BetTypeId; labelKey: "top" | "bottom" | "tod" }[];
}

const GROUPS: GroupDef[] = [
  { key: "3digit", labelKey: "betGroup3digit", fallback: "3 ตัว", types: [{ id: "3top", labelKey: "top" }, { id: "3tod", labelKey: "tod" }] },
  { key: "2digit", labelKey: "betGroup2digit", fallback: "2 ตัว", types: [{ id: "2top", labelKey: "top" }, { id: "2bot", labelKey: "bottom" }] },
  { key: "run",    labelKey: "betGroupRun",    fallback: "วิ่ง",   types: [{ id: "run",  labelKey: "top" }, { id: "winlay", labelKey: "bottom" }] },
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

export default function BetTypeSelector({ betType, onChange, selected3, selected2, selectedRun, onToggle3, onToggle2, onToggleRun, visibleIds, disabled = false, bettingContext }: Props) {
  const t = useTranslation("bet");

  const getPayout = (id: BetTypeId): string => {
    const p = bettingContext?.[id]?.payout ?? BET_RATE[id];
    return p ? `×${p}` : "";
  };

  // filter groups by visibleIds
  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    types: visibleIds ? g.types.filter((bt) => visibleIds.includes(bt.id)) : g.types,
  })).filter((g) => g.types.length > 0);

  // determine which group is currently active
  const activeGroupKey = visibleGroups.find((g) => g.types.some((bt) => bt.id === betType))?.key ?? visibleGroups[0]?.key;

  const handleSelect = (groupKey: string, typeId: BetTypeId) => {
    if (disabled) return;
    if (groupKey === "3digit" && activeGroupKey === "3digit" && onToggle3) {
      onToggle3(typeId);
      return;
    }
    if (groupKey === "2digit" && activeGroupKey === "2digit" && onToggle2) {
      onToggle2(typeId);
      return;
    }
    if (groupKey === "run" && activeGroupKey === "run" && onToggleRun) {
      onToggleRun(typeId);
      return;
    }
    onChange(typeId);
  };

  const handleGroupClick = (groupKey: string) => {
    if (disabled || groupKey === activeGroupKey) return;
    const group = visibleGroups.find((g) => g.key === groupKey)!;
    onChange(group.types[0].id);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border">
      <div className="px-4 py-2.5 bg-gradient-to-r from-ap-blue to-sky-400 border-b border-ap-border">
        <p className="text-[14px] font-bold text-white uppercase tracking-wider">{t.betTypeTitle}</p>
      </div>
      <div className="p-3 space-y-2">
        {visibleGroups.map((group) => {
          const isActive = group.key === activeGroupKey;
          return (
            <div
              key={group.key}
              className={[
                "rounded-xl border-2 transition-all overflow-hidden",
                isActive ? "border-ap-blue bg-blue-50/50" : "border-ap-border bg-ap-bg/70",
                disabled ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {/* Group header */}
              <div
                onClick={() => handleGroupClick(group.key)}
                className={[
                  "px-3 py-2 flex items-center gap-2 select-none",
                  disabled ? "cursor-not-allowed" : "cursor-pointer",
                  isActive ? "bg-ap-blue/10" : "hover:bg-ap-bg/80",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-2 h-2 rounded-full transition-all",
                    isActive ? "bg-ap-blue" : "bg-ap-tertiary/40",
                  ].join(" ")}
                />
                <span
                  className={[
                    "text-[14px] font-bold transition-colors",
                    isActive ? "text-ap-blue" : "text-ap-secondary",
                  ].join(" ")}
                >
                  {(t as Record<string, string>)[group.labelKey] ?? group.fallback}
                </span>
              </div>

              {/* Checkboxes — 3digit/2digit/run: ติ๊กได้ทั้งคู่, อื่น: single select */}
              <div className="px-3 py-2.5 flex gap-2">
                {group.types.map((bt) => {
                  const checked = group.key === "3digit" && isActive
                    ? (selected3?.includes(bt.id) ?? true)
                    : group.key === "2digit" && isActive
                      ? (selected2?.includes(bt.id) ?? true)
                      : group.key === "run" && isActive
                        ? (selectedRun?.includes(bt.id) ?? true)
                      : betType === bt.id;
                  const payout = getPayout(bt.id);
                  return (
                    <label
                      key={bt.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelect(group.key, bt.id);
                      }}
                      className={[
                        "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all flex-1",
                        !isActive
                          ? "border-transparent bg-transparent opacity-50"
                          : checked
                            ? "border-violet-400 bg-violet-50 shadow-sm"
                            : "border-ap-border bg-white hover:border-violet-300",
                        disabled ? "cursor-not-allowed" : "cursor-pointer active:scale-95",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "w-4 h-4 rounded-md border-2 flex-shrink-0 transition-all flex items-center justify-center",
                          checked && isActive ? "border-violet-500 bg-violet-500" : "border-ap-border bg-white",
                        ].join(" ")}
                      >
                        {checked && isActive && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0">
                        <span
                          className={[
                            "text-[14px] font-bold",
                            checked && isActive ? "text-violet-700" : "text-ap-primary",
                          ].join(" ")}
                        >
                          {(t as Record<string, string>)[bt.labelKey] ?? bt.labelKey}
                        </span>
                        {payout && (
                          <span
                            className={[
                              "text-[14px] font-semibold ml-1.5",
                              checked && isActive ? "text-violet-500" : "text-ap-green",
                            ].join(" ")}
                          >
                            {payout}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
