"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface TxRow {
  id: number;
  label: string;
  amount: number;
  amountRaw: number;
  balanceBefore: number;
  balanceAfter: number;
  date: string;
  status: "สำเร็จ" | "รอดำเนินการ" | "ยกเลิก";
}

const TAB_IDS = ["deposit","withdraw","transfer","spin","money","cashback","memberic","bonus","other"] as const;
type TabId = typeof TAB_IDS[number];
const TAB_ICONS: Record<TabId, string> = {
  deposit:"💰", withdraw:"💸", transfer:"🔁", spin:"🎡",
  money:"💱", cashback:"♻️", memberic:"👥", bonus:"🎁", other:"🧾",
};

type TT = ReturnType<typeof useTranslation<"transactions">>;

function StatusBadge({ status, t }: { status: TxRow["status"]; t: TT }) {
  const cls =
    status === "สำเร็จ"       ? "bg-emerald-500/15 text-emerald-600" :
    status === "รอดำเนินการ" ? "bg-amber-400/15 text-amber-600"    :
                                 "bg-red-400/15 text-red-500";
  const label =
    status === "สำเร็จ"       ? t.statusSuccess :
    status === "รอดำเนินการ" ? t.statusPending  : t.statusCancelled;
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function Empty({ label, suffix }: { label: string; suffix: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-2 text-center">
      <span className="text-[40px]">📭</span>
      <p className="text-[14px] font-semibold text-ap-primary">{label}</p>
      <p className="text-[12px] text-ap-tertiary">{suffix}</p>
    </div>
  );
}

function TxCard({ tx, t }: { tx: TxRow; t: TT }) {
  const isPositive = tx.amountRaw >= 0;
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-ap-border last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ap-primary truncate">{tx.label}</p>
        <p className="text-[11px] text-ap-tertiary mt-0.5">{tx.date}</p>
        <div className="mt-1"><StatusBadge status={tx.status} t={t} /></div>
      </div>
      <div className="text-right flex-shrink-0 pl-4">
        <p className={`text-[16px] font-bold tabular-nums ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{tx.amountRaw.toFixed(2)}
        </p>
        {tx.balanceAfter > 0 && (
          <p className="text-[11px] text-ap-tertiary tabular-nums">{t.balanceAfter} {tx.balanceAfter.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}

export default function TransactionsPageClient({ locale, apiBase }: { locale: string; apiBase: string }) {
  const t = useTranslation("transactions");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const TAB_LABELS: Record<TabId, string> = {
    deposit: t.tabDeposit,
    withdraw: t.tabWithdraw,
    transfer: t.tabTransfer,
    spin: t.tabSpin,
    money: t.tabMoney,
    cashback: t.tabCashback,
    memberic: t.tabMemberic,
    bonus: t.tabBonus,
    other: t.tabOther,
  };

  const tabId = useMemo(() => {
    const current = searchParams.get("tab") as TabId | null;
    return TAB_IDS.includes(current as TabId) ? (current as TabId) : "deposit";
  }, [searchParams]);

  const [dateStart, setDateStart] = useState("");
  const [dateStop, setDateStop] = useState("");

  const [rows, setRows] = useState<TxRow[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateStartInput, setDateStartInput] = useState("");
  const [dateStopInput, setDateStopInput] = useState("");
  const PAGE_SIZE = 10;

  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams();
    if (dateStart) qs.set("date_start", dateStart);
    if (dateStop) qs.set("date_stop", dateStop);
    const endpointQuery = qs.toString();
    const endpointPath = `/api/member/history/${tabId}${endpointQuery ? `?${endpointQuery}` : ""}`;
    void apiBase;
    setLoading(true);
    setError(null);
    fetch(endpointPath, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) setRows(data.data);
        else {
          setRows([]);
          setError(data?.message ?? t.errLoad);
        }
        setPage(1);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setRows([]);
        setError(t.errLoad);
        setPage(1);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [tabId, dateStart, dateStop]);

  const onSubmitFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDateStart(dateStartInput);
    setDateStop(dateStopInput);
    setPage(1);
  };

  const onClearFilter = () => {
    setDateStart("");
    setDateStop("");
    setDateStartInput("");
    setDateStopInput("");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-5 space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`}
            className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors">
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[18px] font-bold text-ap-primary leading-tight">{t.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                const qs = new URLSearchParams({ tab: id });
                router.replace(`${pathname}?${qs.toString()}`);
              }}
              className={[
                "w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[13px] font-semibold transition-colors border",
                id === tabId
                  ? "bg-ap-blue text-white border-ap-blue shadow-sm"
                  : "bg-white text-ap-secondary border-ap-border hover:bg-ap-bg",
              ].join(" ")}
            >
              <span>{TAB_ICONS[id]}</span>
              <span>{TAB_LABELS[id]}</span>
            </button>
          ))}
        </div>

        <form onSubmit={onSubmitFilter} className="bg-white rounded-2xl border border-ap-border shadow-card p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="date"
              name="date_start"
              value={dateStartInput}
              onChange={(e) => setDateStartInput(e.target.value)}
              className="w-full border border-ap-border rounded-xl px-3 py-2 text-[13px] text-ap-primary outline-none focus:border-ap-blue"
            />
            <input
              type="date"
              name="date_stop"
              value={dateStopInput}
              onChange={(e) => setDateStopInput(e.target.value)}
              className="w-full border border-ap-border rounded-xl px-3 py-2 text-[13px] text-ap-primary outline-none focus:border-ap-blue"
            />
          </div>
          <div className="mt-2 flex gap-2 justify-center">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-ap-blue text-white text-[13px] font-semibold hover:bg-ap-blue-h transition-colors"
            >
              {t.search}
            </button>
            <button
              type="button"
              onClick={onClearFilter}
              className="px-4 py-2 rounded-xl border border-ap-border text-[13px] font-semibold text-ap-secondary hover:bg-ap-bg transition-colors"
            >
              {t.clearDate}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ap-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">{TAB_ICONS[tabId]}</span>
              <span className="text-[14px] font-bold text-ap-primary">{t.listLabel}{TAB_LABELS[tabId]}</span>
            </div>
            <span className="text-[12px] text-ap-tertiary">{rows.length} {t.listLabel}</span>
          </div>

          {loading && (
            <div className="py-16 flex items-center justify-center gap-2 text-ap-secondary text-[13px]">
              <span className="w-4 h-4 rounded-full border-2 border-ap-blue border-t-transparent animate-spin inline-block" />
              {t.loading}
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-6 text-[13px] text-ap-red">{error}</div>
          )}

          {!loading && !error && (rows.length === 0
            ? <Empty label={`${t.emptyPrefix}${TAB_LABELS[tabId]}`} suffix={t.emptySuffix} />
            : pageRows.map((tx) => <TxCard key={`${tx.id}-${tx.date}`} tx={tx} t={t} />)
          )}

          {!loading && !error && rows.length > PAGE_SIZE && (
            <div className="px-4 py-3 border-t border-ap-border flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1.5 rounded-lg border border-ap-border text-[12px] font-semibold text-ap-secondary disabled:opacity-40"
              >
                {t.pagePrev}
              </button>
              <span className="text-[12px] text-ap-secondary tabular-nums">
                {t.pageOf.replace("{cur}", String(safePage)).replace("{total}", String(totalPages))}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-ap-border text-[12px] font-semibold text-ap-secondary disabled:opacity-40"
              >
                {t.pageNext}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
