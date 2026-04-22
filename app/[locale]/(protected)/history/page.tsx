import type { Metadata } from "next";
import Link from "next/link";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import { getTranslation } from "@/lib/i18n/getTranslation";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";
import TicketList from "@/components/history/TicketList";
import TicketSearch from "@/components/history/TicketSearch";

export interface Ticket {
  id:                 number;
  draw_id:            number;
  draw_date:          string;
  market_name:        string;
  market_logo:        string;
  market_icon:        string;
  group_name:         string;
  status:             string;
  draw_status?:       string;
  draw_status_label?: string;
  result_outcome?:    string;
  result_outcome_label?: string;
  result_message?:    string;
  is_final?:          boolean;
  is_winner?:         boolean;
  item_count?:        number;
  winning_item_count?: number;
  losing_item_count?:  number;
  pending_item_count?: number;
  cancelled_at?:       string | null;
  cancelled_by_name?:  string | null;
  cancelled_by_type?:  string | null;
  cancel_reason?:      string | null;
  total_amount:          number;
  total_bet_amount:      number;
  total_discount_amount: number;
  total_net_amount:      number;
  total_win_amount?:     number;
  created_at:            string;
}

interface TicketsResponse {
  success: boolean;
  data:    Ticket[];
  pagination?: {
    page?: number;
    limit?: number;
    count?: number;
    total?: number;
    has_more?: boolean;
  };
  language?: string;
}

interface Props {
  params?:      Promise<{ locale: string }>;
  searchParams?: Promise<{ status?: string; page?: string; search?: string; draw_date?: string; limit?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params)?.locale ?? "th";
  return { title: await getPageMetaTitle(locale, "history") };
}

export default async function HistoryPage({ params, searchParams }: Props) {
  const [{ locale }, apiToken, lang, sp] = await Promise.all([
    params ?? Promise.resolve({ locale: "th" }),
    getApiToken(),
    getLangCookie(),
    searchParams,
  ]);

  const t = getTranslation(lang, "history");

  const STATUS_TABS = [
    { id: "all",       label: t.tabAll },
    { id: "active",    label: t.tabActive },
    { id: "won",       label: t.tabWon },
    { id: "lost",      label: t.tabLost },
    { id: "cancelled", label: t.tabCancelled },
  ];

  const status    = sp?.status    ?? "all";
  const search    = sp?.search    ?? "";
  const drawDate  = sp?.draw_date ?? "";
  const limit     = [20, 50, 100].includes(Number(sp?.limit)) ? Number(sp!.limit) : 20;
  const page      = Math.max(1, Number(sp?.page ?? 1));

  let tickets: Ticket[] = [];
  let serverPage = page;
  let serverLimit = limit;
  let total = 0;
  let hasMore = false;
  try {
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status !== "all") q.set("status", status);
    if (search) q.set("search", search);
    if (drawDate) q.set("draw_date", drawDate);

    const res = await apiGet<TicketsResponse>(`/lotto/tickets?${q.toString()}`, apiToken ?? undefined, lang);
    tickets = res?.data ?? [];
    serverPage = Math.max(1, Number(res?.pagination?.page ?? page));
    serverLimit = Math.min(100, Math.max(1, Number(res?.pagination?.limit ?? limit)));
    total = Math.max(0, Number(res?.pagination?.total ?? tickets.length));
    hasMore = Boolean(res?.pagination?.has_more);
  } catch {}
  const totalPages = Math.max(1, Math.ceil(total / serverLimit));
  const pageItems  = tickets;

  function buildHref(overrides: Record<string, string | number>) {
    const q = new URLSearchParams();
    const merged = { status, search, draw_date: drawDate, limit: serverLimit, page: serverPage, ...overrides };
    if (merged.status && merged.status !== "all") q.set("status",    String(merged.status));
    if (merged.search)                            q.set("search",    String(merged.search));
    if (merged.draw_date)                         q.set("draw_date", String(merged.draw_date));
    if (Number(merged.limit) !== 20)              q.set("limit",     String(merged.limit));
    if (Number(merged.page) > 1)                  q.set("page",      String(merged.page));
    return `/${locale}/history${q.toString() ? `?${q}` : ""}`;
  }

  const pageNums: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else {
    pageNums.push(1);
    if (serverPage > 3) pageNums.push("...");
    for (let i = Math.max(2, serverPage - 1); i <= Math.min(totalPages - 1, serverPage + 1); i++) pageNums.push(i);
    if (serverPage < totalPages - 2) pageNums.push("...");
    pageNums.push(totalPages);
  }

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`}
            className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors">
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[18px] font-bold text-ap-primary leading-tight">{t.title}</h1>
            <p className="text-[12px] text-ap-secondary">{t.found} {total.toLocaleString()} {t.items}</p>
          </div>
        </div>

        {/* Search */}
        <TicketSearch search={search} drawDate={drawDate} limit={serverLimit} t={t} />

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
          {pageItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[32px] mb-3">📋</p>
              <p className="text-[14px] font-semibold text-ap-primary mb-1">{t.emptyTitle}</p>
              <p className="text-[12px] text-ap-secondary">{t.emptyDesc}</p>
              <Link href={`/${locale}/bet`}
                className="inline-block mt-4 px-6 py-2.5 bg-ap-blue text-white rounded-full text-[13px] font-semibold hover:bg-ap-blue-h transition-colors">
                {t.gobet}
              </Link>
            </div>
          ) : (
            <TicketList tickets={pageItems} t={t} />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 py-2 flex-wrap">
            {serverPage > 1 ? (
              <Link href={buildHref({ page: serverPage - 1 })}
                className="px-3 py-2 bg-white border border-ap-border rounded-xl text-[13px] font-semibold text-ap-secondary hover:bg-ap-bg transition-colors">←</Link>
            ) : (
              <span className="px-3 py-2 rounded-xl text-[13px] text-ap-border select-none">←</span>
            )}
            {pageNums.map((n, i) =>
              n === "..." ? (
                <span key={`dots-${i}`} className="px-2 py-2 text-[13px] text-ap-secondary">…</span>
              ) : (
                <Link key={n} href={buildHref({ page: n })}
                  className={[
                    "min-w-[36px] h-9 flex items-center justify-center rounded-xl text-[13px] font-semibold transition-colors",
                    serverPage === n ? "bg-ap-blue text-white" : "bg-white border border-ap-border text-ap-secondary hover:bg-ap-bg",
                  ].join(" ")}>
                  {n}
                </Link>
              )
            )}
            {hasMore || serverPage < totalPages ? (
              <Link href={buildHref({ page: serverPage + 1 })}
                className="px-3 py-2 bg-white border border-ap-border rounded-xl text-[13px] font-semibold text-ap-secondary hover:bg-ap-bg transition-colors">→</Link>
            ) : (
              <span className="px-3 py-2 rounded-xl text-[13px] text-ap-border select-none">→</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
