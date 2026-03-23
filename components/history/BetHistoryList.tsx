"use client";

import { useState } from "react";
import type { BetSlipSummary, BetSlipDetail } from "@/lib/db/bets";
import { fetchSlipDetail } from "@/app/actions/history";
import BetSlipDetailModal from "./BetSlipDetailModal";

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

interface Props {
  slips: BetSlipSummary[];
}

export default function BetHistoryList({ slips }: Props) {
  const [detail,  setDetail]  = useState<BetSlipDetail | null>(null);
  const [loading, setLoading] = useState<string | null>(null);   // slipId กำลังโหลด

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

  return (
    <>
      <div className="divide-y divide-ap-border">
        {slips.map((slip) => {
          const date = slip.createdAt.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
          const time = slip.createdAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
          const isLoading = loading === slip.id;

          return (
            <button
              key={slip.id}
              onClick={() => openDetail(slip.id)}
              disabled={!!loading}
              className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-ap-bg/60 active:bg-ap-bg transition-colors disabled:opacity-60"
            >
              {/* Left */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-bold text-ap-primary truncate">{slip.lotteryName}</span>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[slip.status] ?? "bg-ap-bg text-ap-secondary"}`}>
                    {STATUS_LABEL[slip.status] ?? slip.status}
                  </span>
                </div>
                <p className="text-[11px] text-ap-tertiary">
                  {date} {time}
                  <span className="mx-1.5 text-ap-border">·</span>
                  {slip.itemCount} รายการ
                  <span className="mx-1.5 text-ap-border">·</span>
                  <span className="font-mono">#{slip.slipNo}</span>
                </p>
              </div>

              {/* Right */}
              <div className="text-right shrink-0">
                <p className="text-[15px] font-bold text-ap-primary tabular-nums">
                  ฿{slip.totalAmount.toLocaleString("th-TH")}
                </p>
                {slip.status === "won" ? (
                  <p className="text-[12px] font-bold text-ap-green tabular-nums">
                    +฿{slip.totalPayout.toLocaleString("th-TH")}
                  </p>
                ) : (
                  <p className="text-[11px] text-ap-tertiary tabular-nums">
                    ชนะสูงสุด ฿{slip.totalPayout.toLocaleString("th-TH")}
                  </p>
                )}
              </div>

              {/* Arrow / spinner */}
              <div className="flex-shrink-0 ml-1">
                {isLoading ? (
                  <svg className="w-4 h-4 text-ap-blue animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-ap-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {detail && (
        <BetSlipDetailModal slip={detail} onClose={() => setDetail(null)} />
      )}
    </>
  );
}
