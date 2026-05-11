"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/context";
import type { MarketsLatestResponse } from "@/lib/api/lotto";

interface ApiDraw {
  close_at:        string | null;
  result_at:       string | null;
  draw_date:       string | null;
  status:          string;
  result_top_3:    string;
  result_bottom_2: string;
}

interface ApiMarket {
  market_id:   number;
  market_name: string;
  market_logo: string;
  market_icon: string;
  is_enabled:  boolean;
  latest_draw: ApiDraw;
}

interface ApiGroup {
  group_id:    number;
  group_code:  string;
  group_name:  string;
  description?: string;
  markets:     ApiMarket[];
}

const TAB_GRADIENTS = [
  "from-ui-button-primary to-sky-400",
  "from-emerald-500 to-teal-400",
  "from-yellow-500 to-orange-400",
  "from-violet-600 to-indigo-400",
  "from-rose-500 to-pink-400",
  "from-cyan-500 to-blue-400",
];

function timeOnly(dt: string | null): string {
  if (!dt) return "—";
  const m = dt.match(/(\d{2}:\d{2})/);
  return m ? `${m[1]} น.` : "—";
}

export default function ResultsPage() {
  const { lang } = useLang();
  const [groups,   setGroups]   = useState<ApiGroup[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lotto/markets")
      .then((r) => r.json())
      .then((res: MarketsLatestResponse) => {
        const g = res?.data?.groups ?? [];
        setGroups(g);
        if (g.length > 0) setActiveId(g[0].group_code);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, []);

  const activeGroup = groups.find((g) => g.group_code === activeId) ?? null;
  const gradient    = TAB_GRADIENTS[groups.findIndex((g) => g.group_code === activeId) % TAB_GRADIENTS.length] ?? TAB_GRADIENTS[0];

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-ui-text tracking-tight">🏆 ลิ้งค์ดูผลหวย</h1>
        <p className="text-[13px] text-ui-text-soft mt-0.5">รวมลิ้งค์ตรวจผลหวยทุกประเภท</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-ui-selected-border border-t-transparent animate-spin" />
          <p className="text-[13px] text-ui-text-soft">กำลังโหลด...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-ui-status-error">{error}</div>
      )}

      {/* Card */}
      {!loading && !error && groups.length > 0 && (
        <div className="bg-surface-card rounded-2xl border border-ui-border shadow-card overflow-hidden">

          {/* Tab bar */}
          <div className={`bg-gradient-to-r ${gradient} p-1 flex gap-1 overflow-x-auto`}>
            {groups.map((g) => (
              <button
                key={g.group_code}
                onClick={() => setActiveId(g.group_code)}
                className={[
                  "flex-shrink-0 flex-1 min-w-[72px] py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap px-2",
                  activeId === g.group_code
                    ? "bg-surface-card text-ui-text shadow-sm"
                    : "text-ui-text-inverse/80 hover:text-ui-text-inverse hover:bg-white/10",
                ].join(" ")}
              >
                {g.group_name}
              </button>
            ))}
          </div>

          {/* Tab header */}
          {activeGroup && (
            <div className={`bg-gradient-to-r ${gradient} px-4 pb-3 pt-2`}>
              <p className="text-ui-text-inverse font-bold text-[15px]">{activeGroup.group_name}</p>
              {activeGroup.description && (
                <p className="text-ui-text-inverse/80 text-[12px] mt-0.5 leading-relaxed">{activeGroup.description}</p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="divide-y divide-ap-border">
            {activeGroup?.markets.filter((m) => m.is_enabled).map((market) => {
              const draw      = market.latest_draw;
              const hasResult = !!(draw.result_top_3 && draw.result_bottom_2);
              const closeTime  = timeOnly(draw.close_at);
              const resultTime = timeOnly(draw.result_at ?? draw.draw_date);

              return (
                <div key={market.market_id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-subtle transition-colors">

                  {/* Logo / icon */}
                  <div className="w-9 flex-shrink-0">
                    {market.market_logo ? (
                      <img src={market.market_logo} alt={market.market_name} className="w-9 h-9 rounded-full object-cover border border-ui-border" />
                    ) : (
                      <span className="text-[26px]">{market.market_icon || "🎯"}</span>
                    )}
                  </div>

                  {/* Name + times */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ui-text truncate">{market.market_name}</p>
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      <span className="text-[11px] text-ui-text-soft"><span className="text-ui-status-error">⊗</span> ปิดรับ {closeTime}</span>
                      <span className="text-[11px] text-ui-text-soft"><span className="text-ui-status-success">⊙</span> ผลออก {resultTime}</span>
                    </div>
                  </div>

                  {/* Result / link */}
                  <div className="flex-shrink-0 flex justify-end">
                    {hasResult ? (
                      <a
                        href={`/${lang}/category/${activeGroup.group_code}`}
                        className="flex items-center gap-1.5 bg-teal-500 text-ui-text-inverse text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-teal-600 transition-colors tabular-nums"
                      >
                        {draw.result_top_3}
                        <span className="opacity-60">·</span>
                        {draw.result_bottom_2}
                      </a>
                    ) : (
                      <a
                        href={`/${lang}/category/${activeGroup.group_code}`}
                        className="flex items-center gap-1 text-[12px] font-semibold text-ui-status-info bg-ui-button-primary/10 px-3 py-1.5 rounded-full hover:bg-ui-button-primary hover:text-ui-text-inverse transition-all"
                      >
                        ดูผล
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
