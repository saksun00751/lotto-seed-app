"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";

interface T { searchPlaceholder: string; searchBtn: string; clear: string; show: string; perPage: string; }

interface Props {
  search:   string;
  drawDate: string;
  limit:    number;
  t:        T;
}

const LIMITS = [20, 50, 100];

export default function TicketSearch({ search, drawDate, limit, t }: Props) {
  const router    = useRouter();
  const pathname  = usePathname();
  const sp        = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  function push(overrides: Record<string, string | number>) {
    const q = new URLSearchParams(sp.toString());
    q.delete("page");
    for (const [k, v] of Object.entries(overrides)) {
      if (v !== "" && v !== 0) q.set(k, String(v));
      else                     q.delete(k);
    }
    // Remove limit from URL if it's the default (20)
    if (q.get("limit") === "20") q.delete("limit");
    router.push(`${pathname}?${q.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    push({ search: searchRef.current?.value ?? "" });
  }

  return (
    <div className="space-y-2">
      {/* ค้นหาชื่อโพยหวย */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          ref={searchRef}
          defaultValue={search}
          placeholder={t.searchPlaceholder}
          className="flex-1 px-3 py-2 rounded-xl border border-border-default bg-white text-[13px] text-text-strong placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-brand-primary text-white text-[13px] font-semibold hover:bg-brand-primary-hover transition-colors"
        >
          {t.searchBtn}
        </button>
      </form>

      {/* ค้นหางวดวันที่ */}
      <div className="flex gap-2">
        <input
          type="date"
          value={drawDate}
          onChange={(e) => push({ draw_date: e.target.value })}
          className="flex-1 px-3 py-2 rounded-xl border border-border-default bg-white text-[13px] text-text-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        {(search || drawDate) && (
          <button
            onClick={() => push({ search: "", draw_date: "" })}
            className="px-3 py-2 rounded-xl border border-border-default bg-white text-[13px] text-text-default hover:bg-surface-subtle transition-colors"
          >
            {t.clear}
          </button>
        )}
      </div>

      {/* Limit row */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-text-default">{t.show}</span>
        <div className="flex rounded-xl border border-border-default bg-white overflow-hidden text-[13px]">
          {LIMITS.map((n) => (
            <button
              key={n}
              onClick={() => push({ limit: n })}
              className={`px-3 py-1.5 transition-colors ${
                limit === n
                  ? "bg-brand-primary text-white font-semibold"
                  : "text-text-default hover:bg-surface-subtle"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-text-default">{t.perPage}</span>
      </div>
    </div>
  );
}
