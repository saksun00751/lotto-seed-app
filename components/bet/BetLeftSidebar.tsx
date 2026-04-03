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
  if (!limit) return <span className="text-ap-tertiary text-[10px]">—</span>;
  if (limit.isClosed)
    return <span className="bg-ap-red text-white text-[10px] font-bold px-2 py-0.5 rounded">{closedLabel}</span>;
  return (
    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-300">
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
  const [leftTab, setLeftTab] = useState<LeftTab>("2top");

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
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border">
        <div className="px-4 py-2.5 flex items-center gap-2 bg-gradient-to-r from-blue-700 to-cyan-700 border-b border-ap-border">
          <span className="text-[15px]">🔒</span>
          <span className="font-bold text-white text-[14px]">{t.blockedNumbers}</span>
          {numberLimits.length > 0 && (
            <span className="ml-auto text-[11px] font-semibold text-white bg-white/20 px-2 py-0.5 rounded-full">
              {numberLimits.length} {t.items}
            </span>
          )}
        </div>

        <div className="flex border-b border-ap-border">
          {leftTabs.map((tab) => (
            <button key={tab.id} onClick={() => setLeftTab(tab.id)}
              className={["flex-1 py-2 text-[12px] font-semibold transition-all",
                leftTab === tab.id
                  ? "bg-white text-ap-primary border-b-2 border-ap-blue"
                  : "bg-ap-bg text-ap-secondary hover:bg-white",
              ].join(" ")}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[260px]">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-ap-bg border-b border-ap-border">
                {TAB_COLS[leftTab].map((c) => (
                  <th key={c} className="py-2 px-2 text-center text-[10px] font-semibold text-ap-secondary uppercase tracking-wide">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabNumbers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-[12px] text-ap-tertiary">{t.noBlockedNumbers}</td>
                </tr>
              ) : (
                tabNumbers.map((num, i) => (
                  <tr key={num} className={`border-t border-ap-border ${i % 2 === 0 ? "bg-white" : "bg-ap-bg/40"}`}>
                    <td className="py-2.5 px-3 font-extrabold text-ap-blue text-[14px] tabular-nums">{num}</td>
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
        <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border">
          <div className="px-4 py-2.5 flex items-center gap-2 bg-gradient-to-r from-amber-700 to-orange-700 border-b border-ap-border">
            <span className="text-[14px]">🎁</span>
            <span className="font-bold text-white text-[14px]">{t.selectedPackage}</span>
          </div>
          {selectedPackage.image ? (
            <img
              src={selectedPackage.image}
              alt={selectedPackage.name}
              className="w-full object-cover"
            />
          ) : (
            <div className="px-4 py-3 text-[13px] font-semibold text-ap-primary">
              {selectedPackage.name}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
