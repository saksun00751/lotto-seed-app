import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Navbar from "@/components/layout/NavbarServer";
import { requireAuth } from "@/lib/session/auth";
import { getBetHistory } from "@/lib/db/bets";
import BetHistoryList from "@/components/history/BetHistoryList";
import BetHistoryFilters from "@/components/history/BetHistoryFilters";

export const metadata: Metadata = { title: "ประวัติการแทง — Lotto" };

interface Props {
  searchParams?: Promise<{
    status?:   string;
    page?:     string;
    search?:   string;
    dateFrom?: string;
    dateTo?:   string;
  }>;
}

const STATUS_TABS = [
  { id: "all",       label: "ทั้งหมด" },
  { id: "confirmed", label: "ยืนยัน" },
  { id: "won",       label: "ถูกรางวัล" },
  { id: "lost",      label: "ไม่ถูก" },
  { id: "cancelled", label: "ยกเลิก" },
];

const PER_PAGE = 20;

export default async function HistoryPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([requireAuth(), searchParams]);

  const phone    = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  const status   = params?.status ?? "all";
  const search   = params?.search ?? "";
  const dateFrom = params?.dateFrom ?? "";
  const dateTo   = params?.dateTo ?? "";
  const page     = Math.max(1, Number(params?.page ?? 1));
  const skip     = (page - 1) * PER_PAGE;

  const { slips, total } = await getBetHistory(user.id, {
    status, search, dateFrom, dateTo, skip, limit: PER_PAGE,
  });
  const totalPages = Math.ceil(total / PER_PAGE);

  function buildHref(overrides: Record<string, string | number>) {
    const q = new URLSearchParams();
    const merged = { status, search, dateFrom, dateTo, page, ...overrides };
    if (merged.status && merged.status !== "all") q.set("status", String(merged.status));
    if (merged.search)   q.set("search",   String(merged.search));
    if (merged.dateFrom) q.set("dateFrom", String(merged.dateFrom));
    if (merged.dateTo)   q.set("dateTo",   String(merged.dateTo));
    if (Number(merged.page) > 1) q.set("page", String(merged.page));
    return `/history${q.toString() ? `?${q}` : ""}`;
  }

  // Page numbers to show (max 5 around current)
  const pageNums: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else {
    pageNums.push(1);
    if (page > 3) pageNums.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNums.push(i);
    if (page < totalPages - 2) pageNums.push("...");
    pageNums.push(totalPages);
  }

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors">
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[18px] font-bold text-ap-primary leading-tight">ประวัติการแทงหวย</h1>
            <p className="text-[12px] text-ap-tertiary">พบ {total.toLocaleString("th-TH")} รายการ</p>
          </div>
        </div>

        {/* Filters (client) */}
        <Suspense>
          <BetHistoryFilters />
        </Suspense>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <Link key={tab.id} href={buildHref({ status: tab.id, page: 1 })}
              className={[
                "flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors",
                status === tab.id
                  ? "bg-ap-blue text-white"
                  : "bg-white border border-ap-border text-ap-secondary hover:bg-ap-bg",
              ].join(" ")}>
              {tab.label}
            </Link>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          {slips.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[32px] mb-3">📋</p>
              <p className="text-[14px] font-semibold text-ap-primary mb-1">ไม่พบรายการ</p>
              <p className="text-[12px] text-ap-tertiary">ลองเปลี่ยนเงื่อนไขการค้นหา</p>
              <Link href="/bet" className="inline-block mt-4 px-6 py-2.5 bg-ap-blue text-white rounded-full text-[13px] font-semibold hover:bg-ap-blue-h transition-colors">
                ไปแทงหวย →
              </Link>
            </div>
          ) : (
            <BetHistoryList slips={slips} />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 py-2 flex-wrap">
            {/* Prev */}
            {page > 1 ? (
              <Link href={buildHref({ page: page - 1 })}
                className="px-3 py-2 bg-white border border-ap-border rounded-xl text-[13px] font-semibold text-ap-secondary hover:bg-ap-bg transition-colors">
                ←
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-xl text-[13px] text-ap-border select-none">←</span>
            )}

            {/* Page numbers */}
            {pageNums.map((n, i) =>
              n === "..." ? (
                <span key={`dots-${i}`} className="px-2 py-2 text-[13px] text-ap-tertiary">…</span>
              ) : (
                <Link key={n} href={buildHref({ page: n })}
                  className={[
                    "min-w-[36px] h-9 flex items-center justify-center rounded-xl text-[13px] font-semibold transition-colors",
                    page === n
                      ? "bg-ap-blue text-white"
                      : "bg-white border border-ap-border text-ap-secondary hover:bg-ap-bg",
                  ].join(" ")}>
                  {n}
                </Link>
              )
            )}

            {/* Next */}
            {page < totalPages ? (
              <Link href={buildHref({ page: page + 1 })}
                className="px-3 py-2 bg-white border border-ap-border rounded-xl text-[13px] font-semibold text-ap-secondary hover:bg-ap-bg transition-colors">
                →
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-xl text-[13px] text-ap-border select-none">→</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
