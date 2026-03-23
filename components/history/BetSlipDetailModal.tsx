"use client";

import { useEffect, useRef } from "react";
import type { BetSlipDetail } from "@/lib/db/bets";

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
  slip:     BetSlipDetail;
  onClose:  () => void;
}

export default function BetSlipDetailModal({ slip, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ปิดด้วย Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ล็อค scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const date = slip.createdAt.toLocaleDateString("th-TH", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const time = slip.createdAt.toLocaleTimeString("th-TH", {
    hour: "2-digit", minute: "2-digit",
  });

  const winItems  = slip.items.filter((i) => i.isWin === true);
  const totalWin  = winItems.reduce((s, i) => s + (i.actualPayout ?? i.payout), 0);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-ap-border flex-shrink-0">
          {/* Drag handle (mobile) */}
          <div className="w-10 h-1 bg-ap-border rounded-full mx-auto mb-4 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[16px] font-bold text-ap-primary">{slip.lotteryName}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[slip.status] ?? "bg-ap-bg text-ap-secondary"}`}>
                  {STATUS_LABEL[slip.status] ?? slip.status}
                </span>
              </div>
              <p className="text-[12px] text-ap-tertiary">
                <span className="font-mono">#{slip.slipNo}</span>
                <span className="mx-1.5">·</span>
                {date} {time}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-ap-bg flex items-center justify-center text-ap-secondary hover:bg-ap-border/40 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Items list */}
        <div className="overflow-y-auto flex-1">
          {/* Column header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-5 py-2 bg-ap-bg text-[11px] font-semibold text-ap-tertiary uppercase tracking-wide sticky top-0">
            <span>เลข / ประเภท</span>
            <span className="text-right">ยอดแทง</span>
            <span className="text-right">อัตรา</span>
            <span className="text-right">ชนะ</span>
          </div>

          <div className="divide-y divide-ap-border">
            {slip.items.map((item) => (
              <div
                key={item.id}
                className={[
                  "grid grid-cols-[1fr_auto_auto_auto] gap-2 px-5 py-3 items-center",
                  item.isWin === true  ? "bg-ap-green/5" : "",
                  item.isWin === false ? "bg-ap-red/5"   : "",
                ].join(" ")}
              >
                {/* เลข + ประเภท */}
                <div>
                  <span className="text-[18px] font-bold text-ap-primary tabular-nums tracking-widest">{item.number}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-ap-secondary">{item.betTypeLabel}</span>
                    {item.isWin === true && (
                      <span className="text-[10px] font-bold bg-ap-green/10 text-ap-green px-1.5 py-0.5 rounded-full">ถูก ✓</span>
                    )}
                    {item.isWin === false && (
                      <span className="text-[10px] font-bold bg-ap-red/10 text-ap-red px-1.5 py-0.5 rounded-full">ไม่ถูก</span>
                    )}
                  </div>
                </div>
                {/* ยอดแทง */}
                <span className="text-[13px] font-semibold text-ap-primary tabular-nums text-right">
                  ฿{item.amount.toLocaleString("th-TH")}
                </span>
                {/* อัตรา */}
                <span className="text-[13px] text-ap-secondary tabular-nums text-right">
                  ×{item.payRate}
                </span>
                {/* ชนะสูงสุด / จริง */}
                <span className={`text-[13px] font-semibold tabular-nums text-right ${item.isWin === true ? "text-ap-green" : "text-ap-tertiary"}`}>
                  {item.isWin === true
                    ? `+฿${(item.actualPayout ?? item.payout).toLocaleString("th-TH")}`
                    : `฿${item.payout.toLocaleString("th-TH")}`
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer summary */}
        <div className="px-5 py-4 border-t border-ap-border bg-ap-bg flex-shrink-0 space-y-1.5">
          {slip.note && (
            <p className="text-[12px] text-ap-secondary mb-2">หมายเหตุ: {slip.note}</p>
          )}
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-ap-secondary">{slip.itemCount} รายการ</span>
            <span className="text-[15px] font-bold text-ap-primary tabular-nums">
              ยอดแทง ฿{slip.totalAmount.toLocaleString("th-TH")}
            </span>
          </div>
          {slip.status === "won" && totalWin > 0 ? (
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-ap-secondary">ได้รับจริง</span>
              <span className="text-[16px] font-bold text-ap-green tabular-nums">+฿{totalWin.toLocaleString("th-TH")}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-ap-secondary">ชนะสูงสุด</span>
              <span className="text-[14px] font-semibold text-ap-tertiary tabular-nums">฿{slip.totalPayout.toLocaleString("th-TH")}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
