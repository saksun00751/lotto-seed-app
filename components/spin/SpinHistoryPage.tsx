"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang } from "@/lib/i18n/context";

interface HistoryItem {
  credit: string;
  time:   string;
}

interface HistoryGroup {
  date: string;
  data: HistoryItem[];
}


export default function SpinHistoryPage({ groups }: { groups: HistoryGroup[] }) {
  const t = useTranslation("spin");
  const { lang } = useLang();
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(20);
  const [dateFilter, setDateFilter] = useState("");

  // Flatten to a list of { date, credit, time }
  const flat = groups.flatMap((g) => g.data.map((item) => ({ date: g.date, ...item })));

  // dateFilter is YYYY-MM-DD → convert to DD/MM/YYYY for comparison
  const filtered = dateFilter
    ? flat.filter((item) => {
        const [y, m, d] = dateFilter.split("-");
        return item.date === `${d}/${m}/${y}`;
      })
    : flat;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems  = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleDateChange(val: string) {
    setDateFilter(val);
    setPage(1);
  }

  function handlePageSizeChange(val: number) {
    setPageSize(val);
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-surface-subtle flex flex-col items-center p-5 pt-6 pb-24 sm:pb-8">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/${lang}/spin`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-ui-border text-ui-text-soft text-[13px] hover:bg-surface-subtle transition-colors">
            ← {t.back.replace("← ", "")}
          </Link>
          <h1 className="text-[20px] font-bold text-ui-text">{t.history}</h1>
          {flat.length > 0 && (
            <span className="ml-auto text-[12px] text-ui-text-soft">{flat.length} {t.historyItems}</span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-ui-border bg-surface-card text-[13px] text-ui-text focus:outline-none focus:ring-2 focus:ring-ui-status-info/30"
          />
          {dateFilter && (
            <button
              onClick={() => handleDateChange("")}
              className="px-3 py-2 rounded-xl border border-ui-border bg-surface-card text-[13px] text-ui-text-soft hover:bg-surface-subtle transition-colors"
            >
              {t.filterClear}
            </button>
          )}
          <div className="flex rounded-xl border border-ui-border bg-surface-card overflow-hidden text-[13px]">
            {[10, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => handlePageSizeChange(n)}
                className={`px-3 py-2 transition-colors ${
                  pageSize === n
                    ? "bg-ui-button-primary text-ui-text-inverse font-semibold"
                    : "text-ui-text-soft hover:bg-surface-subtle"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="bg-surface-card rounded-2xl border border-ui-border p-8 text-center text-ui-text-soft text-[14px]">
            {dateFilter ? t.historyNoResult : t.historyEmpty}
          </div>
        )}

        {/* Items */}
        {pageItems.length > 0 && (() => {
          const rendered: React.ReactNode[] = [];
          let lastDate = "";
          pageItems.forEach((item, idx) => {
            if (item.date !== lastDate) {
              lastDate = item.date;
              rendered.push(
                <div key={`date-${item.date}-${idx}`} className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
                  <span className="text-[12px] font-semibold text-ui-text-soft bg-surface-subtle border border-ui-border rounded-full px-3 py-1">
                    {item.date}
                  </span>
                </div>
              );
            }
            const isLast = idx === pageItems.length - 1 || pageItems[idx + 1]?.date !== item.date;
            rendered.push(
              <div
                key={`item-${idx}`}
                className={`bg-surface-card flex items-center justify-between px-4 py-3 border-x border-ui-border ${
                  idx === 0 || pageItems[idx - 1]?.date !== item.date ? "border-t rounded-t-2xl" : "border-t"
                } ${isLast ? "border-b rounded-b-2xl" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-[14px]">🎰</span>
                  </div>
                  <span className="text-[13px] text-ui-text">{item.credit}</span>
                </div>
                <span className="text-[12px] text-ui-text-soft tabular-nums flex-shrink-0 ml-2">
                  {item.time}
                </span>
              </div>
            );
          });
          return rendered;
        })()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-ui-border bg-surface-card text-[13px] text-ui-text-soft disabled:opacity-40 hover:bg-surface-subtle transition-colors"
            >
              {t.pagePrev}
            </button>
            <span className="text-[13px] text-ui-text-soft">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-ui-border bg-surface-card text-[13px] text-ui-text-soft disabled:opacity-40 hover:bg-surface-subtle transition-colors"
            >
              {t.pageNext}
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
