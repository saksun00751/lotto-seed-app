"use client";
import { useState } from "react";
import { LeftTab } from "./types";
import type { NumberLimitRow } from "@/lib/types/bet";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";

const TAB_BET_TYPES: Record<LeftTab, [string, string]> = {
  "3top": ["top3",    "tod3"   ],
  "2top": ["top2",    "bot2"   ],
  "run":  ["run_top", "run_bot"],
};

function limitFor(limits: NumberLimitRow[], number: string, betType: string): NumberLimitRow | undefined {
  // specific betType match or null (ทุกประเภท)
  return (
    limits.find((l) => l.number === number && l.betType === betType) ??
    limits.find((l) => l.number === number && l.betType === null)
  );
}

function LimitBadge({ limit, closedLabel }: { limit: NumberLimitRow | undefined; closedLabel: string }) {
  if (!limit) return <span className="text-ui-text-muted text-[14px]">—</span>;
  if (limit.isClosed)
    return <span className="bg-ui-status-error text-ui-text-inverse text-[14px] font-bold px-2 py-0.5 rounded">{closedLabel}</span>;
  return (
    <span className="bg-yellow-100 text-ui-status-warning text-[14px] font-bold px-2 py-0.5 rounded border border-yellow-300">
      ≤{limit.maxAmount?.toLocaleString()}
    </span>
  );
}

interface Props {
  lotteryName:      string;
  numberLimits:     NumberLimitRow[];
  selectedPackage?: { id?: number; name: string; image?: string; discountPercent?: number };
}

export default function BetLeftSidebar({ lotteryName, numberLimits, selectedPackage }: Props) {
  const { lang } = useLang();
  const t = useTranslation("bet");
  const TAB_COLS: Record<LeftTab, [string, string, string]> = {
    "3top": [t.numberLabel, t.betType3top, t.betType3tod],
    "2top": [t.numberLabel, t.betType2top, t.betType2bot],
    "run":  [t.numberLabel, t.betTypeRun, t.betTypeWinlay],
  };
  const leftTabs = [
    { id: "3top" as LeftTab, label: t.leftTab3 },
    { id: "2top" as LeftTab, label: t.leftTab2 },
    { id: "run" as LeftTab, label: t.leftTabRun },
  ];
  const [leftTab, setLeftTab] = useState<LeftTab>("3top");

  // unique numbers visible in current tab (closed or limited)
  const [col1, col2] = TAB_BET_TYPES[leftTab];
  const tabNumbers = [
    ...new Set(
      numberLimits
        .filter((l) => l.betType === col1 || l.betType === col2 || l.betType === null)
        .map((l) => l.number)
    ),
  ].sort();

  return (
    <div className="space-y-3">

      {/* เลขอั้น */}
      <div className="bg-surface-card rounded-2xl overflow-hidden shadow-card border border-ui-border">
        <div className="px-4 py-2.5 flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 border-b border-ui-border">
          <span className="text-[15px]">🔒</span>
          <span className="font-bold text-ui-text-inverse text-[14px]">{t.blockedNumbers}</span>
          {numberLimits.length > 0 && (
            <span className="ml-auto text-[14px] font-semibold text-ui-text-inverse bg-white/20 px-2 py-0.5 rounded-full">
              {numberLimits.length} {t.items}
            </span>
          )}
        </div>

        <div className="flex border-b border-ui-border">
          {leftTabs.map((tab) => (
            <button key={tab.id} onClick={() => setLeftTab(tab.id)}
              className={["flex-1 py-2 text-[14px] font-semibold transition-all",
                leftTab === tab.id
                  ? "bg-surface-card text-ui-text border-b-2 border-ui-selected-border"
                  : "bg-surface-subtle text-ui-text-soft hover:bg-surface-card",
              ].join(" ")}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[260px]">
          <table className="w-full text-[14px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-subtle border-b border-ui-border">
                {TAB_COLS[leftTab].map((c) => (
                  <th key={c} className="py-2 px-2 text-center text-[14px] font-semibold text-ui-text-soft uppercase tracking-wide">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabNumbers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-[14px] text-ui-text-muted">{t.noBlockedNumbers}</td>
                </tr>
              ) : (
                tabNumbers.map((num, i) => (
                  <tr key={num} className={`border-t border-ui-border ${i % 2 === 0 ? "bg-surface-card" : "bg-surface-subtle/40"}`}>
                    <td className="py-2.5 px-3 font-extrabold text-ui-status-info text-[14px] tabular-nums">{num}</td>
                    <td className="py-2.5 px-2 text-center">
                      <LimitBadge limit={limitFor(numberLimits, num, col1)} closedLabel={t.closedLabel} />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <LimitBadge limit={limitFor(numberLimits, num, col2)} closedLabel={t.closedLabel} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package ที่เลือก */}
      {selectedPackage && (
        <div className="bg-surface-card rounded-2xl overflow-hidden shadow-card border border-ui-border">
          <div className="px-4 py-2.5 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 border-b border-ui-border">
            <span className="text-[14px]">🎁</span>
            <span className="font-bold text-ui-text-inverse text-[14px]">{t.selectedPackage}</span>
          </div>
          {selectedPackage.image ? (
            <img
              src={selectedPackage.image}
              alt={selectedPackage.name}
              className="w-full object-cover"
            />
          ) : (
            <div className="px-4 py-3 text-[14px] font-semibold text-ui-text">
              {selectedPackage.name}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
