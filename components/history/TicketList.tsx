"use client";

import { useState } from "react";
import type { Ticket } from "@/app/[locale]/(protected)/history/page";
import { fetchSlipDetail } from "@/app/actions/history";
import type { BetSlipDetail } from "@/lib/types/bet";
import BetSlipDetailModal from "./BetSlipDetailModal";

const STATUS_STYLE: Record<string, string> = {
  active:    "bg-blue-100 text-blue-800 border border-blue-200",
  won:       "bg-emerald-100 text-emerald-800 border border-emerald-200",
  lost:      "bg-rose-100 text-rose-800 border border-rose-200",
  pending:   "bg-amber-100 text-amber-800 border border-amber-200",
  cancelled: "bg-slate-100 text-slate-700 border border-slate-200",
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

interface T { draw: string; }

export default function TicketList({ tickets, t }: { tickets: Ticket[]; t: T }) {
  const [detail, setDetail] = useState<BetSlipDetail | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function openDetail(ticketId: number) {
    if (loading) return;
    setLoading(String(ticketId));
    try {
      const data = await fetchSlipDetail(String(ticketId));
      if (data) setDetail(data);
    } finally {
      setLoading(null);
    }
  }

  const fmtMoney = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="divide-y divide-ap-border">
      {tickets.map((ticket) => {
        const logoSrc = ticket.market_logo?.startsWith("http")
          ? ticket.market_logo
          : `${API_BASE}${ticket.market_logo}`;
        const isLoading = loading === String(ticket.id);
        const totalBill = Number(ticket.total_net_amount || ticket.total_amount);
        const totalWin = Number(ticket.total_win_amount || 0);
        // Prefer API-provided labels/messages for status text.
        const statusText = ticket.result_outcome_label
          || ticket.draw_status_label
          || ticket.status;
        const statusLabel = ticket.status === "won" && totalWin > 0
          ? `${statusText} (+${fmtMoney(totalWin)})`
          : statusText;
        const metaText = ticket.cancel_reason
          || ticket.result_message
          || ticket.draw_status_label
          || ticket.result_outcome_label
          || ticket.status;

        return (
          <button
            key={ticket.id}
            onClick={() => openDetail(ticket.id)}
            disabled={!!loading}
            className={`w-full text-left px-3 py-3.5 sm:px-4 sm:py-4 flex items-center gap-3 transition-colors disabled:opacity-60 ${ticket.status === "won" ? "bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-100" : "hover:bg-ap-bg/70 active:bg-ap-bg"}`}
          >
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <span className="w-5 h-5 rounded-md border border-ap-border bg-ap-bg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {ticket.market_logo ? (
                    <img src={logoSrc} alt={ticket.market_name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[12px]">🎯</span>
                  )}
                </span>
                <span className="text-[16px] sm:text-[17px] font-bold text-ap-primary truncate max-w-full">{ticket.market_name}</span>
                  <span
                    title={ticket.cancel_reason ?? ticket.result_message ?? undefined}
                    className={`flex-shrink-0 text-[11px] sm:text-[12px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[ticket.status] ?? "bg-slate-100 text-slate-700 border border-slate-200"}`}
                  >
                  {statusLabel}
                </span>
              </div>
              <p className="text-[14px] font-semibold text-ap-secondary truncate">
                {t.draw} {ticket.draw_date}
              </p>
              <p className="text-[14px] font-semibold text-ap-tertiary mt-0.5 sm:mt-1 truncate" title={metaText}>
                {metaText}
              </p>
              {ticket.cancelled_at && (
                <p
                  className="text-[12px] font-semibold text-ap-tertiary mt-0.5 truncate"
                  title={[ticket.cancelled_by_name, ticket.cancelled_by_type, ticket.cancel_reason].filter(Boolean).join(" · ")}
                >
                  {ticket.cancelled_at}
                  {ticket.cancelled_by_name ? ` · ${ticket.cancelled_by_name}` : ""}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <p className="text-[16px] sm:text-[17px] font-bold text-ap-primary tabular-nums">
                ฿{fmtMoney(totalBill)}
              </p>
            </div>
            <div className="shrink-0 ml-0.5 sm:ml-1">
              {isLoading ? (
                <svg className="w-4 h-4 text-ap-blue animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
      {detail && <BetSlipDetailModal slip={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
