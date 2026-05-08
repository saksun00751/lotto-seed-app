"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

export default function BetHistoryFilters() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const formRef     = useRef<HTMLFormElement>(null);

  function submit() {
    if (!formRef.current) return;
    const fd     = new FormData(formRef.current);
    const q      = new URLSearchParams();
    const search  = (fd.get("search") as string).trim();
    const dateFrom = fd.get("dateFrom") as string;
    const dateTo   = fd.get("dateTo") as string;
    const status   = searchParams.get("status");

    if (status && status !== "all") q.set("status", status);
    if (search)   q.set("search", search);
    if (dateFrom) q.set("dateFrom", dateFrom);
    if (dateTo)   q.set("dateTo",   dateTo);

    router.push(`/history${q.toString() ? `?${q}` : ""}`);
  }

  function clear() {
    const q = new URLSearchParams();
    const status = searchParams.get("status");
    if (status && status !== "all") q.set("status", status);
    router.push(`/history${q.toString() ? `?${q}` : ""}`);
  }

  const hasFilter = !!(
    searchParams.get("search") ||
    searchParams.get("dateFrom") ||
    searchParams.get("dateTo")
  );

  return (
    <form
      ref={formRef}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="bg-white rounded-2xl border border-border-default shadow-card p-4 space-y-3"
    >
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          name="search"
          type="text"
          defaultValue={searchParams.get("search") ?? ""}
          placeholder="ค้นหาเลขโพย หรือชื่อหวย..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-default bg-surface-subtle text-[13px] text-text-strong placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-colors"
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wide">ตั้งแต่วันที่</label>
          <input
            name="dateFrom"
            type="date"
            defaultValue={searchParams.get("dateFrom") ?? ""}
            className="w-full px-3 py-2.5 rounded-xl border border-border-default bg-surface-subtle text-[13px] text-text-strong focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted mb-1 uppercase tracking-wide">ถึงวันที่</label>
          <input
            name="dateTo"
            type="date"
            defaultValue={searchParams.get("dateTo") ?? ""}
            className="w-full px-3 py-2.5 rounded-xl border border-border-default bg-surface-subtle text-[13px] text-text-strong focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-brand-primary text-white rounded-xl text-[13px] font-semibold hover:bg-brand-primary-hover transition-colors"
        >
          ค้นหา
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={clear}
            className="px-4 py-2.5 bg-surface-subtle border border-border-default text-text-default rounded-xl text-[13px] font-semibold hover:bg-border-default/30 transition-colors"
          >
            ล้าง
          </button>
        )}
      </div>
    </form>
  );
}
