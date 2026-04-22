"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TxRow, TxSummary, TxPagination } from "@/lib/server/transactions";

const TAB_IDS = [
  "all", "deposit", "withdraw", "lotto_bet", "lotto_refund",
  "referral", "cashback", "ic", "bonus", "game", "admin_adjust", "rollback", "other",
] as const;
type TabId = typeof TAB_IDS[number];

const TAB_ICONS: Record<TabId, string> = {
  all: "📋", deposit: "💰", withdraw: "💸", lotto_bet: "🎯",
  lotto_refund: "↩️", referral: "👥", cashback: "♻️", ic: "🤝",
  bonus: "🎁", game: "🎮", admin_adjust: "⚙️", rollback: "🔄", other: "🧾",
};

type TT = ReturnType<typeof useTranslation<"transactions">>;

function StatusBadge({ status, t }: { status: TxRow["status"]; t: TT }) {
  const map: Record<TxRow["status"], { cls: string; label: string }> = {
    SUCCESS:   { cls: "bg-emerald-500/15 text-emerald-600", label: t.statusSuccess   },
    PENDING:   { cls: "bg-amber-400/15 text-amber-600",    label: t.statusPending    },
    CANCELLED: { cls: "bg-red-400/15 text-red-500",        label: t.statusCancelled  },
    FAILED:    { cls: "bg-red-400/15 text-red-500",        label: t.statusCancelled  },
  };
  const { cls, label } = map[status] ?? map.CANCELLED;
  return <span className={`text-[13px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function DirectionBadge({ direction, t }: { direction: TxRow["direction"]; t: TT }) {
  return direction === "CREDIT"
    ? <span className="text-[12px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">{t.credit}</span>
    : <span className="text-[12px] font-bold px-1.5 py-0.5 rounded bg-red-400/10 text-red-500">{t.debit}</span>;
}

function Empty({ label, suffix }: { label: string; suffix: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-2 text-center">
      <span className="text-[40px]">📭</span>
      <p className="text-[16px] font-bold text-ap-primary">{label}</p>
      <p className="text-[14px] font-semibold text-ap-tertiary">{suffix}</p>
    </div>
  );
}

function formatNumber(value: number, locale: string): string {
  const numberLocale = locale === "th" ? "th-TH" : "en-US";
  return value.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TxCard({ tx, t, locale }: { tx: TxRow; t: TT; locale: string }) {
  const isCredit = tx.direction === "CREDIT";
  return (
    <div className="flex items-start justify-between px-4 py-3.5 border-b border-ap-border last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[15px] font-bold text-ap-primary">{tx.title}</p>
          <DirectionBadge direction={tx.direction} t={t} />
        </div>
        {tx.detail && (
          <p className="text-[13px] font-semibold text-ap-secondary mt-0.5 leading-relaxed">{tx.detail}</p>
        )}
        <p className="text-[13px] font-semibold text-ap-tertiary mt-0.5">{tx.date}</p>
        <div className="mt-1"><StatusBadge status={tx.status} t={t} /></div>
      </div>
      <div className="text-right flex-shrink-0 pl-4">
        <p className={`text-[18px] font-bold tabular-nums ${isCredit ? "text-emerald-500" : "text-red-500"}`}>
          {isCredit ? "+" : ""}{formatNumber(tx.signedAmount, locale)}
        </p>
        {tx.balanceAfter > 0 && (
          <p className="text-[13px] font-semibold text-ap-tertiary tabular-nums mt-0.5">
            {t.balanceAfter} {formatNumber(tx.balanceAfter, locale)}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryBar({ summary, t, locale }: { summary: TxSummary; t: TT; locale: string }) {
  const netPositive = summary.netAmount >= 0;
  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="text-center">
        <p className="text-[13px] text-ap-tertiary font-bold">{t.summaryTotal}</p>
        <p className="text-[17px] font-bold text-ap-primary tabular-nums">{summary.count}</p>
      </div>
      <div className="text-center">
        <p className="text-[13px] text-ap-tertiary font-bold">{t.summaryCredit}</p>
        <p className="text-[17px] font-bold text-emerald-600 tabular-nums">+{formatNumber(summary.totalCredit, locale)}</p>
      </div>
      <div className="text-center">
        <p className="text-[13px] text-ap-tertiary font-bold">{t.summaryDebit}</p>
        <p className="text-[17px] font-bold text-red-500 tabular-nums">-{formatNumber(summary.totalDebit, locale)}</p>
      </div>
      <div className="text-center">
        <p className="text-[13px] text-ap-tertiary font-bold">{t.summaryNet}</p>
        <p className={`text-[17px] font-bold tabular-nums ${netPositive ? "text-emerald-600" : "text-red-500"}`}>
          {netPositive ? "+" : ""}{formatNumber(summary.netAmount, locale)}
        </p>
      </div>
    </div>
  );
}

export default function TransactionsPageClient({ locale }: { locale: string; apiBase?: string }) {
  const t = useTranslation("transactions");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const TAB_LABELS: Record<TabId, string> = {
    all: t.tabAll, deposit: t.tabDeposit, withdraw: t.tabWithdraw,
    lotto_bet: t.tabLottoBet, lotto_refund: t.tabLottoRefund,
    referral: t.tabReferral, cashback: t.tabCashback, ic: t.tabIc,
    bonus: t.tabBonus, game: t.tabGame, admin_adjust: t.tabAdminAdjust,
    rollback: t.tabRollback, other: t.tabOther,
  };

  const tabId = useMemo(() => {
    const current = searchParams.get("tab") as TabId | null;
    return TAB_IDS.includes(current as TabId) ? (current as TabId) : "all";
  }, [searchParams]);

  const [dateStart,      setDateStart]      = useState("");
  const [dateStop,       setDateStop]        = useState("");
  const [dateStartInput, setDateStartInput] = useState("");
  const [dateStopInput,  setDateStopInput]  = useState("");
  const [page,           setPage]           = useState(1);

  const [rows,       setRows]       = useState<TxRow[]>([]);
  const [summary,    setSummary]    = useState<TxSummary>({ count: 0, totalCredit: 0, totalDebit: 0, netAmount: 0 });
  const [pagination, setPagination] = useState<TxPagination>({ page: 1, limit: 20, count: 0, total: 0, hasMore: false });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams();
    if (dateStart) qs.set("date_start", dateStart);
    if (dateStop)  qs.set("date_stop", dateStop);
    if (page > 1)  qs.set("page", String(page));
    const query = qs.toString();
    const path  = `/api/member/history/${tabId}${query ? `?${query}` : ""}`;

    setLoading(true);
    setError(null);

    fetch(path, { signal: controller.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setRows(res.data);
          if (res.summary)    setSummary(res.summary);
          if (res.pagination) setPagination(res.pagination);
        } else {
          setRows([]);
          setError(res?.message ?? t.errLoad);
        }
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setRows([]);
        setError(t.errLoad);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [tabId, dateStart, dateStop, page]);

  // reset page when tab/filter changes
  useEffect(() => { setPage(1); }, [tabId, dateStart, dateStop]);

  const onSubmitFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDateStart(dateStartInput);
    setDateStop(dateStopInput);
  };

  const onClearFilter = () => {
    setDateStart(""); setDateStop("");
    setDateStartInput(""); setDateStopInput("");
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`}
            className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors">
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="text-[22px] font-bold text-ap-primary leading-tight">{t.title}</h1>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TAB_IDS.map((id) => (
            <button key={id} type="button"
              onClick={() => {
                const qs = new URLSearchParams({ tab: id });
                router.replace(`${pathname}?${qs.toString()}`);
              }}
              className={[
                "flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[14px] font-bold transition-colors border",
                id === tabId
                  ? "bg-ap-blue text-white border-ap-blue shadow-sm"
                  : "bg-white text-ap-secondary border-ap-border hover:bg-ap-bg",
              ].join(" ")}
            >
              <span className="emoji-font">{TAB_ICONS[id]}</span>
              <span>{TAB_LABELS[id]}</span>
            </button>
          ))}
        </div>

        {/* Filter */}
        <form onSubmit={onSubmitFilter} className="bg-white rounded-2xl border border-ap-border shadow-card p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="date" value={dateStartInput} onChange={(e) => setDateStartInput(e.target.value)}
              className="w-full border border-ap-border rounded-xl px-3 py-2 text-[15px] font-semibold text-ap-primary outline-none focus:border-ap-blue" />
            <input type="date" value={dateStopInput} onChange={(e) => setDateStopInput(e.target.value)}
              className="w-full border border-ap-border rounded-xl px-3 py-2 text-[15px] font-semibold text-ap-primary outline-none focus:border-ap-blue" />
          </div>
          <div className="mt-2 flex gap-2 justify-center">
            <button type="submit"
              className="px-4 py-2 rounded-xl bg-ap-blue text-white text-[15px] font-bold hover:bg-ap-blue-h transition-colors">
              {t.search}
            </button>
            <button type="button" onClick={onClearFilter}
              className="px-4 py-2 rounded-xl border border-ap-border text-[15px] font-bold text-ap-secondary hover:bg-ap-bg transition-colors">
              {t.clearDate}
            </button>
          </div>
        </form>

        {/* Summary */}
        {!loading && !error && rows.length > 0 && (
          <SummaryBar summary={summary} t={t} locale={locale} />
        )}

        {/* List */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ap-border flex items-center justify-between bg-slate-100/70">
            <div className="flex items-center gap-2">
              <span className="text-[20px] emoji-font">{TAB_ICONS[tabId]}</span>
              <span className="text-[16px] font-bold text-ap-primary">{TAB_LABELS[tabId]}</span>
            </div>
            <span className="text-[14px] font-bold text-ap-tertiary tabular-nums">
              {pagination.total > 0 ? `${pagination.total} ${t.listLabel}` : ""}
            </span>
          </div>

          {loading && (
            <div className="py-16 flex items-center justify-center gap-2 text-ap-secondary text-[15px] font-semibold">
              <span className="w-4 h-4 rounded-full border-2 border-ap-blue border-t-transparent animate-spin inline-block" />
              {t.loading}
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-6 text-[15px] font-semibold text-ap-red">{error}</div>
          )}

          {!loading && !error && (rows.length === 0
            ? <Empty label={`${t.emptyPrefix}${TAB_LABELS[tabId]}`} suffix={t.emptySuffix} />
            : rows.map((tx) => <TxCard key={`${tx.id}-${tx.date}`} tx={tx} t={t} locale={locale} />)
          )}

          {/* Pagination */}
          {!loading && !error && pagination.total > pagination.limit && (
            <div className="px-4 py-3 border-t border-ap-border flex items-center justify-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-ap-border text-[14px] font-bold text-ap-secondary disabled:opacity-40">
                {t.pagePrev}
              </button>
              <span className="text-[14px] font-bold text-ap-secondary tabular-nums">
                {t.pageOf.replace("{cur}", String(page)).replace("{total}", String(totalPages))}
              </span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!pagination.hasMore && page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-ap-border text-[14px] font-bold text-ap-secondary disabled:opacity-40">
                {t.pageNext}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
