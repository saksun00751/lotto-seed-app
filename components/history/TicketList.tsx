"use client";

import { useState } from "react";
import type { Ticket } from "@/app/[locale]/(protected)/history/page";
import { fetchSlipDetail } from "@/app/actions/history";
import type { BetSlipDetail } from "@/lib/types/bet";
import BetSlipDetailModal from "./BetSlipDetailModal";

const STATUS_STYLE: Record<string, string> = {
  active:    "bg-ap-blue/10 text-ap-blue",
  won:       "bg-green-50 text-green-700",
  lost:      "bg-red-50 text-red-600",
  pending:   "bg-yellow-50 text-yellow-700",
  cancelled: "bg-ap-bg text-ap-tertiary",
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://api.1168lot.com";

interface T { statusActive: string; statusWon: string; statusLost: string; statusPending: string; statusCancelled: string; draw: string; }

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

  const STATUS_LABEL: Record<string, string> = {
    active:    t.statusActive,
    won:       t.statusWon,
    lost:      t.statusLost,
    pending:   t.statusPending,
    cancelled: t.statusCancelled,
  };

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
        const statusLabel = ticket.status === "won" && totalWin > 0
          ? `${STATUS_LABEL[ticket.status] ?? ticket.status} (+${fmtMoney(totalWin)})`
          : (STATUS_LABEL[ticket.status] ?? ticket.status);

        const [datePart, timePart] = ticket.created_at.split(" ");

        return (
          <button
            key={ticket.id}
            onClick={() => openDetail(ticket.id)}
            disabled={!!loading}
            className={`w-full text-left px-4 py-4 flex items-center gap-3 transition-colors disabled:opacity-60 ${ticket.status === "won" ? "bg-green-50 hover:bg-green-100/80 active:bg-green-100" : "hover:bg-ap-bg/60 active:bg-ap-bg"}`}
          >
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl border border-ap-border bg-ap-bg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {ticket.market_logo ? (
                <img src={logoSrc} alt={ticket.market_name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-[18px]">🎯</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[14px] font-bold text-ap-primary truncate">{ticket.market_name}</span>
                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[ticket.status] ?? "bg-ap-bg text-ap-secondary"}`}>
                  {statusLabel}
                </span>
              </div>
                <p className="text-[11px] text-ap-secondary">
                {ticket.group_name}
                <span className="mx-1.5 text-ap-border">·</span>
                {t.draw} {ticket.draw_date}
                <span className="mx-1.5 text-ap-border">·</span>
                {timePart ?? datePart}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <p className="text-[15px] font-bold text-ap-primary tabular-nums">
                ฿{fmtMoney(totalBill)}
              </p>
            </div>
            <div className="shrink-0 ml-1">
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
