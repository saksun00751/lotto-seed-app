"use client";
import { useState } from "react";
import { LEFT_TABS, LeftTab } from "./types";
import type { NumberLimitRow } from "@/lib/db/lottery";
import type { BetSlipSummary } from "@/lib/db/bets";
import { fetchSlipDetail } from "@/app/actions/history";
import BetSlipDetailModal from "@/components/history/BetSlipDetailModal";
import type { BetSlipDetail } from "@/lib/db/bets";

const TAB_COLS: Record<LeftTab, [string, string, string]> = {
  "3top": ["เลข", "3 ตัวบน", "3 ตัวโต๊ด"],
  "2top": ["เลข", "2 ตัวบน", "2 ตัวล่าง"],
  "run":  ["เลข", "วิ่งบน",  "วิ่งล่าง"],
};

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

function LimitBadge({ limit }: { limit: NumberLimitRow | undefined }) {
  if (!limit) return <span className="text-ap-tertiary text-[10px]">—</span>;
  if (limit.isClosed)
    return <span className="bg-ap-red text-white text-[10px] font-bold px-2 py-0.5 rounded">ปิดรับ</span>;
  return (
    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-300">
      ≤{limit.maxAmount?.toLocaleString()}
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-ap-blue/10 text-ap-blue",
  won:       "bg-ap-green/10 text-ap-green",
  lost:      "bg-ap-red/10 text-ap-red",
  pending:   "bg-yellow-50 text-yellow-700",
  cancelled: "bg-ap-bg text-ap-tertiary",
  refunded:  "bg-ap-bg text-ap-secondary",
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: "ยืนยัน", won: "ถูกรางวัล", lost: "ไม่ถูก",
  pending: "รอยืนยัน", cancelled: "ยกเลิก", refunded: "คืนเงิน",
};

import type { PastResultRow } from "@/lib/db/lottery";

interface Props {
  lotteryName:   string;
  numberLimits:  NumberLimitRow[];
  myBetHistory?: BetSlipSummary[];
  pastResults?:  PastResultRow[];
}

export default function BetLeftSidebar({ lotteryName, numberLimits, myBetHistory = [], pastResults = [] }: Props) {
  const [leftTab, setLeftTab] = useState<LeftTab>("2top");
  const [detail,  setDetail]  = useState<BetSlipDetail | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function openDetail(slipId: string) {
    if (loading) return;
    setLoading(slipId);
    try {
      const data = await fetchSlipDetail(slipId);
      if (data) setDetail(data);
    } finally {
      setLoading(null);
    }
  }

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
        <div className="px-4 py-2.5 flex items-center gap-2 bg-ap-bg/60 border-b border-ap-border">
          <span className="text-[15px]">🔒</span>
          <span className="font-bold text-ap-primary text-[14px]">เลขอั้น</span>
          {numberLimits.length > 0 && (
            <span className="ml-auto text-[11px] font-semibold text-ap-red bg-ap-red/8 px-2 py-0.5 rounded-full">
              {numberLimits.length} รายการ
            </span>
          )}
        </div>

        <div className="flex border-b border-ap-border">
          {LEFT_TABS.map((t) => (
            <button key={t.id} onClick={() => setLeftTab(t.id)}
              className={["flex-1 py-2 text-[12px] font-semibold transition-all",
                leftTab === t.id
                  ? "bg-white text-ap-primary border-b-2 border-ap-blue"
                  : "bg-ap-bg text-ap-secondary hover:bg-white",
              ].join(" ")}>
              {t.label}
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
                  <td colSpan={3} className="py-6 text-center text-[12px] text-ap-tertiary">ไม่มีเลขอั้น</td>
                </tr>
              ) : (
                tabNumbers.map((num, i) => (
                  <tr key={num} className={`border-t border-ap-border ${i % 2 === 0 ? "bg-white" : "bg-ap-bg/40"}`}>
                    <td className="py-2.5 px-3 font-extrabold text-ap-blue text-[14px] tabular-nums">{num}</td>
                    <td className="py-2.5 px-2 text-center">
                      <LimitBadge limit={limitFor(numberLimits, num, col1)} />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <LimitBadge limit={limitFor(numberLimits, num, col2)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ประวัติการแทงของฉัน */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border">
        <div className="px-4 py-2.5 flex items-center gap-2 bg-ap-bg/60 border-b border-ap-border">
          <span className="text-[14px]">📋</span>
          <span className="font-bold text-ap-primary text-[14px]">ประวัติของฉัน</span>
          {myBetHistory.length > 0 && (
            <span className="ml-auto text-[11px] font-semibold text-ap-blue bg-ap-blue/8 px-2 py-0.5 rounded-full">
              {myBetHistory.length} รายการ
            </span>
          )}
        </div>
        {myBetHistory.length === 0 ? (
          <p className="py-5 text-center text-[12px] text-ap-tertiary">ยังไม่มีประวัติการแทง</p>
        ) : (
          <div className="divide-y divide-ap-border">
            {myBetHistory.map((slip) => {
              const date = slip.createdAt.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" });
              const isLoading = loading === slip.id;
              return (
                <button key={slip.id} onClick={() => openDetail(slip.id)} disabled={!!loading}
                  className="w-full text-left px-3 py-2.5 hover:bg-ap-bg/60 transition-colors flex items-center gap-2 disabled:opacity-60">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[slip.status] ?? "bg-ap-bg text-ap-secondary"}`}>
                        {STATUS_LABEL[slip.status] ?? slip.status}
                      </span>
                      <span className="text-[10px] text-ap-tertiary">{date}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[11px] text-ap-secondary truncate">#{slip.slipNo}</span>
                      <span className="text-[12px] font-bold text-ap-primary tabular-nums shrink-0">฿{slip.totalAmount.toLocaleString("th-TH")}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isLoading ? (
                      <svg className="w-3.5 h-3.5 text-ap-blue animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                        <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-ap-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {detail && <BetSlipDetailModal slip={detail} onClose={() => setDetail(null)} />}

      {/* ผลย้อนหลัง */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border">
        <div className="px-4 py-2.5 flex items-center gap-2 bg-ap-bg/60 border-b border-ap-border">
          <span className="text-[14px]">⭐</span>
          <span className="font-bold text-ap-primary text-[14px]">ผลย้อนหลัง</span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-ap-bg border-b border-ap-border">
              {["หวย", "งวดวันที่", "3 ตัวบน", "2 ตัวล่าง"].map((c) => (
                <th key={c} className="py-2 px-2 text-center text-[10px] font-semibold text-ap-secondary uppercase">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pastResults.length === 0 ? (
              <tr><td colSpan={4} className="py-5 text-center text-[12px] text-ap-tertiary">ยังไม่มีผลย้อนหลัง</td></tr>
            ) : pastResults.map((r, i) => (
              <tr key={r.date + i} className={`border-t border-ap-border ${i % 2 === 0 ? "bg-white" : "bg-ap-bg/40"}`}>
                <td className="py-2 px-2 text-[10px] text-ap-secondary truncate max-w-[55px]">{lotteryName}</td>
                <td className="py-2 px-2 text-center text-[10px] text-ap-secondary whitespace-nowrap">{r.date}</td>
                <td className="py-2 px-2 text-center font-bold text-ap-primary tabular-nums">{r.top3}</td>
                <td className="py-2 px-2 text-center font-bold text-ap-primary tabular-nums">{r.bot2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
