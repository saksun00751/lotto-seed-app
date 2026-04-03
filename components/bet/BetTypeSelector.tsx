"use client";
import { BetTypeId, BET_TYPE_BTNS, BET_RATE } from "./types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BettingContext } from "@/lib/types/bet";

interface Props {
  betType:         BetTypeId;
  onChange:        (id: BetTypeId) => void;
  visibleIds?:     BetTypeId[];
  disabled?:       boolean;
  bettingContext?: BettingContext;
}

export default function BetTypeSelector({ betType, onChange, visibleIds, disabled = false, bettingContext }: Props) {
  const t = useTranslation("bet");
  const buttons = visibleIds?.length
    ? BET_TYPE_BTNS.filter((b) => visibleIds.includes(b.id))
    : BET_TYPE_BTNS;
  const getBetTypeLabel = (id: BetTypeId) => {
    const key = `betType${id.charAt(0).toUpperCase()}${id.slice(1)}` as keyof typeof t;
    return (t[key] as string | undefined) ?? id;
  };
  const getPayout = (id: BetTypeId): string => {
    const p = bettingContext?.[id]?.payout ?? BET_RATE[id];
    return p ? `×${p}` : "";
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border">
      <div className="px-4 py-2.5 bg-gradient-to-r from-sky-700 to-indigo-700 border-b border-ap-border">
        <p className="text-[12px] font-semibold text-white uppercase tracking-wider">{t.betTypeTitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        {buttons.map((bt) => {
          const active = betType === bt.id;
          const payout = getPayout(bt.id);
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
              <div className="min-w-0">
                <p className={`text-[13px] font-bold leading-tight ${active && !disabled ? "text-violet-700" : "text-ap-primary"}`}>
                  {getBetTypeLabel(bt.id)}
                </p>
                {payout && (
                  <p className={`text-[11px] font-semibold mt-0.5 ${active && !disabled ? "text-violet-500" : "text-ap-green"}`}>
                    {payout}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
